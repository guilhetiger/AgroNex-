import type { AccessState } from '@services/subscriptionService';

export type PremiumFeature =
  | 'ai_chat'
  | 'ocr'
  | 'ai_reports'
  | 'predictions'
  | 'premium_export';

type RequireSubscriptionOptions = {
  /** When true, premium gates are enforced. Phase 1 keeps this false everywhere. */
  enforce?: boolean;
};

type RequireSubscriptionResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * Central gate for future premium restrictions.
 * Phase 1: returns allowed=true unless enforce=true and access is missing.
 */
export function requireSubscription(
  access: AccessState | null,
  _feature: PremiumFeature,
  options?: RequireSubscriptionOptions
): RequireSubscriptionResult {
  if (!options?.enforce) {
    return { allowed: true };
  }

  if (!access?.hasAccess) {
    return {
      allowed: false,
      reason: 'Necesitas una suscripción activa para usar esta función.',
    };
  }

  return { allowed: true };
}
