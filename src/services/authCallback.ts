import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { isAuthCallbackUrl } from './authRedirect';

export type AuthCallbackParams = {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  errorDescription: string | null;
  type: string | null;
};

export function parseAuthCallbackParams(url: string): AuthCallbackParams {
  const queryString = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';
  const fragmentString = url.includes('#') ? url.split('#')[1] ?? '' : '';
  const params = new URLSearchParams([queryString, fragmentString].filter(Boolean).join('&'));

  return {
    code: params.get('code'),
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
    type: params.get('type'),
  };
}

/**
 * Exchanges Supabase PKCE code or implicit tokens from a deep link / redirect URL.
 * Used for email confirmation, password recovery, OAuth, and magic links.
 */
export async function handleAuthCallbackFromUrl(url: string): Promise<Session | null> {
  if (!isAuthCallbackUrl(url)) {
    return null;
  }

  const callback = parseAuthCallbackParams(url);
  if (callback.error) {
    throw new Error(callback.errorDescription || callback.error);
  }

  const sessionResult = callback.code
    ? await supabase.auth.exchangeCodeForSession(callback.code)
    : callback.accessToken && callback.refreshToken
      ? await supabase.auth.setSession({
          access_token: callback.accessToken,
          refresh_token: callback.refreshToken,
        })
      : { data: { session: null }, error: null };

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  return sessionResult.data.session;
}
