-- Dedicated Fieldwork database only. No legacy or production data is touched.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 200),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id), user_id uuid not null references auth.users(id),
  role text not null check (role in ('owner','partner')), active boolean not null default true,
  primary key(workspace_id,user_id)
);
create index workspace_members_user on public.workspace_members(user_id,workspace_id) where active;
create table public.profiles (
  id uuid primary key references auth.users(id), display_name text not null check(length(display_name) between 1 and 100)
);
create or replace function private.member(ws uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members where workspace_id=ws and user_id=(select auth.uid()) and active)
$$;
create or replace function private.owner(ws uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members where workspace_id=ws and user_id=(select auth.uid()) and active and role='owner')
$$;
revoke all on function private.member(uuid), private.owner(uuid) from public;
grant execute on function private.member(uuid), private.owner(uuid) to authenticated;

create table public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id), origin jsonb,
  home_zone text not null default 'America/Chicago', version integer not null default 1,
  updated_at timestamptz not null default now()
);
create table public.cities (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  name text not null, state text not null, zone text not null, lat double precision, lng double precision,
  overview text not null default '', provenance text not null default '', corridor text not null default '',
  created_by uuid references auth.users(id) default auth.uid(), updated_at timestamptz not null default now(),
  unique(workspace_id,id), check(lat between -90 and 90), check(lng between -180 and 180)
);
create table public.corridors (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), name text not null,
  created_by uuid references auth.users(id) default auth.uid(), updated_at timestamptz not null default now(), unique(workspace_id,id)
);
create table public.corridor_cities (
  workspace_id uuid not null, corridor_id uuid not null, city_id uuid not null, position integer not null default 0,
  primary key(workspace_id,corridor_id,city_id),
  foreign key(workspace_id,corridor_id) references public.corridors(workspace_id,id),
  foreign key(workspace_id,city_id) references public.cities(workspace_id,id)
);
create table public.sources (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), city_id uuid not null,
  name text not null, category text not null check(category in ('library_sale','independent','thrift','charity','church','estate','outlet','regular_goodwill','half_price_books','other')),
  is_lead boolean not null default true, point jsonb, windows jsonb, evidence_url text, checked_at timestamptz,
  created_by uuid references auth.users(id) default auth.uid(), updated_at timestamptz not null default now(),
  unique(workspace_id,id), foreign key(workspace_id,city_id) references public.cities(workspace_id,id)
);
create table public.source_events (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), source_id uuid not null,
  name text not null, windows jsonb, evidence_url text, checked_at timestamptz,
  created_by uuid references auth.users(id) default auth.uid(), updated_at timestamptz not null default now(),
  unique(workspace_id,id), unique(workspace_id,source_id,id), foreign key(workspace_id,source_id) references public.sources(workspace_id,id)
);
create table public.food_places (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), city_id uuid not null,
  name text not null, point jsonb, windows jsonb,
  status text not null default 'unverified' check(status in ('certified','business_stated','community_reported','unverified')),
  evidence_url text, checked_at timestamptz, scope text not null default '',
  created_by uuid references auth.users(id) default auth.uid(), updated_at timestamptz not null default now(),
  unique(workspace_id,id), foreign key(workspace_id,city_id) references public.cities(workspace_id,id)
);
create table public.vehicles (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), name text not null,
  payload_kg numeric check(payload_kg>=0), volume_liters numeric check(volume_liters>=0), evidence jsonb,
  created_by uuid references auth.users(id) default auth.uid(), updated_at timestamptz not null default now(), unique(workspace_id,id)
);
create table public.trips (
  id uuid primary key, workspace_id uuid not null references public.workspaces(id), name text not null,
  version integer not null check(version>0), draft jsonb not null check(jsonb_typeof(draft)='object'),
  created_by uuid not null references auth.users(id), updated_at timestamptz not null default now(), unique(workspace_id,id)
);
create table public.trip_days (
  id uuid primary key, workspace_id uuid not null, trip_id uuid not null, day_index integer not null check(day_index between 0 and 3), date date not null,
  unique(workspace_id,id), unique(workspace_id,trip_id,id), unique(workspace_id,trip_id,day_index),
  foreign key(workspace_id,trip_id) references public.trips(workspace_id,id) on delete cascade
);
create table public.city_visits (
  id uuid primary key, workspace_id uuid not null, trip_id uuid not null, day_id uuid not null, city_id uuid not null,
  position integer not null, reserved_minutes integer not null check(reserved_minutes between 60 and 600),
  unique(workspace_id,id), unique(workspace_id,trip_id,day_id,id),
  foreign key(workspace_id,trip_id,day_id) references public.trip_days(workspace_id,trip_id,id) on delete cascade,
  foreign key(workspace_id,city_id) references public.cities(workspace_id,id)
);
create table public.trip_stops (
  id uuid primary key, workspace_id uuid not null, trip_id uuid not null, day_id uuid not null, city_visit_id uuid not null,
  source_id uuid, event_id uuid, position integer not null, data jsonb not null,
  unique(workspace_id,id),
  foreign key(workspace_id,trip_id,day_id,city_visit_id) references public.city_visits(workspace_id,trip_id,day_id,id) on delete cascade,
  foreign key(workspace_id,source_id) references public.sources(workspace_id,id),
  foreign key(workspace_id,source_id,event_id) references public.source_events(workspace_id,source_id,id),
  check(event_id is null or source_id is not null)
);
create table public.trip_participants (
  workspace_id uuid not null, trip_id uuid not null, user_id uuid not null,
  primary key(workspace_id,trip_id,user_id),
  foreign key(workspace_id,trip_id) references public.trips(workspace_id,id) on delete cascade,
  foreign key(workspace_id,user_id) references public.workspace_members(workspace_id,user_id)
);
create table public.trip_vehicle_assignments (
  workspace_id uuid not null, trip_id uuid not null, vehicle_id uuid not null,
  primary key(workspace_id,trip_id,vehicle_id),
  foreign key(workspace_id,trip_id) references public.trips(workspace_id,id) on delete cascade,
  foreign key(workspace_id,vehicle_id) references public.vehicles(workspace_id,id)
);
create table public.lodging_stays (
  workspace_id uuid not null, trip_id uuid not null, day_id uuid not null, point jsonb not null, confirmed boolean not null,
  primary key(workspace_id,trip_id,day_id),
  foreign key(workspace_id,trip_id,day_id) references public.trip_days(workspace_id,trip_id,id) on delete cascade
);
create table public.source_visits (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  city_id uuid not null, source_id uuid, trip_id uuid, visited_at timestamptz not null,
  bought integer check(bought>=0), scanned integer check(scanned>=0), usable integer check(usable>=0),
  purchase_cents integer check(purchase_cents>=0), minutes integer check(minutes>=0), notes text not null default '',
  mutation_key uuid not null, created_by uuid not null references auth.users(id) default auth.uid(),
  updated_at timestamptz not null default now(), unique(workspace_id,id), unique(workspace_id,mutation_key),
  foreign key(workspace_id,city_id) references public.cities(workspace_id,id),
  foreign key(workspace_id,source_id) references public.sources(workspace_id,id),
  foreign key(workspace_id,trip_id) references public.trips(workspace_id,id),
  check(usable is null or bought is null or usable<=bought)
);
create table public.notes (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  city_id uuid, source_id uuid, trip_id uuid, body text not null, mutation_key uuid not null,
  created_by uuid not null references auth.users(id) default auth.uid(), updated_at timestamptz not null default now(),
  unique(workspace_id,id), unique(workspace_id,mutation_key),
  foreign key(workspace_id,city_id) references public.cities(workspace_id,id),
  foreign key(workspace_id,source_id) references public.sources(workspace_id,id),
  foreign key(workspace_id,trip_id) references public.trips(workspace_id,id),
  check(num_nonnulls(city_id,source_id,trip_id)=1)
);
create table public.trip_expenses (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, trip_id uuid not null,
  name text not null, cents integer check(cents>=0), currency text not null default 'USD', inclusion_basis text not null,
  mutation_key uuid not null, created_by uuid not null references auth.users(id) default auth.uid(),
  updated_at timestamptz not null default now(), unique(workspace_id,id), unique(workspace_id,mutation_key),
  foreign key(workspace_id,trip_id) references public.trips(workspace_id,id)
);
create table public.evidence_records (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  source_id uuid, food_id uuid, city_id uuid, claim text not null, url text, checked_at timestamptz, scope text,
  created_by uuid references auth.users(id) default auth.uid(), updated_at timestamptz not null default now(), unique(workspace_id,id),
  foreign key(workspace_id,source_id) references public.sources(workspace_id,id),
  foreign key(workspace_id,food_id) references public.food_places(workspace_id,id),
  foreign key(workspace_id,city_id) references public.cities(workspace_id,id),
  check(num_nonnulls(source_id,food_id,city_id)=1)
);
create table public.import_runs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  export_sha256 text not null, mapping_version text not null, report jsonb not null, created_at timestamptz not null default now()
);
create table public.legacy_records (
  workspace_id uuid not null references public.workspaces(id), legacy_system text not null, entity_type text not null, legacy_id text not null,
  new_id uuid, raw jsonb not null, status text not null, warning text, content_sha256 text not null,
  primary key(workspace_id,legacy_system,entity_type,legacy_id)
);
create table private.route_budgets (
  workspace_id uuid not null references public.workspaces(id), user_id uuid not null references auth.users(id),
  bucket timestamptz not null, requests integer not null, primary key(workspace_id,user_id,bucket)
);

create or replace function private.immutable_tenant() returns trigger language plpgsql set search_path='' as $$
begin
  if new.workspace_id is distinct from old.workspace_id then raise exception 'Tenant reassignment is forbidden'; end if;
  if (to_jsonb(new)->>'created_by') is distinct from (to_jsonb(old)->>'created_by') then raise exception 'Creator is immutable'; end if;
  if to_jsonb(new) ? 'updated_at' then new.updated_at=now(); end if;
  return new;
end $$;
revoke all on function private.immutable_tenant() from public;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_settings enable row level security;
grant select on public.workspaces,public.workspace_members to authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,update on public.workspace_settings to authenticated;
create policy workspace_read on public.workspaces for select to authenticated using(private.member(id));
create policy member_read on public.workspace_members for select to authenticated using(private.member(workspace_id));
create policy profile_read on public.profiles for select to authenticated using(id=(select auth.uid()) or exists(select 1 from public.workspace_members m where m.user_id=profiles.id and private.member(m.workspace_id)));
create policy profile_create on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy settings_read on public.workspace_settings for select to authenticated using(private.member(workspace_id));
create policy settings_create on public.workspace_settings for insert to authenticated with check(private.owner(workspace_id));
create policy settings_update on public.workspace_settings for update to authenticated using(private.owner(workspace_id)) with check(private.owner(workspace_id));
create trigger settings_tenant before update on public.workspace_settings for each row execute function private.immutable_tenant();

do $$
declare tbl text;
begin
  foreach tbl in array array['cities','corridors','corridor_cities','sources','source_events','food_places','vehicles','source_visits','notes','trip_expenses','evidence_records'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('grant select,insert,update,delete on public.%I to authenticated',tbl);
    execute format('create policy read_member on public.%I for select to authenticated using(private.member(workspace_id))',tbl);
    execute format('create policy create_member on public.%I for insert to authenticated with check(private.member(workspace_id) and coalesce((to_jsonb(%I)->>''created_by'')::uuid,(select auth.uid()))=(select auth.uid()))',tbl,tbl);
    execute format('create policy update_member on public.%I for update to authenticated using(private.member(workspace_id)) with check(private.member(workspace_id))',tbl);
    execute format('create policy delete_member on public.%I for delete to authenticated using(private.member(workspace_id))',tbl);
    execute format('create trigger tenant_guard before update on public.%I for each row execute function private.immutable_tenant()',tbl);
    execute format('create index on public.%I(workspace_id)',tbl);
  end loop;
  foreach tbl in array array['trips','trip_days','city_visits','trip_stops','trip_participants','trip_vehicle_assignments','lodging_stays'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('grant select on public.%I to authenticated',tbl);
    execute format('create policy read_member on public.%I for select to authenticated using(private.member(workspace_id))',tbl);
    execute format('create index on public.%I(workspace_id)',tbl);
  end loop;
  foreach tbl in array array['import_runs','legacy_records'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('grant select on public.%I to authenticated',tbl);
    execute format('create policy read_owner on public.%I for select to authenticated using(private.owner(workspace_id))',tbl);
  end loop;
end $$;
revoke all on all tables in schema public from anon;
revoke all on all tables in schema private from anon,authenticated;

create or replace function public.consume_route_budget(p_workspace uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare count integer; current_bucket timestamptz=date_trunc('hour',now());
begin
  if not private.member(p_workspace) then raise exception 'Not authorized' using errcode='42501'; end if;
  insert into private.route_budgets(workspace_id,user_id,bucket,requests) values(p_workspace,auth.uid(),current_bucket,1)
    on conflict(workspace_id,user_id,bucket) do update set requests=private.route_budgets.requests+1 returning requests into count;
  return count<=30;
end $$;
revoke all on function public.consume_route_budget(uuid) from public;
grant execute on function public.consume_route_budget(uuid) to authenticated;

create or replace function public.save_trip(p_workspace uuid,p_id uuid,p_expected_version integer,p_draft jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare existing public.trips; new_version integer; day jsonb; visit jsonb; stop jsonb; participant jsonb; vehicle jsonb; di integer=0; vi integer; si integer;
begin
  if not private.member(p_workspace) then raise exception 'Not authorized' using errcode='42501'; end if;
  if jsonb_typeof(p_draft)<>'object' or (p_draft->>'id')::uuid<>p_id or jsonb_array_length(p_draft->'days') not between 1 and 4 or jsonb_array_length(p_draft->'days')<>(p_draft->>'nights')::integer+1 or jsonb_array_length(p_draft->'participants') not between 1 and 4 then raise exception 'Invalid trip'; end if;
  select * into existing from public.trips where id=p_id for update;
  if existing.id is not null and (existing.workspace_id<>p_workspace or existing.version<>p_expected_version) then raise exception 'Revision conflict' using errcode='40001'; end if;
  if existing.id is null and p_expected_version<>0 then raise exception 'Revision conflict' using errcode='40001'; end if;
  new_version=p_expected_version+1;
  insert into public.trips(id,workspace_id,name,version,draft,created_by) values(p_id,p_workspace,p_draft->>'name',new_version,jsonb_set(p_draft,'{version}',to_jsonb(new_version)),auth.uid())
    on conflict(id) do update set name=excluded.name,version=excluded.version,draft=excluded.draft,updated_at=now();
  delete from public.trip_days where workspace_id=p_workspace and trip_id=p_id;
  delete from public.trip_participants where workspace_id=p_workspace and trip_id=p_id;
  delete from public.trip_vehicle_assignments where workspace_id=p_workspace and trip_id=p_id;
  for participant in select * from jsonb_array_elements(p_draft->'participants') loop
    if not exists(select 1 from public.workspace_members where workspace_id=p_workspace and user_id=(participant#>>'{}')::uuid and active) then raise exception 'Participant is not an active member' using errcode='42501'; end if;
    insert into public.trip_participants values(p_workspace,p_id,(participant#>>'{}')::uuid);
  end loop;
  for vehicle in select * from jsonb_array_elements(p_draft->'transport'->'vehicleIds') loop
    insert into public.trip_vehicle_assignments values(p_workspace,p_id,(vehicle#>>'{}')::uuid);
  end loop;
  for day in select * from jsonb_array_elements(p_draft->'days') loop
    insert into public.trip_days values((day->>'id')::uuid,p_workspace,p_id,di,(day->>'date')::date);
    if jsonb_typeof(day->'hotel')='object' then insert into public.lodging_stays values(p_workspace,p_id,(day->>'id')::uuid,day->'hotel',(day->>'hotelConfirmed')::boolean); end if;
    vi=0;
    for visit in select * from jsonb_array_elements(day->'visits') loop
      insert into public.city_visits values((visit->>'id')::uuid,p_workspace,p_id,(day->>'id')::uuid,(visit->>'cityId')::uuid,vi,(visit->>'reservedMinutes')::integer);
      si=0;
      for stop in select * from jsonb_array_elements(visit->'stops') loop
        insert into public.trip_stops values((stop->>'id')::uuid,p_workspace,p_id,(day->>'id')::uuid,(visit->>'id')::uuid,(stop->>'sourceId')::uuid,(stop->>'eventId')::uuid,si,stop);
        si=si+1;
      end loop;
      vi=vi+1;
    end loop;
    di=di+1;
  end loop;
  return jsonb_set(p_draft,'{version}',to_jsonb(new_version));
end $$;
revoke all on function public.save_trip(uuid,uuid,integer,jsonb) from public;
grant execute on function public.save_trip(uuid,uuid,integer,jsonb) to authenticated;

-- Index the referenced workspace-scoped keys used by joins and policies.
create index sources_city on public.sources(workspace_id,city_id);
create index visits_city on public.source_visits(workspace_id,city_id,visited_at desc);
create index notes_city on public.notes(workspace_id,city_id);
create index stops_source on public.trip_stops(workspace_id,source_id);
create index participant_user on public.trip_participants(workspace_id,user_id);
