module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@devassess/supabase/(.*)$': '<rootDir>/../../packages/supabase/$1',
  },
  transformIgnorePatterns: [
    '<rootDir>/../../node_modules/.pnpm/(?!((jest-)?react-native|@react-native(-community)?|react-clone-referenced-element|@react-native|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@supabase/.*|@tanstack/.*|lucide-react-native|zustand|@react-native-async-storage)/)',
    '<rootDir>/node_modules/.pnpm/(?!((jest-)?react-native|@react-native(-community)?|react-clone-referenced-element|@react-native|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@supabase/.*|@tanstack/.*|lucide-react-native|zustand|@react-native-async-storage)/)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/src/__tests__/setup.ts',
  ],
  collectCoverageFrom: [
    'src/stores/**/*.ts',
    'src/hooks/**/*.ts',
    'src/lib/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
