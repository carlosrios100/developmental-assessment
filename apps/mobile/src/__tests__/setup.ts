// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
        return Promise.resolve();
      }),
    },
  };
});

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Supabase client
const mockFrom = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  then: jest.fn(),
}));

const mockAuth = {
  getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
  getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(() => Promise.resolve({ error: null })),
  onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: mockAuth,
  },
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signOut: jest.fn(() => Promise.resolve({ error: null })),
}));

// Make mocks accessible in tests
(global as any).__mockSupabaseFrom = mockFrom;
(global as any).__mockSupabaseAuth = mockAuth;

// Mock react-native-url-polyfill
jest.mock('react-native-url-polyfill/auto', () => {});
