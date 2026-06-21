import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const AUTH_CALLBACK_PATH = 'auth-callback';
const FALLBACK_SCHEME = 'agronex';

function normalizePath(path: string | null | undefined): string {
  return (path || '').replace(/^\/+/, '');
}

/** True when the URL targets the Supabase auth callback (native scheme or Expo dev URI). */
export function isAuthCallbackUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = Linking.parse(url);
    const path = normalizePath(parsed.path);
    const host = parsed.hostname || '';

    return (
      path === AUTH_CALLBACK_PATH ||
      path.endsWith(`/${AUTH_CALLBACK_PATH}`) ||
      host === AUTH_CALLBACK_PATH
    );
  } catch {
    return url.toLowerCase().includes(AUTH_CALLBACK_PATH);
  }
}

function resolveAppScheme(): string {
  const scheme = Constants.expoConfig?.scheme;
  if (typeof scheme === 'string' && scheme.length > 0) {
    return scheme;
  }
  if (Array.isArray(scheme) && scheme.length > 0) {
    return scheme[0];
  }
  return FALLBACK_SCHEME;
}

function isLocalhostUri(uri: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(uri);
}

/**
 * Redirect URI for Supabase OAuth and email deep links.
 * Allowlist the returned value in Supabase → Authentication → URL Configuration.
 */
export function getOAuthRedirectUri(): string {
  const scheme = resolveAppScheme();

  if (Platform.OS === 'web') {
    return AuthSession.makeRedirectUri({
      path: AUTH_CALLBACK_PATH,
      preferLocalhost: true,
    });
  }

  const sessionUri = AuthSession.makeRedirectUri({
    scheme,
    path: AUTH_CALLBACK_PATH,
    preferLocalhost: false,
  });

  if (sessionUri && !isLocalhostUri(sessionUri)) {
    return sessionUri;
  }

  const linkingUri = Linking.createURL(AUTH_CALLBACK_PATH, { scheme });
  if (linkingUri && !isLocalhostUri(linkingUri)) {
    return linkingUri;
  }

  return `${scheme}://${AUTH_CALLBACK_PATH}`;
}
