-- Remove Supabase default grants before applying the intended least-privilege set.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.workspaces, public.workspace_members, public.trips, public.trip_days,
  public.city_visits, public.trip_stops, public.trip_participants, public.trip_vehicle_assignments,
  public.lodging_stays, public.import_runs, public.legacy_records to authenticated;
grant select, insert, update on public.profiles, public.workspace_settings to authenticated;
grant select, insert, update, delete on public.cities, public.corridors, public.corridor_cities,
  public.sources, public.source_events, public.food_places, public.vehicles, public.source_visits,
  public.notes, public.trip_expenses, public.evidence_records to authenticated;

alter table public.sources add unique(workspace_id,city_id,id);
alter table public.source_visits add foreign key(workspace_id,city_id,source_id)
  references public.sources(workspace_id,city_id,id);
alter table public.food_places add constraint halal_evidence_required
  check(status='unverified' or (coalesce(evidence_url like 'https://%',false) and checked_at is not null));
alter table public.sources add constraint confirmed_source_evidence_required check(is_lead or coalesce(
  (jsonb_typeof(point)='object' and point->>'precision'='exact' and point->>'confirmed'='true'
   and nullif(trim(point->>'address'),'') is not null and jsonb_typeof(windows)='array'
   and jsonb_array_length(windows)>0 and evidence_url like 'https://%' and checked_at is not null),false));
alter table public.import_runs add unique(workspace_id,export_sha256,mapping_version);

do $$ declare tbl text; begin
  foreach tbl in array array['cities','corridors','sources','source_events','food_places','vehicles','source_visits','notes','trip_expenses','evidence_records'] loop
    execute format('drop policy create_member on public.%I',tbl);
    execute format('create policy create_member on public.%I for insert to authenticated with check(private.member(workspace_id) and created_by=(select auth.uid()))',tbl);
  end loop;
end $$;

-- Preserve every version of raw input; imports never overwrite a user's edited canonical rows.
create table public.legacy_snapshots (
  workspace_id uuid not null references public.workspaces(id), legacy_system text not null,
  entity_type text not null, legacy_id text not null, content_sha256 text not null,
  raw jsonb not null, captured_at timestamptz not null default now(),
  primary key(workspace_id,legacy_system,entity_type,legacy_id,content_sha256)
);
alter table public.legacy_snapshots enable row level security;
revoke all on public.legacy_snapshots from anon,authenticated;
grant select on public.legacy_snapshots to authenticated;
create policy read_owner on public.legacy_snapshots for select to authenticated using(private.owner(workspace_id));

-- The wrapper locks before checking a new ID, closing the concurrent-insert race.
alter function public.save_trip(uuid,uuid,integer,jsonb) rename to save_trip_unchecked;
alter function public.save_trip_unchecked(uuid,uuid,integer,jsonb) set schema private;
revoke all on function private.save_trip_unchecked(uuid,uuid,integer,jsonb) from public,anon,authenticated;
create function public.save_trip(p_workspace uuid,p_id uuid,p_expected_version integer,p_draft jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d jsonb; v jsonb; s jsonb; ids uuid[]='{}'; prev_date date; current_date_value date; source_city uuid;
begin
  if not private.member(p_workspace) then raise exception 'Not authorized' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  if p_draft is null or jsonb_typeof(p_draft)<>'object' or octet_length(p_draft::text)>150000
    or coalesce(p_expected_version,-1)<0 or (p_draft->>'id')::uuid is distinct from p_id
    or coalesce(length(p_draft->>'name'),0) not between 1 and 200
    or jsonb_typeof(p_draft->'days') is distinct from 'array'
    or jsonb_typeof(p_draft->'participants') is distinct from 'array'
    or coalesce((p_draft->>'nights')::integer,-1) not between 0 and 3
    or jsonb_array_length(p_draft->'days')<>(p_draft->>'nights')::integer+1
    or jsonb_array_length(p_draft->'participants') not between 1 and 4
    or jsonb_typeof(p_draft->'transport') is distinct from 'object'
    or jsonb_typeof(p_draft->'transport'->'vehicleIds') is distinct from 'array'
    or jsonb_array_length(p_draft->'transport'->'vehicleIds')>4
    or coalesce((p_draft->>'driveBufferMinutes')::integer,-1) not between 0 and 120
    then raise exception 'Invalid trip structure' using errcode='22023'; end if;
  if not exists(select 1 from pg_timezone_names where name=p_draft->>'homeZone') then raise exception 'Invalid home time zone'; end if;
  if coalesce(p_draft->>'returnLocal','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Invalid return time'; end if;
  perform (p_draft->>'returnDate')::date;
  ids=array_append(ids,p_id);
  for d in select * from jsonb_array_elements(p_draft->'days') loop
    if jsonb_typeof(d->'visits') is distinct from 'array' or jsonb_array_length(d->'visits')>10
      or coalesce(d->>'departureLocal','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or coalesce(d->>'deadlineLocal','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or coalesce((d->>'restMinutes')::integer,-1) not between 360 and 840
      or coalesce((d->>'mealMinutes')::integer,-1) not between 0 and 120
      or coalesce((d->>'setupMinutes')::integer,-1) not between 0 and 120
      or coalesce((d->>'extraLoadingMinutes')::integer,-1) not between 0 and 180 then raise exception 'Invalid day'; end if;
    current_date_value=(d->>'date')::date;
    if current_date_value is null or (prev_date is not null and current_date_value<=prev_date) then raise exception 'Day dates must increase'; end if;
    prev_date=current_date_value;
    ids=array_append(ids,(d->>'id')::uuid);
    for v in select * from jsonb_array_elements(d->'visits') loop
      if jsonb_typeof(v->'stops') is distinct from 'array' or jsonb_array_length(v->'stops')>30
        or coalesce((v->>'reservedMinutes')::integer,-1) not between 60 and 600
        or not exists(select 1 from pg_timezone_names where name=v->>'zone') then raise exception 'Invalid city visit'; end if;
      ids=array_append(ids,(v->>'id')::uuid);
      for s in select * from jsonb_array_elements(v->'stops') loop
        ids=array_append(ids,(s->>'id')::uuid);
        if coalesce((s->>'minutes')::integer,0) not between 1 and 600
          or coalesce((s->>'parkingMinutes')::integer,-1) not between 0 and 120
          or coalesce((s->>'loadingMinutes')::integer,-1) not between 0 and 120
          or coalesce(length(s->>'name'),0) not between 1 and 200 then raise exception 'Invalid source stop'; end if;
        if s->>'sourceId' is not null then
          select city_id into source_city from public.sources where workspace_id=p_workspace and id=(s->>'sourceId')::uuid;
          if source_city is distinct from (v->>'cityId')::uuid then raise exception 'Source belongs to another city/workspace' using errcode='42501'; end if;
        end if;
      end loop;
    end loop;
  end loop;
  if array_position(ids,null) is not null or cardinality(ids)<>(select count(distinct x) from unnest(ids) x) then raise exception 'Itinerary IDs must be unique and present'; end if;
  return private.save_trip_unchecked(p_workspace,p_id,p_expected_version,p_draft);
end $$;
revoke all on function public.save_trip(uuid,uuid,integer,jsonb) from public,anon;
grant execute on function public.save_trip(uuid,uuid,integer,jsonb) to authenticated;
