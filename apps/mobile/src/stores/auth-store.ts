import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, signInWithEmail, signUpWithEmail, signOut as supabaseSignOut } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        });
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    const { data, error } = await signInWithEmail(email, password);

    if (error) {
      set({ isLoading: false });
      return { error: new Error(error.message) };
    }

    set({
      session: data.session,
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });

    return { error: null };
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ isLoading: true });
    const { data, error } = await signUpWithEmail(email, password, fullName);

    if (error) {
      set({ isLoading: false });
      return { error: new Error(error.message) };
    }

    // Note: User might need to confirm email before session is available
    set({
      session: data.session,
      user: data.user,
      isAuthenticated: !!data.session,
      isLoading: false,
    });

    return { error: null };
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabaseSignOut();
    set({
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setSession: (session: Session | null) => {
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
    });
  },
}));
