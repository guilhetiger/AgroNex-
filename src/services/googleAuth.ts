import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// Initialize web browser
WebBrowser.maybeCompleteAuthSession();

const redirectUrl = AuthSession.makeRedirectUri({
  scheme: 'agronex',
  path: 'auth-callback',
});

export type GoogleAuthResponse = {
  session: Session;
  redirectUri: string;
  user: {
    email: string;
    name: string;
    picture?: string;
  };
};

function getCallbackParams(url: string) {
  const queryString = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
  const fragmentString = url.includes('#') ? url.split('#')[1] : '';
  const params = new URLSearchParams([queryString, fragmentString].filter(Boolean).join('&'));

  return {
    code: params.get('code'),
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  };
}

/**
 * Request Google Sign In through Supabase OAuth.
 * Supabase owns the Google token exchange and returns an app session.
 */
export async function requestGoogleSignIn(): Promise<GoogleAuthResponse | null> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) throw error;
    if (!data.url) {
      throw new Error('Supabase no devolvió una URL para iniciar sesión con Google.');
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type !== 'success') {
      return null;
    }

    const callback = getCallbackParams(result.url);
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
        : await supabase.auth.getSession();

    if (sessionResult.error) throw sessionResult.error;

    const session = sessionResult.data.session;
    if (!session?.user) {
      throw new Error('Google no devolvió una sesión válida de Supabase.');
    }

    return {
      session,
      redirectUri: redirectUrl,
      user: {
        email: session.user.email || '',
        name:
          (session.user.user_metadata as any)?.full_name ||
          (session.user.user_metadata as any)?.name ||
          session.user.email ||
          'Agro Manager',
        picture:
          (session.user.user_metadata as any)?.avatar_url ||
          (session.user.user_metadata as any)?.picture,
      },
    };
  } catch (error) {
    console.error('Error durante Google Sign In:', error);
    throw error;
  }
}

/**
 * Exchange Google ID Token for Supabase session
 * This should be called from Supabase auth function
 */
export function getGoogleAuthPayload(response: GoogleAuthResponse) {
  return {
    email: response.user.email,
    name: response.user.name,
    picture: response.user.picture,
    supabase_user_id: response.session.user.id,
    redirect_uri: response.redirectUri,
  };
}
