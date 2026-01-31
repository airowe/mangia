/**
 * Mangia App
 *
 * Main application entry point with all providers configured.
 * Includes onboarding flow for new users.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from './lib/clerk';
import { ClerkTokenProvider } from './contexts/ClerkTokenProvider';
import { AuthScreen } from './screens/AuthScreen';
import { AccountScreen } from './screens/AccountScreen';
import { OnboardingScreen, hasCompletedOnboarding } from './screens/OnboardingScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
} from 'react-native-paper';
import { SubscriptionProvider, DevSubscriptionProvider } from './contexts/SubscriptionContext';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import { ThemeProvider, useTheme } from './theme';
import TabNavigator from './navigation/TabNavigator';
import { DEV_BYPASS_AUTH } from './lib/devConfig';

const Stack = createNativeStackNavigator();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY && !DEV_BYPASS_AUTH) {
  console.error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable",
  );
}

// Loading component while Clerk initializes
function LoadingScreen() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.loadingContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

// Dev bypass navigator (no Clerk hooks)
function DevBypassNavigator() {
  const { theme } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const completed = await hasCompletedOnboarding();
    setShowOnboarding(!completed);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding === null) {
    return <LoadingScreen />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{
          headerShown: true,
          title: "Account",
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
        }}
      />
    </Stack.Navigator>
  );
}

// Navigation component that uses auth state
function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const { theme } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const completed = await hasCompletedOnboarding();
    setShowOnboarding(!completed);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (!isLoaded || showOnboarding === null) {
    return <LoadingScreen />;
  }

  // Show onboarding for new users (before auth)
  if (showOnboarding && !isSignedIn) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isSignedIn ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="Account"
            component={AccountScreen}
            options={{
              headerShown: true,
              title: "Account",
              headerBackTitle: "Back",
              headerStyle: {
                backgroundColor: theme.colors.background,
              },
              headerTintColor: theme.colors.text,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Paper theme provider that syncs with our app theme
function ThemedPaperProvider({ children }: { children: React.ReactNode }) {
  const { theme, isDark } = useTheme();

  const paperTheme = useMemo(() => {
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: theme.colors.primary,
        onPrimary: theme.colors.textOnPrimary,
        primaryContainer: theme.colors.primaryLight,
        onPrimaryContainer: theme.colors.text,
        secondary: theme.colors.secondary,
        onSecondary: theme.colors.textOnPrimary,
        background: theme.colors.background,
        onBackground: theme.colors.text,
        surface: theme.colors.card,
        onSurface: theme.colors.text,
        surfaceVariant: theme.colors.surface,
        onSurfaceVariant: theme.colors.textSecondary,
        outline: theme.colors.border,
        error: theme.colors.error,
        onError: theme.colors.textOnPrimary,
      },
    };
  }, [theme, isDark]);

  return <PaperProvider theme={paperTheme}>{children}</PaperProvider>;
}

// Deep linking configuration for share extension and Live Activities
const linking = {
  prefixes: ['mangia://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: {
            screens: {
              ImportRecipeScreen: 'import',
              CookingModeScreen: 'cooking/:recipeId',
            },
          },
        },
      },
    },
  },
};

// Navigate to ImportRecipeScreen with a shared URL
function navigateToImport(nav: NavigationContainerRef<any>, url: string) {
  nav.navigate('MainTabs', {
    screen: 'Home',
    params: {
      screen: 'ImportRecipeScreen',
      params: { sharedUrl: url },
    },
  });
}

// Handles shared URLs from the iOS Share Extension.
// When isAuthenticated is always true (dev bypass), pending URL queuing is skipped.
function ShareIntentHandler({ navigationRef, isAuthenticated }: {
  navigationRef: React.RefObject<NavigationContainerRef<any> | null>;
  isAuthenticated: boolean;
}) {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const pendingUrlRef = useRef<string | null>(null);

  // Process a shared URL, or queue it if nav isn't ready yet
  const processSharedUrl = useCallback((url: string) => {
    const nav = navigationRef.current;
    if (nav?.isReady()) {
      navigateToImport(nav, url);
      return;
    }
    // Nav not ready — wait for it via state listener
    pendingUrlRef.current = url;
  }, [navigationRef]);

  // When navigation becomes ready, flush any pending URL
  useEffect(() => {
    const nav = navigationRef.current;
    if (!nav || !pendingUrlRef.current) return;
    if (nav.isReady()) {
      const url = pendingUrlRef.current;
      pendingUrlRef.current = null;
      navigateToImport(nav, url);
      return;
    }
    const unsubscribe = nav.addListener('state', () => {
      if (nav.isReady() && pendingUrlRef.current) {
        const url = pendingUrlRef.current;
        pendingUrlRef.current = null;
        navigateToImport(nav, url);
        unsubscribe();
      }
    });
    return unsubscribe;
  }, [navigationRef, isAuthenticated]);

  // When a share intent arrives, either process or queue it
  useEffect(() => {
    if (!hasShareIntent || shareIntent.type !== 'weburl' || !shareIntent.webUrl) return;

    const url = shareIntent.webUrl;
    if (isAuthenticated) {
      processSharedUrl(url);
    } else {
      pendingUrlRef.current = url;
    }
    resetShareIntent();
  }, [hasShareIntent, shareIntent, isAuthenticated, processSharedUrl, resetShareIntent]);

  // Process queued URL after sign-in
  useEffect(() => {
    if (isAuthenticated && pendingUrlRef.current) {
      processSharedUrl(pendingUrlRef.current);
    }
  }, [isAuthenticated, processSharedUrl]);

  return null;
}

// Auth-aware wrapper that reads sign-in state from Clerk
function AuthShareIntentHandler({ navigationRef }: { navigationRef: React.RefObject<NavigationContainerRef<any> | null> }) {
  const { isSignedIn } = useAuth();
  return <ShareIntentHandler navigationRef={navigationRef} isAuthenticated={!!isSignedIn} />;
}

// Main app content with navigation
function AppContent() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  return (
    <ClerkTokenProvider>
      <SubscriptionProvider>
        <ShareIntentProvider>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <AuthShareIntentHandler navigationRef={navigationRef} />
            <RootNavigator />
          </NavigationContainer>
        </ShareIntentProvider>
      </SubscriptionProvider>
    </ClerkTokenProvider>
  );
}

// Error screen for missing Clerk key
function ErrorScreen() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.errorContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        Missing Clerk publishable key
      </Text>
    </View>
  );
}

// Dev bypass app content (no Clerk)
function DevBypassAppContent() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  return (
    <DevSubscriptionProvider>
      <ShareIntentProvider>
        <NavigationContainer ref={navigationRef} linking={linking}>
          <ShareIntentHandler navigationRef={navigationRef} isAuthenticated={true} />
          <DevBypassNavigator />
        </NavigationContainer>
      </ShareIntentProvider>
    </DevSubscriptionProvider>
  );
}

// Main app component with necessary providers
export default function App() {
  // Dev bypass mode - skip Clerk entirely
  if (DEV_BYPASS_AUTH) {
    console.log('🔓 DEV MODE: Auth bypassed for testing');
    return (
      <ThemeProvider>
        <ThemedPaperProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
              <DevBypassAppContent />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </ThemedPaperProvider>
      </ThemeProvider>
    );
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <ErrorScreen />
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        <ClerkLoaded>
          <ThemedPaperProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={styles.root}>
                <AppContent />
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </ThemedPaperProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginBottom: 20,
    textAlign: "center",
  },
});
