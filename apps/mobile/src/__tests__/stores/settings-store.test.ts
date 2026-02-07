import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '@/stores/settings-store';

const mockAuth = (global as any).__mockSupabaseAuth;

beforeEach(() => {
  useSettingsStore.setState({
    notificationsEnabled: true,
    darkMode: false,
    reminderFrequency: 'monthly',
    isLoading: true,
  });
  jest.clearAllMocks();
});

describe('settings-store', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useSettingsStore.getState();
      expect(state.notificationsEnabled).toBe(true);
      expect(state.darkMode).toBe(false);
      expect(state.reminderFrequency).toBe('monthly');
      expect(state.isLoading).toBe(true);
    });
  });

  describe('initialize', () => {
    it('loads settings from local storage', async () => {
      const stored = JSON.stringify({
        notificationsEnabled: false,
        darkMode: true,
        reminderFrequency: 'weekly',
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(stored);
      mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      await useSettingsStore.getState().initialize();

      const state = useSettingsStore.getState();
      expect(state.notificationsEnabled).toBe(false);
      expect(state.darkMode).toBe(true);
      expect(state.reminderFrequency).toBe('weekly');
      expect(state.isLoading).toBe(false);
    });

    it('uses defaults when no stored settings', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      await useSettingsStore.getState().initialize();

      const state = useSettingsStore.getState();
      expect(state.notificationsEnabled).toBe(true);
      expect(state.darkMode).toBe(false);
      expect(state.reminderFrequency).toBe('monthly');
      expect(state.isLoading).toBe(false);
    });

    it('handles initialization error gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage broken'));

      await useSettingsStore.getState().initialize();

      const state = useSettingsStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setNotificationsEnabled', () => {
    it('updates state and persists locally', async () => {
      useSettingsStore.setState({ isLoading: false });
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await useSettingsStore.getState().setNotificationsEnabled(false);

      expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'devassess_settings',
        expect.stringContaining('"notificationsEnabled":false')
      );
    });
  });

  describe('setDarkMode', () => {
    it('updates state and persists locally', async () => {
      useSettingsStore.setState({ isLoading: false });
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await useSettingsStore.getState().setDarkMode(true);

      expect(useSettingsStore.getState().darkMode).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'devassess_settings',
        expect.stringContaining('"darkMode":true')
      );
    });
  });

  describe('setReminderFrequency', () => {
    it('updates state and persists locally', async () => {
      useSettingsStore.setState({ isLoading: false });
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await useSettingsStore.getState().setReminderFrequency('biweekly');

      expect(useSettingsStore.getState().reminderFrequency).toBe('biweekly');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'devassess_settings',
        expect.stringContaining('"reminderFrequency":"biweekly"')
      );
    });
  });
});
