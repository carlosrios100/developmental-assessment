import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmail, signUpWithEmail, signOut as supabaseSignOut } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

const mockSignIn = signInWithEmail as jest.Mock;
const mockSignUp = signUpWithEmail as jest.Mock;
const mockSignOut = supabaseSignOut as jest.Mock;
const mockAuth = (global as any).__mockSupabaseAuth;

// Reset store between tests
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isDemoMode: false,
  });
  jest.clearAllMocks();
});

describe('auth-store', () => {
  describe('initial state', () => {
    it('starts with loading true and not authenticated', () => {
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isDemoMode).toBe(false);
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
    });
  });

  describe('initialize', () => {
    it('enters demo mode when demo flag is stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isDemoMode).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('loads existing session from supabase', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const mockSession = { user: { id: 'user-1', email: 'test@test.com' } };
      mockAuth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.session).toBe(mockSession);
      expect(state.user).toBe(mockSession.user);
      expect(state.isLoading).toBe(false);
    });

    it('sets not authenticated when no session exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      mockAuth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('handles initialization error gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('signIn', () => {
    it('sets session and user on successful sign in', async () => {
      const mockData = {
        session: { access_token: 'token-123' },
        user: { id: 'user-1', email: 'test@test.com' },
      };
      mockSignIn.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await useAuthStore.getState().signIn('test@test.com', 'password');

      expect(result.error).toBeNull();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBe(mockData.user);
      expect(state.session).toBe(mockData.session);
      expect(state.isLoading).toBe(false);
    });

    it('returns error on failed sign in', async () => {
      mockSignIn.mockResolvedValueOnce({
        data: {},
        error: { message: 'Invalid credentials' },
      });

      const result = await useAuthStore.getState().signIn('bad@test.com', 'wrong');

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error!.message).toBe('Invalid credentials');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('sets session on successful sign up with immediate session', async () => {
      const mockData = {
        session: { access_token: 'new-token' },
        user: { id: 'user-2', email: 'new@test.com' },
      };
      mockSignUp.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await useAuthStore.getState().signUp('new@test.com', 'password', 'New User');

      expect(result.error).toBeNull();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBe(mockData.user);
    });

    it('handles sign up requiring email confirmation', async () => {
      const mockData = {
        session: null,
        user: { id: 'user-3', email: 'confirm@test.com' },
      };
      mockSignUp.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await useAuthStore.getState().signUp('confirm@test.com', 'password', 'Confirm User');

      expect(result.error).toBeNull();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false); // No session yet
    });

    it('returns error on failed sign up', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: {},
        error: { message: 'Email already registered' },
      });

      const result = await useAuthStore.getState().signUp('existing@test.com', 'password', 'Existing');

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error!.message).toBe('Email already registered');
    });
  });

  describe('signOut', () => {
    it('clears all auth state and removes demo mode flag', async () => {
      // Set up authenticated state first
      useAuthStore.setState({
        user: { id: 'user-1' } as any,
        session: { access_token: 'token' } as any,
        isAuthenticated: true,
        isDemoMode: true,
        isLoading: false,
      });

      await useAuthStore.getState().signOut();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@devassess/demo_mode');
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isDemoMode).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('enterDemoMode', () => {
    it('sets demo mode flag in storage and state', async () => {
      await useAuthStore.getState().enterDemoMode();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@devassess/demo_mode', 'true');
      const state = useAuthStore.getState();
      expect(state.isDemoMode).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setSession', () => {
    it('updates session and user', () => {
      const session = {
        access_token: 'token',
        user: { id: 'user-1', email: 'test@test.com' },
      } as any;

      useAuthStore.getState().setSession(session);

      const state = useAuthStore.getState();
      expect(state.session).toBe(session);
      expect(state.user).toBe(session.user);
      expect(state.isAuthenticated).toBe(true);
    });

    it('clears session when null is passed', () => {
      useAuthStore.setState({
        session: { access_token: 'token' } as any,
        user: { id: 'user-1' } as any,
        isAuthenticated: true,
      });

      useAuthStore.getState().setSession(null);

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
