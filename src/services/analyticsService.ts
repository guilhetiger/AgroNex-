import { supabase, hasSupabaseConfig } from '@services/supabaseClient';
import type { SubscriptionPlan } from '../types/index';

export const USAGE_EVENT_TYPES = {
  AI_CHAT_MESSAGE: 'ai_chat_message',
  AI_REPORT_GENERATED: 'ai_report_generated',
  AI_PREDICTION_GENERATED: 'ai_prediction_generated',
  AI_ANOMALY_SCAN: 'ai_anomaly_scan',
  OCR_UPLOAD: 'ocr_upload',
  OCR_PROCESSED: 'ocr_processed',
  CLIENT_CREATED: 'client_created',
  CLIENT_UPDATED: 'client_updated',
  FLIGHT_CREATED: 'flight_created',
  FLIGHT_COMPLETED: 'flight_completed',
  AGROCHEMICAL_CREATED: 'agrochemical_created',
  PDF_EXPORT: 'pdf_export',
  CSV_EXPORT: 'csv_export',
  SUBSCRIPTION_ACTIVATED: 'subscription_activated',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  APP_SESSION: 'app_session',
  WEATHER_REQUEST: 'weather_request',
  WEATHER_ALERT_GENERATED: 'weather_alert_generated',
  UNSAFE_FLIGHT_WARNING: 'unsafe_flight_warning',
} as const;

export type UsageEventType = (typeof USAGE_EVENT_TYPES)[keyof typeof USAGE_EVENT_TYPES];

export type TrackEventInput = {
  userId: string;
  eventType: UsageEventType;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

type UsageEventsInsertClient = {
  insert: (values: {
    user_id: string;
    event_type: UsageEventType;
    entity_type?: string | null;
    entity_id?: string | null;
    metadata?: Record<string, unknown> | null;
  }) => Promise<{ error: { message: string } | null }>;
};

function usageEventsTable() {
  return supabase.from('usage_events') as unknown as UsageEventsInsertClient;
}

export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    if (!hasSupabaseConfig || !input.userId) return;

    const { error } = await usageEventsTable().insert({
      user_id: input.userId,
      event_type: input.eventType,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? null,
    });

    if (error) {
      console.warn('[analytics] trackEvent failed:', error.message);
    }
  } catch (error) {
    console.warn('[analytics] trackEvent error:', error);
  }
}

export async function trackAIUsage(
  userId: string,
  kind: 'chat' | 'report' | 'prediction' | 'anomaly',
  metadata?: Record<string, unknown>
) {
  const eventMap = {
    chat: USAGE_EVENT_TYPES.AI_CHAT_MESSAGE,
    report: USAGE_EVENT_TYPES.AI_REPORT_GENERATED,
    prediction: USAGE_EVENT_TYPES.AI_PREDICTION_GENERATED,
    anomaly: USAGE_EVENT_TYPES.AI_ANOMALY_SCAN,
  } as const;

  await trackEvent({
    userId,
    eventType: eventMap[kind],
    entityType: 'ai',
    metadata,
  });
}

export async function trackOCRUsage(
  userId: string,
  stage: 'upload' | 'processed',
  metadata?: Record<string, unknown> & { entityId?: string }
) {
  await trackEvent({
    userId,
    eventType: stage === 'upload' ? USAGE_EVENT_TYPES.OCR_UPLOAD : USAGE_EVENT_TYPES.OCR_PROCESSED,
    entityType: 'ocr',
    entityId: metadata?.entityId ?? null,
    metadata,
  });
}

export async function trackReportUsage(
  userId: string,
  format: 'pdf' | 'csv',
  metadata?: Record<string, unknown>
) {
  await trackEvent({
    userId,
    eventType: format === 'pdf' ? USAGE_EVENT_TYPES.PDF_EXPORT : USAGE_EVENT_TYPES.CSV_EXPORT,
    entityType: 'report',
    metadata,
  });
}

export async function trackFlightUsage(
  userId: string,
  stage: 'created' | 'completed',
  metadata?: Record<string, unknown> & { flightId?: string }
) {
  await trackEvent({
    userId,
    eventType: stage === 'created' ? USAGE_EVENT_TYPES.FLIGHT_CREATED : USAGE_EVENT_TYPES.FLIGHT_COMPLETED,
    entityType: 'flight',
    entityId: metadata?.flightId ?? null,
    metadata,
  });
}

export async function trackWeatherUsage(
  userId: string,
  kind: 'request' | 'alert' | 'unsafe_flight',
  metadata?: Record<string, unknown>
) {
  const eventMap = {
    request: USAGE_EVENT_TYPES.WEATHER_REQUEST,
    alert: USAGE_EVENT_TYPES.WEATHER_ALERT_GENERATED,
    unsafe_flight: USAGE_EVENT_TYPES.UNSAFE_FLIGHT_WARNING,
  } as const;

  await trackEvent({
    userId,
    eventType: eventMap[kind],
    entityType: 'weather',
    metadata,
  });
}

export async function trackClientUsage(
  userId: string,
  action: 'created' | 'updated',
  metadata?: Record<string, unknown> & { clientId?: string }
) {
  await trackEvent({
    userId,
    eventType: action === 'created' ? USAGE_EVENT_TYPES.CLIENT_CREATED : USAGE_EVENT_TYPES.CLIENT_UPDATED,
    entityType: 'client',
    entityId: metadata?.clientId ?? null,
    metadata,
  });
}

export async function trackAgrochemicalCreated(userId: string, metadata?: Record<string, unknown> & { productId?: string }) {
  await trackEvent({
    userId,
    eventType: USAGE_EVENT_TYPES.AGROCHEMICAL_CREATED,
    entityType: 'agrochemical',
    entityId: metadata?.productId ?? null,
    metadata,
  });
}

export async function trackSubscriptionEvent(
  userId: string,
  action: 'activated' | 'expired',
  metadata?: Record<string, unknown>
) {
  await trackEvent({
    userId,
    eventType:
      action === 'activated' ? USAGE_EVENT_TYPES.SUBSCRIPTION_ACTIVATED : USAGE_EVENT_TYPES.SUBSCRIPTION_EXPIRED,
    entityType: 'subscription',
    metadata,
  });
}

export async function trackAppSession(userId: string) {
  await trackEvent({
    userId,
    eventType: USAGE_EVENT_TYPES.APP_SESSION,
    entityType: 'session',
  });
}

export type UsageLimitConfig = {
  aiDaily: number | null;
  ocrMonthly: number | null;
  label: string;
};

export function getUsageLimits(plan: SubscriptionPlan | null | undefined): UsageLimitConfig {
  switch (plan) {
    case 'pro':
      return { aiDaily: null, ocrMonthly: null, label: 'Pro · IA y OCR ilimitados' };
    case 'enterprise':
      return { aiDaily: null, ocrMonthly: null, label: 'Enterprise · todo ilimitado' };
    case 'free':
    default:
      return { aiDaily: 20, ocrMonthly: 10, label: 'Free · IA 20/día · OCR 10/mes' };
  }
}

const AI_EVENT_TYPES: UsageEventType[] = [
  USAGE_EVENT_TYPES.AI_CHAT_MESSAGE,
  USAGE_EVENT_TYPES.AI_REPORT_GENERATED,
  USAGE_EVENT_TYPES.AI_PREDICTION_GENERATED,
  USAGE_EVENT_TYPES.AI_ANOMALY_SCAN,
];

export type UserUsageSnapshot = {
  aiToday: number;
  ocrThisMonth: number;
  limits: UsageLimitConfig;
};

export async function getUserUsageSnapshot(userId: string, plan: SubscriptionPlan | null | undefined): Promise<UserUsageSnapshot> {
  const limits = getUsageLimits(plan);

  if (!hasSupabaseConfig) {
    return { aiToday: 0, ocrThisMonth: 0, limits };
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

    const { data, error } = await (supabase.from('usage_events') as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          gte: (column: string, value: string) => Promise<{
            data: Array<{ event_type: UsageEventType; created_at: string }> | null;
            error: { message: string } | null;
          }>;
        };
      };
    })
      .select('event_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.warn('[analytics] getUserUsageSnapshot failed:', error.message);
      return { aiToday: 0, ocrThisMonth: 0, limits };
    }

    const events = data ?? [];
    const aiToday = events.filter(
      (event) => AI_EVENT_TYPES.includes(event.event_type) && new Date(event.created_at) >= startOfDay
    ).length;
    const ocrThisMonth = events.filter((event) => event.event_type === USAGE_EVENT_TYPES.OCR_PROCESSED).length;

    return {
      aiToday,
      ocrThisMonth,
      limits,
    };
  } catch (error) {
    console.warn('[analytics] getUserUsageSnapshot error:', error);
    return { aiToday: 0, ocrThisMonth: 0, limits };
  }
}

export const FEATURE_LABELS: Record<string, string> = {
  ai_chat_message: 'AgroChat (IA)',
  ai_report_generated: 'Reportes IA',
  ai_prediction_generated: 'Predicciones IA',
  ai_anomaly_scan: 'Detección de anomalías',
  ocr_upload: 'OCR · subida',
  ocr_processed: 'OCR · procesado',
  client_created: 'Clientes creados',
  client_updated: 'Clientes actualizados',
  flight_created: 'Vuelos creados',
  flight_completed: 'Vuelos completados',
  agrochemical_created: 'Agroquímicos',
  pdf_export: 'Exportación PDF',
  csv_export: 'Exportación CSV',
  subscription_activated: 'Suscripción activada',
  subscription_expired: 'Suscripción expirada',
  app_session: 'Sesiones de app',
};
