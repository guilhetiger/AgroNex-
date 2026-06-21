-- AgroNex AI Platform schema (AI-only objects).
-- Does not modify existing business tables or business RLS policies.

create extension if not exists pgcrypto;

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'AI Conversation',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in ('expenses', 'flights', 'clients', 'executive')),
  title text not null,
  summary text not null default '',
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_alerts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  alert_type text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  description text not null,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_predictions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  prediction_type text not null check (prediction_type in ('expenses', 'flights', 'agrochemicals')),
  target_period date not null,
  predicted_value numeric not null default 0,
  confidence numeric not null default 0.7 check (confidence >= 0 and confidence <= 1),
  rationale text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_ocr_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  source_filename text,
  source_mime text,
  extracted_payload jsonb not null default '{}'::jsonb,
  expense_id uuid references public.expenses(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_conversations_owner_idx on public.ai_conversations(owner_id);
create index if not exists ai_messages_owner_idx on public.ai_messages(owner_id);
create index if not exists ai_messages_conversation_idx on public.ai_messages(conversation_id);
create index if not exists ai_reports_owner_idx on public.ai_reports(owner_id);
create index if not exists ai_alerts_owner_idx on public.ai_alerts(owner_id, is_read);
create index if not exists ai_predictions_owner_idx on public.ai_predictions(owner_id);
create index if not exists ai_ocr_jobs_owner_idx on public.ai_ocr_jobs(owner_id);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_reports enable row level security;
alter table public.ai_alerts enable row level security;
alter table public.ai_predictions enable row level security;
alter table public.ai_ocr_jobs enable row level security;

drop policy if exists "ai_conversations_select_own" on public.ai_conversations;
create policy "ai_conversations_select_own" on public.ai_conversations for select using (auth.uid() = owner_id);
drop policy if exists "ai_conversations_insert_own" on public.ai_conversations;
create policy "ai_conversations_insert_own" on public.ai_conversations for insert with check (auth.uid() = owner_id);
drop policy if exists "ai_conversations_update_own" on public.ai_conversations;
create policy "ai_conversations_update_own" on public.ai_conversations for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "ai_conversations_delete_own" on public.ai_conversations;
create policy "ai_conversations_delete_own" on public.ai_conversations for delete using (auth.uid() = owner_id);

drop policy if exists "ai_messages_select_own" on public.ai_messages;
create policy "ai_messages_select_own" on public.ai_messages for select using (auth.uid() = owner_id);
drop policy if exists "ai_messages_insert_own" on public.ai_messages;
create policy "ai_messages_insert_own" on public.ai_messages for insert with check (
  auth.uid() = owner_id
  and exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.owner_id = auth.uid())
);
drop policy if exists "ai_messages_update_own" on public.ai_messages;
create policy "ai_messages_update_own" on public.ai_messages for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "ai_messages_delete_own" on public.ai_messages;
create policy "ai_messages_delete_own" on public.ai_messages for delete using (auth.uid() = owner_id);

drop policy if exists "ai_reports_select_own" on public.ai_reports;
create policy "ai_reports_select_own" on public.ai_reports for select using (auth.uid() = owner_id);
drop policy if exists "ai_reports_insert_own" on public.ai_reports;
create policy "ai_reports_insert_own" on public.ai_reports for insert with check (auth.uid() = owner_id);
drop policy if exists "ai_reports_update_own" on public.ai_reports;
create policy "ai_reports_update_own" on public.ai_reports for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "ai_reports_delete_own" on public.ai_reports;
create policy "ai_reports_delete_own" on public.ai_reports for delete using (auth.uid() = owner_id);

drop policy if exists "ai_alerts_select_own" on public.ai_alerts;
create policy "ai_alerts_select_own" on public.ai_alerts for select using (auth.uid() = owner_id);
drop policy if exists "ai_alerts_insert_own" on public.ai_alerts;
create policy "ai_alerts_insert_own" on public.ai_alerts for insert with check (auth.uid() = owner_id);
drop policy if exists "ai_alerts_update_own" on public.ai_alerts;
create policy "ai_alerts_update_own" on public.ai_alerts for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "ai_alerts_delete_own" on public.ai_alerts;
create policy "ai_alerts_delete_own" on public.ai_alerts for delete using (auth.uid() = owner_id);

drop policy if exists "ai_predictions_select_own" on public.ai_predictions;
create policy "ai_predictions_select_own" on public.ai_predictions for select using (auth.uid() = owner_id);
drop policy if exists "ai_predictions_insert_own" on public.ai_predictions;
create policy "ai_predictions_insert_own" on public.ai_predictions for insert with check (auth.uid() = owner_id);
drop policy if exists "ai_predictions_update_own" on public.ai_predictions;
create policy "ai_predictions_update_own" on public.ai_predictions for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "ai_predictions_delete_own" on public.ai_predictions;
create policy "ai_predictions_delete_own" on public.ai_predictions for delete using (auth.uid() = owner_id);

drop policy if exists "ai_ocr_jobs_select_own" on public.ai_ocr_jobs;
create policy "ai_ocr_jobs_select_own" on public.ai_ocr_jobs for select using (auth.uid() = owner_id);
drop policy if exists "ai_ocr_jobs_insert_own" on public.ai_ocr_jobs;
create policy "ai_ocr_jobs_insert_own" on public.ai_ocr_jobs for insert with check (auth.uid() = owner_id);
drop policy if exists "ai_ocr_jobs_update_own" on public.ai_ocr_jobs;
create policy "ai_ocr_jobs_update_own" on public.ai_ocr_jobs for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "ai_ocr_jobs_delete_own" on public.ai_ocr_jobs;
create policy "ai_ocr_jobs_delete_own" on public.ai_ocr_jobs for delete using (auth.uid() = owner_id);

create or replace view public.v_ai_monthly_expenses
with (security_invoker = true) as
select
  owner_id,
  date_trunc('month', date)::date as month,
  sum(amount)::numeric(14, 2) as total_amount,
  count(*)::int as expense_count
from public.expenses
group by owner_id, date_trunc('month', date);

create or replace view public.v_ai_client_activity
with (security_invoker = true) as
select
  c.owner_id,
  c.id as client_id,
  c.name as client_name,
  count(f.id)::int as flight_count,
  coalesce(sum(f.area_covered), 0)::numeric(14, 2) as total_area,
  max(f.date) as last_flight_at
from public.clients c
left join public.flights f on f.client_id = c.id and f.user_id = c.owner_id
group by c.owner_id, c.id, c.name;

create or replace view public.v_ai_agrochemical_totals
with (security_invoker = true) as
select
  owner_id,
  product,
  sum(total_used)::numeric(14, 2) as total_used,
  sum(stock)::numeric(14, 2) as total_stock
from public.agrochemicals
group by owner_id, product;
