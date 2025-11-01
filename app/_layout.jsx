import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import useAuthStore from '../src/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize auth store on app start
    const init = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    init();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="verify-otp" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

