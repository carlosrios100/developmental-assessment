import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth-store';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

export default function RootLayout() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#ffffff' },
            }}
          >
            {isAuthenticated ? (
              <>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="child/[id]"
                  options={{
                    headerShown: true,
                    headerTitle: 'Child Profile',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="child/new"
                  options={{
                    headerShown: true,
                    headerTitle: 'Add Child',
                    headerBackTitle: 'Back',
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="assessment/[id]"
                  options={{
                    headerShown: true,
                    headerTitle: 'Assessment',
                    headerBackTitle: 'Back',
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="screening/index"
                  options={{
                    headerShown: true,
                    headerTitle: 'Developmental Screener',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen name="screening/[age]" options={{ headerShown: false }} />
                <Stack.Screen
                  name="screening/results"
                  options={{ headerShown: false, gestureEnabled: false }}
                />
              </>
            ) : (
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            )}
          </Stack>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
