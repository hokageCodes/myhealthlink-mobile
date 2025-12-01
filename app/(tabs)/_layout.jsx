import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import useAuthStore from '../../src/store/authStore';
import CustomBottomNav from '../../components/CustomBottomNav';

export default function TabsLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      await initialize();
      if (!isAuthenticated && !isLoading) {
        router.replace('/login');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // Don't render tabs if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="health" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="medications" />
        <Stack.Screen name="documents" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile" />
      </Stack>
      <CustomBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

