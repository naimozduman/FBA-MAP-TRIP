-- Drivers are specific verified workspace participants, not an inferred crew count.
create table public.trip_driver_assignments (
 workspace_id uuid not null,trip_id uuid not null,vehicle_id uuid not null,user_id uuid not null,
 primary key(workspace_id,trip_id,vehicle_id),
 foreign key(workspace_id,trip_id,vehicle_id) references public.trip_vehicle_assignments(workspace_id,trip_id,vehicle_id) on delete cascade,
 foreign key(workspace_id,trip_id,user_id) references public.trip_participants(workspace_id,trip_id,user_id) on delete cascade
);
alter table public.trip_driver_assignments enable row level security;
revoke all on public.trip_driver_assignments from anon,authenticated;
grant select on public.trip_driver_assignments to authenticated;
create policy read_member on public.trip_driver_assignments for select to authenticated using(private.member(workspace_id));

alter function public.save_trip(uuid,uuid,integer,jsonb) rename to save_trip_validated;
alter function public.save_trip_validated(uuid,uuid,integer,jsonb) set schema private;
revoke all on function private.save_trip_validated(uuid,uuid,integer,jsonb) from public,anon,authenticated;
create function public.save_trip(p_workspace uuid,p_id uuid,p_expected_version integer,p_draft jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare saved jsonb; driver jsonb;
begin
 saved=private.save_trip_validated(p_workspace,p_id,p_expected_version,p_draft);
 if jsonb_typeof(p_draft->'transport'->'driverAssignments')='array' then
  if jsonb_array_length(p_draft->'transport'->'driverAssignments')>4 then raise exception 'Too many driver assignments'; end if;
  for driver in select * from jsonb_array_elements(p_draft->'transport'->'driverAssignments') loop
   insert into public.trip_driver_assignments values(p_workspace,p_id,(driver->>'vehicleId')::uuid,(driver->>'userId')::uuid);
  end loop;
 end if;
 return saved;
end $$;
revoke all on function public.save_trip(uuid,uuid,integer,jsonb) from public,anon;
grant execute on function public.save_trip(uuid,uuid,integer,jsonb) to authenticated;
notify pgrst,'reload schema';
