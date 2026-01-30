import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
  useEffect(() => {
    // Hide splash screen after app is ready
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#ffffff' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="child/[id]"
              options={{
                headerShown: true,
                headerTitle: 'Child Profile',
                headerBackTitle: 'Back',
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
            <Stack.Screen
              name="screening/[age]"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="screening/results"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
