create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  manager text,
  phone text,
  whatsapp text,
  crop text not null,
  area numeric not null default 0,
  location text not null,
  latitude double precision,
  longitude double precision,
  internal_notes text,
  field_polygon jsonb,
  status text not null default 'active' check (status in ('active', 'paused', 'at-risk')),
  score integer not null default 0,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  area numeric not null default 0,
  crop text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  area_covered numeric not null default 0,
  duration numeric not null default 0,
  date timestamptz not null,
  farm_name text,
  drone text,
  pilot text,
  weather text,
  wind text,
  battery_usage text,
  consumption text,
  notes text,
  route text,
  route_coordinates jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agrochemicals (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  application_rate numeric not null default 0,
  total_used numeric not null default 0,
  batch text not null,
  expiry_date date not null,
  mixture text not null,
  stock numeric not null default 0,
  unit_cost_usd numeric,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric not null default 0,
  date timestamptz not null,
  description text not null,
  vendor text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists clients_owner_id_idx on public.clients(owner_id);
create index if not exists farms_owner_id_idx on public.farms(owner_id);
create index if not exists flights_user_id_idx on public.flights(user_id);
create index if not exists flights_client_id_idx on public.flights(client_id);
create index if not exists agrochemicals_owner_id_idx on public.agrochemicals(owner_id);
create index if not exists expenses_owner_id_idx on public.expenses(owner_id);

alter table public.clients enable row level security;
alter table public.farms enable row level security;
alter table public.flights enable row level security;
alter table public.agrochemicals enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own" on public.clients for select using (auth.uid() = owner_id);
drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own" on public.clients for insert with check (auth.uid() = owner_id);
drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own" on public.clients for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own" on public.clients for delete using (auth.uid() = owner_id);

drop policy if exists "farms_select_own" on public.farms;
create policy "farms_select_own" on public.farms for select using (auth.uid() = owner_id);
drop policy if exists "farms_insert_own" on public.farms;
create policy "farms_insert_own" on public.farms for insert with check (auth.uid() = owner_id);
drop policy if exists "farms_update_own" on public.farms;
create policy "farms_update_own" on public.farms for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "farms_delete_own" on public.farms;
create policy "farms_delete_own" on public.farms for delete using (auth.uid() = owner_id);

drop policy if exists "flights_select_own" on public.flights;
create policy "flights_select_own" on public.flights for select using (auth.uid() = user_id);
drop policy if exists "flights_insert_own" on public.flights;
create policy "flights_insert_own" on public.flights for insert with check (
  auth.uid() = user_id
  and (
    client_id is null
    or exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.owner_id = auth.uid()
    )
  )
);
drop policy if exists "flights_update_own" on public.flights;
create policy "flights_update_own" on public.flights for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    client_id is null
    or exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.owner_id = auth.uid()
    )
  )
);
drop policy if exists "flights_delete_own" on public.flights;
create policy "flights_delete_own" on public.flights for delete using (auth.uid() = user_id);

drop policy if exists "agrochemicals_select_own" on public.agrochemicals;
create policy "agrochemicals_select_own" on public.agrochemicals for select using (auth.uid() = owner_id);
drop policy if exists "agrochemicals_insert_own" on public.agrochemicals;
create policy "agrochemicals_insert_own" on public.agrochemicals for insert with check (auth.uid() = owner_id);
drop policy if exists "agrochemicals_update_own" on public.agrochemicals;
create policy "agrochemicals_update_own" on public.agrochemicals for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "agrochemicals_delete_own" on public.agrochemicals;
create policy "agrochemicals_delete_own" on public.agrochemicals for delete using (auth.uid() = owner_id);

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own" on public.expenses for select using (auth.uid() = owner_id);
drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own" on public.expenses for insert with check (auth.uid() = owner_id);
drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own" on public.expenses for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own" on public.expenses for delete using (auth.uid() = owner_id);
