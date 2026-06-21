import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { User } from '../types';
import type { AccessState } from '../services/subscriptionService';

type AuthStoreState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  access: AccessState | null;
  setLoading: (loading: boolean) => void;
  setAuthState: (payload: { user: User | null; session?: Session | null }) => void;
  setAccess: (access: AccessState | null) => void;
  resetAuthState: () => void;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  session: null,
  loading: true,
  access: null,
  setLoading: (loading) => set({ loading }),
  setAuthState: ({ user, session = null }) => set({ user, session }),
  setAccess: (access) => set({ access }),
  resetAuthState: () => set({ user: null, session: null, access: null, loading: false }),
}));
