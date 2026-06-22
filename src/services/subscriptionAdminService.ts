import { supabase, hasSupabaseConfig } from '@services/supabaseClient';
import { DEFAULT_PAID_DAYS } from '@services/subscriptionService';
import { trackSubscriptionEvent } from '@services/analyticsService';
import type { Subscription, SubscriptionPlan } from '../types/index';

export type AdminSubscriptionRow = Subscription & {
  email: string;
};

type SubscriptionWrite = Partial<Pick<Subscription, 'plan' | 'status' | 'expires_at' | 'started_at'>>;
type SubscriptionInsert = Pick<Subscription, 'user_id' | 'plan' | 'status' | 'started_at' | 'expires_at'>;

type SubscriptionsClient = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: <T>() => Promise<{ data: T | null; error: { message: string } | null }>;
    };
  };
  update: (values: SubscriptionWrite) => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
  insert: (values: SubscriptionInsert) => Promise<{ error: { message: string } | null }>;
};

function subscriptionsTable() {
  return supabase.from('subscriptions') as unknown as SubscriptionsClient;
}

function addDaysIso(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function pickBaseExpiry(currentExpiresAt: string | null | undefined) {
  const now = new Date();
  if (!currentExpiresAt) return now;
  const current = new Date(currentExpiresAt);
  return current.getTime() > now.getTime() ? current : now;
}

export async function listSubscriptionsForAdmin(): Promise<AdminSubscriptionRow[]> {
  if (!hasSupabaseConfig) return [];

  const { data, error } = await supabase.rpc('admin_list_subscriptions');
  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<Subscription & { email: string | null }>).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    email: row.email ?? '',
    plan: row.plan as SubscriptionPlan,
    status: row.status as Subscription['status'],
    started_at: row.started_at,
    expires_at: row.expires_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

async function upsertSubscriptionFields(userId: string, fields: SubscriptionWrite) {
  const table = subscriptionsTable();
  const { data: existing, error: readError } = await table.select('id').eq('user_id', userId).maybeSingle<{ id: string }>();

  if (readError) throw new Error(readError.message);

  if (existing?.id) {
    const { error } = await table.update(fields).eq('user_id', userId);
    if (error) throw new Error(error.message);
    return;
  }

  const now = new Date().toISOString();
  const { error } = await table.insert({
    user_id: userId,
    plan: fields.plan ?? 'pro',
    status: fields.status ?? 'active',
    started_at: fields.started_at ?? now,
    expires_at: fields.expires_at ?? addDaysIso(new Date(), DEFAULT_PAID_DAYS),
  });

  if (error) throw new Error(error.message);
}

export async function activatePlanForUser(userId: string, plan: SubscriptionPlan = 'pro') {
  const expiresAt = addDaysIso(new Date(), DEFAULT_PAID_DAYS);
  await upsertSubscriptionFields(userId, {
    plan,
    status: 'active',
    started_at: new Date().toISOString(),
    expires_at: expiresAt,
  });
  void trackSubscriptionEvent(userId, 'activated', { plan, source: 'admin_activate_plan' });
}

export async function extendSubscriptionDays(userId: string, days = DEFAULT_PAID_DAYS) {
  const { data, error } = await subscriptionsTable()
    .select('expires_at, plan, status')
    .eq('user_id', userId)
    .maybeSingle<{ expires_at: string; plan: SubscriptionPlan; status: Subscription['status'] }>();

  if (error) throw new Error(error.message);

  const base = pickBaseExpiry(data?.expires_at);
  const expiresAt = addDaysIso(base, days);

  await upsertSubscriptionFields(userId, {
    plan: data?.plan ?? 'pro',
    status: 'active',
    expires_at: expiresAt,
  });
  void trackSubscriptionEvent(userId, 'activated', { plan: data?.plan ?? 'pro', source: 'admin_extend_days', days });
}

export async function cancelSubscriptionForUser(userId: string) {
  await upsertSubscriptionFields(userId, {
    status: 'cancelled',
  });
}

export async function convertSubscriptionToEnterprise(userId: string) {
  const { data, error } = await subscriptionsTable()
    .select('expires_at')
    .eq('user_id', userId)
    .maybeSingle<{ expires_at: string }>();

  if (error) throw new Error(error.message);

  const base = pickBaseExpiry(data?.expires_at);
  const expiresAt = addDaysIso(base, DEFAULT_PAID_DAYS);

  await upsertSubscriptionFields(userId, {
    plan: 'enterprise',
    status: 'active',
    expires_at: expiresAt,
  });
  void trackSubscriptionEvent(userId, 'activated', { plan: 'enterprise', source: 'admin_convert_enterprise' });
}
