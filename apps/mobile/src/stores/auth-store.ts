import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, signInWithEmail, signUpWithEmail, signOut as supabaseSignOut } from '@/lib/supabase';

const DEMO_MODE_KEY = '@devassess/demo_mode';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  enterDemoMode: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isDemoMode: false,

  initialize: async () => {
    try {
      // Check for demo mode first
      const demoMode = await AsyncStorage.getItem(DEMO_MODE_KEY);
      if (demoMode === 'true') {
        set({
          isDemoMode: true,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

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
    await AsyncStorage.removeItem(DEMO_MODE_KEY);
    await supabaseSignOut();
    set({
      session: null,
      user: null,
      isAuthenticated: false,
      isDemoMode: false,
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

  enterDemoMode: async () => {
    await AsyncStorage.setItem(DEMO_MODE_KEY, 'true');
    set({
      isDemoMode: true,
      isAuthenticated: true,
      isLoading: false,
    });
  },
}));
