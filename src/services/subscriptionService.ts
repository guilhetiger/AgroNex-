import { supabase, hasSupabaseConfig } from '@services/supabaseClient';
import type { Subscription, SubscriptionPlan, SubscriptionStatus, User } from '../types/index';

const TRIAL_DAYS = 7;
const DEFAULT_PAID_DAYS = 30;

export type AccessStatus = 'admin' | 'trial' | 'active' | 'expired' | 'cancelled';

export type AccessState = {
  status: AccessStatus;
  hasAccess: boolean;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  message: string;
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
  daysRemaining: number;
};

function isAdmin(user: User) {
  return user.role === 'admin';
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeSubscription(row: Subscription): Subscription {
  return {
    ...row,
    plan: row.plan as SubscriptionPlan,
    status: row.status as SubscriptionStatus,
  };
}

function computeDaysRemaining(expiresAt: string, now = new Date()) {
  const diffMs = new Date(expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function isDateActive(expiresAt: string, now = new Date()) {
  return new Date(expiresAt).getTime() > now.getTime();
}

export function isTrialExpired(subscription: Subscription | null, now = new Date()): boolean {
  if (!subscription) return true;
  if (subscription.plan !== 'free') return false;
  return !isDateActive(subscription.expires_at, now);
}

export function isSubscriptionActive(subscription: Subscription | null, now = new Date()): boolean {
  if (!subscription) return false;
  if (subscription.status === 'cancelled') return false;
  if (subscription.status === 'expired') return false;
  return isDateActive(subscription.expires_at, now);
}

export function getDaysRemaining(subscription: Subscription | null, now = new Date()): number {
  if (!subscription) return 0;
  return computeDaysRemaining(subscription.expires_at, now);
}

export function canAccessPremiumFeatures(
  user: User,
  subscription: Subscription | null,
  now = new Date()
): boolean {
  if (isAdmin(user)) return true;
  // Phase 1: do not block premium modules yet; gate is wired for future use.
  void now;
  void subscription;
  return true;
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  if (!hasSupabaseConfig) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Error fetching subscription:', error.message);
  }

  if (data) {
    return normalizeSubscription(data as Subscription);
  }

  const { data: ensured, error: ensureError } = await supabase.rpc('ensure_user_subscription');
  if (ensureError) {
    console.warn('Error ensuring subscription:', ensureError.message);
    return null;
  }

  return ensured ? normalizeSubscription(ensured as Subscription) : null;
}

function buildAccessState(user: User, subscription: Subscription | null, now = new Date()): AccessState {
  if (isAdmin(user)) {
    return {
      status: 'admin',
      hasAccess: true,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      message: 'Cuenta administradora sin restricciones.',
      subscription,
      plan: subscription?.plan ?? 'enterprise',
      daysRemaining: subscription ? getDaysRemaining(subscription, now) : 0,
    };
  }

  if (!subscription) {
    return {
      status: 'expired',
      hasAccess: false,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      message: 'No se encontró una suscripción activa. Contacta soporte.',
      subscription: null,
      plan: null,
      daysRemaining: 0,
    };
  }

  const daysRemaining = getDaysRemaining(subscription, now);
  const active = isSubscriptionActive(subscription, now);

  if (subscription.status === 'cancelled') {
    return {
      status: 'cancelled',
      hasAccess: false,
      trialEndsAt: subscription.plan === 'free' ? subscription.expires_at : null,
      subscriptionEndsAt: subscription.expires_at,
      message: 'Tu suscripción fue cancelada. Contacta soporte para reactivarla.',
      subscription,
      plan: subscription.plan,
      daysRemaining,
    };
  }

  if (!active) {
    return {
      status: 'expired',
      hasAccess: false,
      trialEndsAt: subscription.plan === 'free' ? subscription.expires_at : null,
      subscriptionEndsAt: subscription.expires_at,
      message:
        subscription.plan === 'free'
          ? 'Tu prueba gratuita de 7 días finalizó.'
          : `Tu suscripción ${subscription.plan} venció el ${new Date(subscription.expires_at).toLocaleDateString()}.`,
      subscription,
      plan: subscription.plan,
      daysRemaining: 0,
    };
  }

  if (subscription.plan === 'free') {
    return {
      status: 'trial',
      hasAccess: true,
      trialEndsAt: subscription.expires_at,
      subscriptionEndsAt: subscription.expires_at,
      message: `Prueba gratuita activa · ${daysRemaining} día(s) restantes.`,
      subscription,
      plan: subscription.plan,
      daysRemaining,
    };
  }

  return {
    status: 'active',
    hasAccess: true,
    trialEndsAt: null,
    subscriptionEndsAt: subscription.expires_at,
    message: `Plan ${subscription.plan.toUpperCase()} activo · vence el ${new Date(subscription.expires_at).toLocaleDateString()}.`,
    subscription,
    plan: subscription.plan,
    daysRemaining,
  };
}

export function getFallbackAccessState(user: User, now = new Date()): AccessState {
  if (isAdmin(user)) {
    return buildAccessState(user, null, now);
  }

  const fallbackSubscription: Subscription = {
    id: 'local-fallback',
    user_id: user.id,
    plan: 'free',
    status: 'active',
    started_at: now.toISOString(),
    expires_at: addDays(now, TRIAL_DAYS).toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  return buildAccessState(user, fallbackSubscription, now);
}

export async function getAccessState(user: User): Promise<AccessState> {
  const now = new Date();
  const subscription = await getUserSubscription(user.id);
  return buildAccessState(user, subscription, now);
}

export async function refreshUserSubscription(userId: string): Promise<Subscription | null> {
  return getUserSubscription(userId);
}

export { TRIAL_DAYS, DEFAULT_PAID_DAYS };
