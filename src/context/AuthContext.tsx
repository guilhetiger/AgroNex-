import React, { createContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@services/supabaseClient';
import { authStorage } from '@services/storage';
import { User } from '../types/index';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
  signOut: async () => {}
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

  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  return normalizedEmail;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let authListener: { data?: { subscription: { unsubscribe: () => void } } } | null = null;

    async function initializeUser() {
      try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseKey || supabaseKey.includes('placeholder')) {
          // Development mode: load from local storage only
          console.log('Development mode: Loading user from local storage');
          const saved = await authStorage.getUser();
          if (saved) setUser(saved);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session?.user) {
          const profile = data.session.user;
          const payload: User = {
            id: profile.id,
            email: profile.email || '',
            name: (profile.user_metadata as any)?.full_name || profile.email || 'Agro Manager'
          };
          setUser(payload);
          await authStorage.saveUser(payload);
        } else {
          const saved = await authStorage.getUser();
          if (saved) setUser(saved);
        }
      } catch {
        const saved = await authStorage.getUser();
        if (saved) setUser(saved);
      } finally {
        setLoading(false);
      }
    }

    initializeUser();

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseKey && !supabaseKey.includes('placeholder')) {
      authListener = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const profile = session.user;
          const payload: User = {
            id: profile.id,
            email: profile.email || '',
            name: (profile.user_metadata as any)?.full_name || profile.email || 'Agro Manager'
          };
          setUser(payload);
          authStorage.saveUser(payload);
        } else {
          setUser(null);
          authStorage.clear();
        }
      });
    }

    return () => {
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = validateCredentials(email, password);

    // Check if Supabase is properly configured
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseKey || supabaseKey.includes('placeholder')) {
      // Development mode: simulate successful signin
      console.log('Development mode: Simulating user signin');
      const payload: User = {
        id: `dev-${Date.now()}`,
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0] || 'Agro Manager'
      };
      setUser(payload);
      await authStorage.saveUser(payload);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Correo o contraseña incorrectos. Revisa tus datos e inténtalo otra vez.');
      }
      throw error;
    }
    if (data.user) {
      const payload: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: (data.user.user_metadata as any)?.full_name || data.user.email || 'Agro Manager'
      };
      setUser(payload);
      await authStorage.saveUser(payload);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const normalizedEmail = validateCredentials(email, password);
    if (!name.trim()) {
      throw new Error('Ingresa tu nombre o el nombre de tu empresa.');
    }

    // Check if Supabase is properly configured
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseKey || supabaseKey.includes('placeholder')) {
      // Development mode: simulate successful signup
      console.log('Development mode: Simulating user signup');
      const payload: User = {
        id: `dev-${Date.now()}`,
        email: normalizedEmail,
        name: name.trim()
      };
      setUser(payload);
      await authStorage.saveUser(payload);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) throw error;
    if (data.user) {
      const payload: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: name.trim()
      };
      setUser(payload);
      await authStorage.saveUser(payload);
    }
  };

  const resetPassword = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Ingresa tu correo electrónico.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('El correo electrónico no tiene un formato válido.');
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseKey || supabaseKey.includes('placeholder')) {
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await authStorage.clear();
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, signIn, signUp, resetPassword, signOut }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };

export function useAuth() {
  return React.useContext(AuthContext);
}
