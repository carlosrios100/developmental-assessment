import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const SETTINGS_STORAGE_KEY = 'devassess_settings';

interface Settings {
  notificationsEnabled: boolean;
  darkMode: boolean;
  reminderFrequency: 'weekly' | 'biweekly' | 'monthly';
}

interface SettingsState extends Settings {
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setDarkMode: (enabled: boolean) => Promise<void>;
  setReminderFrequency: (frequency: Settings['reminderFrequency']) => Promise<void>;
  syncToRemote: () => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  darkMode: false,
  reminderFrequency: 'monthly',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoading: true,

  initialize: async () => {
    try {
      // Load from local storage first (fast)
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Settings>;
        set({ ...DEFAULT_SETTINGS, ...parsed, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      // Then try to sync from remote (Supabase profiles.settings)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('settings')
          .eq('id', user.id)
          .single();

        if (data?.settings) {
          const remoteSettings = data.settings as Partial<Settings>;
          const merged = { ...DEFAULT_SETTINGS, ...remoteSettings };
          set(merged);
          await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
    await persistLocally(get());
    get().syncToRemote();
  },

  setDarkMode: async (enabled: boolean) => {
    set({ darkMode: enabled });
    await persistLocally(get());
    get().syncToRemote();
  },

  setReminderFrequency: async (frequency: Settings['reminderFrequency']) => {
    set({ reminderFrequency: frequency });
    await persistLocally(get());
    get().syncToRemote();
  },

  syncToRemote: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const state = get();
      const settings: Settings = {
        notificationsEnabled: state.notificationsEnabled,
        darkMode: state.darkMode,
        reminderFrequency: state.reminderFrequency,
      };

      await supabase
        .from('profiles')
        .update({ settings })
        .eq('id', user.id);
    } catch (error) {
      // Silently fail - local settings are the source of truth offline
      console.error('Failed to sync settings to remote:', error);
    }
  },
}));

async function persistLocally(state: SettingsState) {
  const settings: Settings = {
    notificationsEnabled: state.notificationsEnabled,
    darkMode: state.darkMode,
    reminderFrequency: state.reminderFrequency,
  };
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
