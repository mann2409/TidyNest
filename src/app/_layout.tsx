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
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { useSurveyStore } from '@/lib/state/survey-store';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const isGuest = useAuthStore((s) => s.isGuest);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const userKey = userId || (isGuest ? 'guest' : null);
  
  const hasCompletedSurvey = useSurveyStore((s) =>
    userKey ? !!s.completedByUserId[userKey] : false
  );
  const hasCompletedOnboarding = useOnboardingStore((s) =>
    userKey ? !!s.completedByUserId[userKey] : false
  );
  
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inSurvey = segments[0] === 'welcome-survey';
    const inOnboarding = segments[0] === 'onboarding';
    const inFirstLocation = segments[0] === 'first-location';
    const inFirstBox = segments[0] === 'first-box';
    const inVictory = segments[0] === 'victory';
    const inOnboardingFlow = inSurvey || inOnboarding || inFirstLocation || inFirstBox || inVictory;
    
    // Not logged in and not guest - go to auth
    if (!session && !isGuest && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    // Logged in or guest
    if (session || isGuest) {
      // First: check if survey is completed
      if (!hasCompletedSurvey && !inSurvey) {
        router.replace('/welcome-survey');
        return;
      }
      
      // Second: check if onboarding is completed
      if (hasCompletedSurvey && !hasCompletedOnboarding && !inOnboardingFlow) {
        router.replace('/onboarding');
        return;
      }
      
      // All done - go to main app (only if in auth or onboarding screens)
      if (hasCompletedSurvey && hasCompletedOnboarding && (inAuthGroup || inOnboardingFlow)) {
        router.replace('/(tabs)');
        return;
      }
    }
  }, [session, isGuest, initialized, segments, hasCompletedSurvey, hasCompletedOnboarding]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome-survey" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="first-location" />
        <Stack.Screen name="first-box" />
        <Stack.Screen name="victory" />
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
  const { setSession, initialized, setIsPro } = useAuthStore();

  useEffect(() => {
    // Initialize RevenueCat
    const setupPurchases = async () => {
      try {
        if (Platform.OS === 'ios') {
          const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
          if (iosKey) await Purchases.configure({ apiKey: iosKey });
        } else if (Platform.OS === 'android') {
          const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
          if (androidKey) await Purchases.configure({ apiKey: androidKey });
        }
        
        // Sync subscriber status on boot
        const customerInfo = await Purchases.getCustomerInfo();
        const hasPro = typeof customerInfo.entitlements.active['TidyNest Pro'] !== "undefined";
        console.log('RevenueCat Status:', { hasPro, entitlements: Object.keys(customerInfo.entitlements.active) });
        setIsPro(hasPro);
      } catch (e) {
        console.warn("RevenueCat initialization failed", e);
        setIsPro(false); // Explicitly set to false on error
      }
    };

    setupPurchases();

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