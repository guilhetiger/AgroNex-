import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { handleAuthCallbackFromUrl } from './authCallback';
import { getOAuthRedirectUri } from './authRedirect';
import { supabase } from './supabaseClient';

// Initialize web browser
WebBrowser.maybeCompleteAuthSession();

const redirectUrl = getOAuthRedirectUri();

export type GoogleAuthResponse = {
  session: Session;
  redirectUri: string;
  user: {
    email: string;
    name: string;
    picture?: string;
  };
};

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

    const session = await handleAuthCallbackFromUrl(result.url);
    if (!session?.user) {
      const fallback = await supabase.auth.getSession();
      if (fallback.error) throw fallback.error;
      if (!fallback.data.session?.user) {
        throw new Error('Google no devolvió una sesión válida de Supabase.');
      }
      return {
        session: fallback.data.session,
        redirectUri: redirectUrl,
        user: {
          email: fallback.data.session.user.email || '',
          name:
            (fallback.data.session.user.user_metadata as any)?.full_name ||
            (fallback.data.session.user.user_metadata as any)?.name ||
            fallback.data.session.user.email ||
            'Agro Manager',
          picture:
            (fallback.data.session.user.user_metadata as any)?.avatar_url ||
            (fallback.data.session.user.user_metadata as any)?.picture,
        },
      };
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
