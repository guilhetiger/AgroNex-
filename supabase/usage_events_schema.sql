-- AgroNex usage analytics (phase 1 — measure before premium gates)
-- Run after schema.sql and subscriptions_schema.sql

create extension if not exists pgcrypto;

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_id_idx on public.usage_events(user_id);
create index if not exists usage_events_event_type_idx on public.usage_events(event_type);
create index if not exists usage_events_created_at_idx on public.usage_events(created_at desc);
create index if not exists usage_events_user_created_idx on public.usage_events(user_id, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "usage_events_select_own" on public.usage_events;
create policy "usage_events_select_own"
  on public.usage_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "usage_events_select_admin" on public.usage_events;
create policy "usage_events_select_admin"
  on public.usage_events
  for select
  using (public.is_admin());

drop policy if exists "usage_events_insert_own" on public.usage_events;
create policy "usage_events_insert_own"
  on public.usage_events
  for insert
  with check (auth.uid() = user_id);

create or replace function public.admin_analytics_summary()
returns table (
  active_users_7d bigint,
  active_users_30d bigint,
  total_ai_queries bigint,
  total_ocr_processed bigint,
  total_flights_created bigint,
  total_pdf_exports bigint,
  total_clients_created bigint
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
    (select count(distinct user_id) from public.usage_events where created_at >= now() - interval '7 days') as active_users_7d,
    (select count(distinct user_id) from public.usage_events where created_at >= now() - interval '30 days') as active_users_30d,
    (select count(*) from public.usage_events where event_type in (
      'ai_chat_message', 'ai_report_generated', 'ai_prediction_generated', 'ai_anomaly_scan'
    )) as total_ai_queries,
    (select count(*) from public.usage_events where event_type = 'ocr_processed') as total_ocr_processed,
    (select count(*) from public.usage_events where event_type = 'flight_created') as total_flights_created,
    (select count(*) from public.usage_events where event_type = 'pdf_export') as total_pdf_exports,
    (select count(*) from public.usage_events where event_type = 'client_created') as total_clients_created;
end;
$$;

grant execute on function public.admin_analytics_summary() to authenticated;

create or replace function public.admin_analytics_top_features()
returns table (
  event_type text,
  total bigint,
  feature_rank bigint
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
    ranked.event_type,
    ranked.total,
    ranked.feature_rank
  from (
    select
      ue.event_type,
      count(*)::bigint as total,
      row_number() over (order by count(*) desc, ue.event_type asc) as feature_rank
    from public.usage_events ue
    group by ue.event_type
  ) ranked
  where ranked.feature_rank <= 3
  order by ranked.feature_rank asc;
end;
$$;

grant execute on function public.admin_analytics_top_features() to authenticated;

create or replace function public.admin_user_usage_stats(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'user_id', p_user_id,
    'ai_queries', (
      select count(*) from public.usage_events
      where user_id = p_user_id
        and event_type in ('ai_chat_message', 'ai_report_generated', 'ai_prediction_generated', 'ai_anomaly_scan')
    ),
    'ocr_used', (
      select count(*) from public.usage_events
      where user_id = p_user_id and event_type = 'ocr_processed'
    ),
    'reports_generated', (
      select count(*) from public.usage_events
      where user_id = p_user_id
        and event_type in ('ai_report_generated', 'pdf_export', 'csv_export')
    ),
    'flights_created', (
      select count(*) from public.usage_events
      where user_id = p_user_id and event_type = 'flight_created'
    ),
    'last_access', (
      select max(created_at) from public.usage_events where user_id = p_user_id
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_user_usage_stats(uuid) to authenticated;
