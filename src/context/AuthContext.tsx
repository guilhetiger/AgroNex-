import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { hasSupabaseConfig, supabase } from '@services/supabaseClient';
import { authStorage } from '@services/storage';
import { handleAuthCallbackFromUrl } from '@services/authCallback';
import { getOAuthRedirectUri } from '@services/authRedirect';
import { getAccessState, getFallbackAccessState, type AccessState } from '@services/subscriptionService';
import { trackAppSession, trackSubscriptionEvent } from '@services/analyticsService';
import { auditService } from '@services/auditService';
import { queryClient } from '@services/queryClient';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { User, UserRole } from '../types/index';

export type SignUpResult = {
  needsEmailConfirmation: boolean;
  message?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<SignUpResult | void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  access: AccessState | null;
  refreshAccess: () => Promise<void>;
  activateSubscription: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  auditEvent: (action: 'login' | 'logout' | 'admin_action' | 'invalid_session', details?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
  signOut: async () => {},
  access: null,
  refreshAccess: async () => {},
  activateSubscription: async () => {},
  hasRole: () => false,
  auditEvent: async () => {},
});

function validateCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Ingresa tu correo electrónico.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('El correo electrónico no tiene un formato válido.');
  }

  if (!password) {
    throw new Error('Ingresa tu contraseña.');
  }

  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  return normalizedEmail;
}

function getUserRole(profile: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): UserRole {
  const appRole = profile.app_metadata?.role;
  if (appRole === 'admin') {
    return 'admin';
  }
  if (appRole === 'operator') {
    return 'operator';
  }

  // TODO(migration): Remove user_metadata.role fallback once all operators use app_metadata.role in Supabase.
  if (profile.user_metadata?.role === 'operator') {
    return 'operator';
  }

  return 'client';
}

function createUserPayload(profile: any): User {
  return {
    id: profile.id,
    email: profile.email || '',
    name: (profile.user_metadata as any)?.full_name || profile.email || 'Agro Manager',
    role: getUserRole(profile),
  };
}

function mapSignInError(error: any) {
  const message = String(error?.message || error || '').toLowerCase();

  if (message.includes('email not confirmed') || message.includes('not confirmed')) {
    return new Error(
      'Tu cuenta aún no está activa. Abre el enlace de confirmación que enviamos a tu correo (revisa también spam) y vuelve a iniciar sesión.'
    );
  }

  if (message.includes('invalid login credentials')) {
    return new Error(
      'Correo o contraseña incorrectos. Si acabas de registrarte, revisa tu correo (incluido spam) y confirma tu cuenta antes de iniciar sesión.'
    );
  }

  if (message.includes('too many requests') || message.includes('rate limit')) {
    return new Error('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
  }

  return error instanceof Error ? error : new Error('No se pudo iniciar sesión. Intenta nuevamente.');
}

function mapSignUpError(error: any) {
  const message = String(error?.message || error || '').toLowerCase();

  if (message.includes('already registered') || message.includes('already exists')) {
    return new Error('Este correo ya está registrado. Inicia sesión o recupera tu contraseña.');
  }

  if (message.includes('password')) {
    return new Error('La contraseña no cumple los requisitos de seguridad. Usa al menos 8 caracteres.');
  }

  return error instanceof Error ? error : new Error('No se pudo crear la cuenta. Intenta nuevamente.');
}

async function clearLocalAppData() {
  await AsyncStorage.multiRemove([
    'AGRONEX_LOCAL_CLIENTS',
    'AGRONEX_LOCAL_FLIGHTS',
    'AGRONEX_LOCAL_AGROCHEMICALS',
    'AGRONEX_LOCAL_EXPENSES',
    'AGRONEX_DELETED_CLIENTS',
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const access = useAuthStore((state) => state.access);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setAuthState = useAuthStore((state) => state.setAuthState);
  const setAccess = useAuthStore((state) => state.setAccess);
  const resetAuthState = useAuthStore((state) => state.resetAuthState);
  const authReadyRef = useRef(false);
  const processedAuthUrlsRef = useRef(new Set<string>());
  const trackedSessionUserRef = useRef<string | null>(null);
  const trackedExpiredUserRef = useRef<string | null>(null);

  const processAuthCallbackUrl = useCallback(async (url: string | null) => {
    if (!url || !hasSupabaseConfig || processedAuthUrlsRef.current.has(url)) {
      return;
    }

    processedAuthUrlsRef.current.add(url);

    try {
      const session = await handleAuthCallbackFromUrl(url);
      if (!session?.user) {
        return;
      }

      const payload = createUserPayload(session.user);
      setAuthState({ user: payload, session });
      await authStorage.saveUser(payload);
      await auditService.record({
        user_id: payload.id,
        email: payload.email,
        role: payload.role,
        action: 'login',
        details: 'Sesión creada desde enlace de confirmación o recuperación',
      });
    } catch (error) {
      console.error('Error procesando enlace de autenticación:', error);
    }
  }, [setAuthState]);

  const resetLocalAuthState = useCallback(async () => {
    await authStorage.clear();
    await queryClient.clear();
    useDataStore.getState().resetDataStore();
    resetAuthState();
  }, [resetAuthState]);

  const hydrateFromSession = useCallback(
    async (session: Session) => {
      const payload = createUserPayload(session.user);
      setAuthState({ user: payload, session });
      await authStorage.saveUser(payload);
    },
    [setAuthState]
  );

  const auditEvent = useCallback(async (
    action: 'login' | 'logout' | 'admin_action' | 'invalid_session',
    details = ''
  ) => {
    if (!user) return;
    await auditService.record({
      user_id: user.id,
      email: user.email,
      role: user.role,
      action,
      details,
    });
  }, [user]);

  const hasRole = useCallback((roles: UserRole[]) => {
    return !!user && roles.includes(user.role);
  }, [setAccess, user]);

  useEffect(() => {
    let authListener: { data?: { subscription: { unsubscribe: () => void } } } | null = null;

    async function initializeUser() {
      try {
        if (!hasSupabaseConfig) {
          await resetLocalAuthState();
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error inicializando sesión:', error);
          return;
        }

        if (data.session?.user) {
          await hydrateFromSession(data.session);
          return;
        }

        const { user: restoredUser, session: restoredSession } = useAuthStore.getState();
        if (restoredSession?.user || restoredUser) {
          return;
        }

        // No Supabase session and no in-memory user — clear cached profile only.
        // Never call signOut here: that revokes/logs out a session that may have
        // just been created while getSession() was in flight.
        await authStorage.clear();
      } catch (error) {
        console.error('Error inicializando sesión:', error);
        const { user: restoredUser, session: restoredSession } = useAuthStore.getState();
        if (!restoredSession?.user && !restoredUser) {
          await authStorage.clear();
        }
      } finally {
        authReadyRef.current = true;
        setLoading(false);
      }
    }

    if (hasSupabaseConfig) {
      authListener = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
        if (session?.user) {
          const payload = createUserPayload(session.user);
          setAuthState({ user: payload, session });
          void authStorage.saveUser(payload);
          if (!authReadyRef.current) {
            authReadyRef.current = true;
            setLoading(false);
          }
          return;
        }

        if (event === 'SIGNED_OUT' || (event as string) === 'USER_DELETED') {
          void resetLocalAuthState();
        }
      });
    }

    initializeUser();

    return () => {
      authReadyRef.current = false;
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, [hydrateFromSession, resetLocalAuthState, setAuthState, setLoading]);

  useEffect(() => {
    if (!hasSupabaseConfig || Platform.OS === 'web') {
      return;
    }

    void Linking.getInitialURL().then((url) => processAuthCallbackUrl(url));

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void processAuthCallbackUrl(url);
    });

    return () => subscription.remove();
  }, [processAuthCallbackUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      if (!user) {
        setAccess(null);
        return;
      }
      try {
        const nextAccess = await getAccessState(user);
        if (!cancelled) {
          setAccess(nextAccess);
          if (trackedSessionUserRef.current !== user.id) {
            trackedSessionUserRef.current = user.id;
            void trackAppSession(user.id);
          }
          if (!nextAccess.hasAccess && trackedExpiredUserRef.current !== user.id) {
            trackedExpiredUserRef.current = user.id;
            void trackSubscriptionEvent(user.id, 'expired', { status: nextAccess.status, plan: nextAccess.plan });
          }
        }
      } catch (error) {
        console.error('Error cargando acceso:', error);
        if (!cancelled) setAccess(getFallbackAccessState(user));
      }
    }

    loadAccess();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = validateCredentials(email, password);

    // Always validate against Supabase (required for production)
    if (!hasSupabaseConfig) {
      throw new Error('El servidor no está configurado. Por favor contacta al administrador.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) {
      throw mapSignInError(error);
    }
    if (data.user) {
      const payload = createUserPayload(data.user);
      setAuthState({ user: payload, session: data.session });
      await authStorage.saveUser(payload);
      await auditService.record({
        user_id: payload.id,
        email: payload.email,
        role: payload.role,
        action: 'login',
        details: 'Inicio de sesión con email/contraseña',
      });
      return;
    }

    throw new Error('No se pudo iniciar sesión. Intenta nuevamente.');
  }, [setAuthState]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const normalizedEmail = validateCredentials(email, password);
    if (!name.trim()) {
      throw new Error('Ingresa tu nombre o el nombre de tu empresa.');
    }

    // Always validate against Supabase (required for production)
    if (!hasSupabaseConfig) {
      throw new Error('El servidor no está configurado. Por favor contacta al administrador.');
    }

    const redirectTo = getOAuthRedirectUri();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: name.trim() },
      },
    });

    if (error) throw mapSignUpError(error);
    if (data.session?.user) {
      const payload = createUserPayload(data.session.user);
      setAuthState({ user: payload, session: data.session });
      await authStorage.saveUser(payload);
      await auditService.record({
        user_id: payload.id,
        email: payload.email,
        role: payload.role,
        action: 'login',
        details: 'Registro de usuario con cuenta nueva',
      });
      await clearLocalAppData();
      return;
    }

    if (data.user) {
      await authStorage.clear();
      await clearLocalAppData();
      return {
        needsEmailConfirmation: true,
        message: 'Cuenta creada correctamente. Revisa tu correo para confirmarla y luego inicia sesión.',
      };
    }

    throw new Error('No se pudo verificar la creación de la cuenta. Intenta de nuevo.');
  }, [setAuthState]);

  const signInWithGoogle = useCallback(async () => {
    if (!hasSupabaseConfig) {
      throw new Error('El servidor no está configurado. Por favor contacta al administrador.');
    }

    try {
      const { requestGoogleSignIn } = await import('@services/googleAuth');
      const googleResponse = await requestGoogleSignIn();

      if (!googleResponse) {
        throw new Error('Se canceló el inicio de sesión con Google.');
      }

      const payload = createUserPayload(googleResponse.session.user);
      setAuthState({ user: payload, session: googleResponse.session });
      await authStorage.saveUser(payload);
      await auditService.record({
        user_id: payload.id,
        email: payload.email,
        role: payload.role,
        action: 'login',
        details: 'Inicio de sesión con Google',
      });
    } catch (error: any) {
      console.error('Error en Google Sign In:', error);
      throw error;
    }
  }, [setAuthState]);

  const resetPassword = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Ingresa tu correo electrónico.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('El correo electrónico no tiene un formato válido.');
    }

    if (!hasSupabaseConfig) {
      return;
    }

    const redirectTo = getOAuthRedirectUri();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const currentUser = user;
    if (currentUser) {
      await auditService.record({
        user_id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        action: 'logout',
        details: 'Cierre de sesión manual',
      });
    }
    if (hasSupabaseConfig) {
      await supabase.auth.signOut();
      return;
    }
    await resetLocalAuthState();
  }, [resetLocalAuthState, user]);
  const refreshAccess = useCallback(async () => {
    if (!user) {
      setAccess(null);
      return;
    }
    setAccess(await getAccessState(user));
  }, [setAccess, user]);

  const activateSubscription = useCallback(async () => {
    await refreshAccess();
  }, [refreshAccess]);

  const value = useMemo(
    () => ({ user, loading, signIn, signInWithGoogle, signUp, resetPassword, signOut, access, refreshAccess, activateSubscription, hasRole, auditEvent }),
    [
      user,
      loading,
      access,
      signIn,
      signInWithGoogle,
      signUp,
      resetPassword,
      signOut,
      refreshAccess,
      activateSubscription,
      hasRole,
      auditEvent,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };

export function useAuth() {
  return React.useContext(AuthContext);
}
