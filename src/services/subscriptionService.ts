import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types/index';

const TRIAL_DAYS = 7;
const MONTHLY_DAYS = 30;
const KEY_PREFIX = 'AGRONEX_SUBSCRIPTION_';

function isAdmin(user: User) {
  return user.role === 'admin';
}

export type AccessStatus = 'admin' | 'trial' | 'active' | 'expired';

export type AccessState = {
  status: AccessStatus;
  hasAccess: boolean;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  message: string;
};

type StoredAccess = {
  trialStartedAt: string;
  trialEndsAt: string;
  subscriptionEndsAt?: string | null;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function keyFor(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

function createDefaultStoredAccess(now = new Date()): StoredAccess {
  return {
    trialStartedAt: now.toISOString(),
    trialEndsAt: addDays(now, TRIAL_DAYS).toISOString(),
    subscriptionEndsAt: null,
  };
}

function isValidStoredAccess(value: unknown): value is StoredAccess {
  if (!value || typeof value !== 'object') return false;
  const record = value as StoredAccess;
  return typeof record.trialStartedAt === 'string' && typeof record.trialEndsAt === 'string';
}

async function readStoredAccess(userId: string): Promise<StoredAccess | null> {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidStoredAccess(parsed)) {
      throw new Error('Invalid subscription record shape');
    }
    return parsed;
  } catch (error) {
    console.warn('Regenerating corrupt subscription data for user', userId, error);
    const created = createDefaultStoredAccess();
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(created));
    return created;
  }
}

function stateFromRecord(user: User, record: StoredAccess, now = new Date()): AccessState {
  if (isAdmin(user)) {
    return {
      status: 'admin',
      hasAccess: true,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      message: 'Cuenta administradora sin restricciones.',
    };
  }

  const trialEnds = new Date(record.trialEndsAt);
  const subscriptionEnds = record.subscriptionEndsAt ? new Date(record.subscriptionEndsAt) : null;

  if (subscriptionEnds && subscriptionEnds.getTime() > now.getTime()) {
    return {
      status: 'active',
      hasAccess: true,
      trialEndsAt: record.trialEndsAt,
      subscriptionEndsAt: record.subscriptionEndsAt ?? null,
      message: `Suscripción activa hasta ${subscriptionEnds.toLocaleDateString()}.`,
    };
  }

  if (trialEnds.getTime() > now.getTime()) {
    return {
      status: 'trial',
      hasAccess: true,
      trialEndsAt: record.trialEndsAt,
      subscriptionEndsAt: record.subscriptionEndsAt ?? null,
      message: `Prueba gratuita activa hasta ${trialEnds.toLocaleDateString()}.`,
    };
  }

  return {
    status: 'expired',
    hasAccess: false,
    trialEndsAt: record.trialEndsAt,
    subscriptionEndsAt: record.subscriptionEndsAt ?? null,
    message: 'La prueba gratuita o suscripción finalizó.',
  };
}

export function getFallbackAccessState(user: User, now = new Date()): AccessState {
  if (isAdmin(user)) {
    return stateFromRecord(user, createDefaultStoredAccess(now), now);
  }

  return stateFromRecord(user, createDefaultStoredAccess(now), now);
}

export async function getAccessState(user: User): Promise<AccessState> {
  const now = new Date();

  if (isAdmin(user)) {
    return stateFromRecord(user, createDefaultStoredAccess(now), now);
  }

  const stored = await readStoredAccess(user.id);
  if (stored) {
    return stateFromRecord(user, stored, now);
  }

  const created = createDefaultStoredAccess(now);
  await AsyncStorage.setItem(keyFor(user.id), JSON.stringify(created));
  return stateFromRecord(user, created, now);
}

export async function activateMonthlySubscription(user: User): Promise<AccessState> {
  const now = new Date();
  const current = await readStoredAccess(user.id);
  const base =
    current?.subscriptionEndsAt && new Date(current.subscriptionEndsAt).getTime() > now.getTime()
      ? new Date(current.subscriptionEndsAt)
      : now;

  const record: StoredAccess = {
    trialStartedAt: current?.trialStartedAt ?? now.toISOString(),
    trialEndsAt: current?.trialEndsAt ?? addDays(now, TRIAL_DAYS).toISOString(),
    subscriptionEndsAt: addDays(base, MONTHLY_DAYS).toISOString(),
  };

  await AsyncStorage.setItem(keyFor(user.id), JSON.stringify(record));
  return stateFromRecord(user, record, now);
}
