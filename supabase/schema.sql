-- Garahe backend schema (Supabase / Postgres)
--
-- Mirrors the SQLite schema in src/data/sqlite/schema.ts field-for-field
-- (camelCase, quoted) so SupabaseRepository needs no field-name mapping.
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
--
-- Identity: auth.users (Supabase Auth) is the source of truth for user ids.
-- "groups" here is the household/sharing unit already modeled in the app
-- (Group / GroupMember in src/types/models.ts).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists group_members (
  "groupId" uuid not null references groups(id) on delete cascade,
  "userId" uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  "displayName" text not null,
  primary key ("groupId", "userId")
);

create table if not exists group_invites (
  id uuid primary key default gen_random_uuid(),
  "groupId" uuid not null references groups(id) on delete cascade,
  code text not null unique,
  role text not null default 'member' check (role in ('owner', 'member')),
  "createdBy" uuid not null references auth.users(id),
  "createdAt" timestamptz not null default now(),
  "redeemedBy" uuid references auth.users(id),
  "redeemedAt" timestamptz
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  "groupId" uuid not null references groups(id) on delete cascade,
  name text not null,
  make text not null,
  model text not null,
  year integer not null,
  "plateNumber" text not null,
  vin text not null,
  color text not null,
  "purchaseDate" text not null,
  "purchasePrice" numeric not null,
  "currentOdometerKm" numeric not null,
  "photoUri" text,
  "fuelType" text not null default 'gas' check ("fuelType" in ('gas', 'hybrid', 'electric')),
  "batteryCapacityKwh" numeric,
  "estimatedRangeKm" numeric,
  "chargingPortType" text,
  "homeChargingNotes" text,
  "registrationExpiry" text not null,
  "insuranceExpiry" text not null,
  "nextPmsDueDate" text not null,
  "nextPmsDueKm" numeric
);

create table if not exists service_entries (
  id uuid primary key default gen_random_uuid(),
  "vehicleId" uuid not null references vehicles(id) on delete cascade,
  date text not null,
  type text not null,
  cost numeric not null,
  shop text not null,
  "odometerKm" numeric not null,
  notes text
);

create table if not exists fuel_entries (
  id uuid primary key default gen_random_uuid(),
  "vehicleId" uuid not null references vehicles(id) on delete cascade,
  date text not null,
  liters numeric not null,
  cost numeric not null,
  "odometerKm" numeric not null
);

create table if not exists charging_entries (
  id uuid primary key default gen_random_uuid(),
  "vehicleId" uuid not null references vehicles(id) on delete cascade,
  date text not null,
  kwh numeric not null,
  cost numeric not null,
  "odometerKm" numeric not null
);

create index if not exists idx_vehicles_group on vehicles("groupId");
create index if not exists idx_service_vehicle on service_entries("vehicleId");
create index if not exists idx_fuel_vehicle on fuel_entries("vehicleId");
create index if not exists idx_charging_vehicle on charging_entries("vehicleId");
create index if not exists idx_group_members_user on group_members("userId");
create index if not exists idx_invites_code on group_invites(code);

-- ---------------------------------------------------------------------
-- Membership helper functions (SECURITY DEFINER so RLS policies can
-- call them without recursing into the policies they support)
-- ---------------------------------------------------------------------

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from group_members
    where "groupId" = gid and "userId" = auth.uid()
  );
$$;

create or replace function public.can_access_vehicle(vid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from vehicles v
    where v.id = vid and public.is_group_member(v."groupId")
  );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_invites enable row level security;
alter table vehicles enable row level security;
alter table service_entries enable row level security;
alter table fuel_entries enable row level security;
alter table charging_entries enable row level security;

-- groups: visible to members; anyone signed in can create one (they
-- immediately self-insert as owner via group_members below).
create policy "groups_select_member" on groups for select
  using (public.is_group_member(id));
create policy "groups_insert_any_authenticated" on groups for insert
  with check (auth.uid() is not null);

-- group_members: visible to fellow members; a user may only ever
-- insert/delete their own membership row (role enforcement beyond that
-- is deferred, see DECISIONS.md — same as the original local model).
create policy "group_members_select_member" on group_members for select
  using (public.is_group_member("groupId"));
create policy "group_members_insert_self" on group_members for insert
  with check ("userId" = auth.uid());
create policy "group_members_delete_self" on group_members for delete
  using ("userId" = auth.uid());

-- group_invites: a member creates one for their own group; the code
-- itself (random, unguessable) is the shared secret, so any signed-in
-- user may look a row up by code to redeem it — see DECISIONS.md.
create policy "group_invites_select_any_authenticated" on group_invites for select
  using (auth.uid() is not null);
create policy "group_invites_insert_member" on group_invites for insert
  with check ("createdBy" = auth.uid() and public.is_group_member("groupId"));
create policy "group_invites_redeem_unclaimed" on group_invites for update
  using ("redeemedBy" is null)
  with check ("redeemedBy" = auth.uid());

-- vehicles / service / fuel / charging entries: full access for members
-- of the owning group, no access otherwise.
create policy "vehicles_all_member" on vehicles for all
  using (public.is_group_member("groupId"))
  with check (public.is_group_member("groupId"));

create policy "service_entries_all_member" on service_entries for all
  using (public.can_access_vehicle("vehicleId"))
  with check (public.can_access_vehicle("vehicleId"));

create policy "fuel_entries_all_member" on fuel_entries for all
  using (public.can_access_vehicle("vehicleId"))
  with check (public.can_access_vehicle("vehicleId"));

create policy "charging_entries_all_member" on charging_entries for all
  using (public.can_access_vehicle("vehicleId"))
  with check (public.can_access_vehicle("vehicleId"));
