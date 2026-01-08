import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import '../../global.css';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/state/auth-store';
import { supabase } from '@/lib/supabase';
import useStorageStore from '@/lib/state/storage-store';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const { session, initialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-container" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-container" options={{ presentation: 'modal' }} />
        <Stack.Screen name="container/[id]" />
        <Stack.Screen name="add-item" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-item" options={{ presentation: 'modal' }} />
        <Stack.Screen name="all-items" options={{ presentation: 'modal' }} />
        <Stack.Screen name="locations" options={{ presentation: 'modal' }} />
        <Stack.Screen name="categories" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="photo-viewer" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      </Stack>
    </ThemeProvider>
  );
}



export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { setSession, initialized } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        useStorageStore.getState().fetchData();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session?.user) {
        useStorageStore.getState().fetchData();
      } else if (event === 'SIGNED_OUT') {
        useStorageStore.getState().clearData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Hide splash screen when initialized OR after 3 seconds fallback
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };

    if (initialized) {
      hideSplash();
    } else {
      const timeout = setTimeout(hideSplash, 3000);
      return () => clearTimeout(timeout);
    }
  }, [initialized]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootLayoutNav colorScheme={colorScheme} />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}