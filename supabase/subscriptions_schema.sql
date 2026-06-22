-- AgroNex subscriptions (manual billing phase 1)
-- Run after schema.sql in Supabase SQL Editor or via migration.

create extension if not exists pgcrypto;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'pro', 'enterprise')),
  status text not null check (status in ('active', 'expired', 'cancelled')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_expires_at_idx on public.subscriptions(expires_at);

create or replace function public.set_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_subscriptions_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "subscriptions_admin_all" on public.subscriptions;
create policy "subscriptions_admin_all"
  on public.subscriptions
  for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan, status, started_at, expires_at)
  values (new.id, 'free', 'active', now(), now() + interval '7 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function public.handle_new_user_subscription();

create or replace function public.ensure_user_subscription()
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.subscriptions;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into result
  from public.subscriptions
  where user_id = auth.uid();

  if found then
    return result;
  end if;

  insert into public.subscriptions (user_id, plan, status, started_at, expires_at)
  values (auth.uid(), 'free', 'active', now(), now() + interval '7 days')
  returning * into result;

  return result;
end;
$$;

grant execute on function public.ensure_user_subscription() to authenticated;

create or replace function public.admin_list_subscriptions()
returns table (
  id uuid,
  user_id uuid,
  email text,
  plan text,
  status text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    s.id,
    s.user_id,
    u.email,
    s.plan,
    s.status,
    s.started_at,
    s.expires_at,
    s.created_at,
    s.updated_at
  from public.subscriptions s
  join auth.users u on u.id = s.user_id
  order by s.updated_at desc;
end;
$$;

-- Backfill existing auth users without a subscription row.
insert into public.subscriptions (user_id, plan, status, started_at, expires_at)
select u.id, 'free', 'active', now(), now() + interval '7 days'
from auth.users u
where not exists (
  select 1 from public.subscriptions s where s.user_id = u.id
);

grant execute on function public.admin_list_subscriptions() to authenticated;
