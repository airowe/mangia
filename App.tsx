/**
 * Mangia App
 *
 * Main application entry point with all providers configured.
 */

import React, { useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "./lib/clerk";
import { ClerkTokenProvider } from "./contexts/ClerkTokenProvider";
import { AuthScreen } from "./screens/AuthScreen";
import { AccountScreen } from "./screens/AccountScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
} from "react-native-paper";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { ThemeProvider, useTheme } from "./theme";
import TabNavigator from "./navigation/TabNavigator";
import { ActivityIndicator, StyleSheet, View, Text } from "react-native";

const Stack = createNativeStackNavigator();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
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

// Navigation component that uses auth state
function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const { theme } = useTheme();

  if (!isLoaded) {
    return <LoadingScreen />;
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

// Main app content with navigation
function AppContent() {
  return (
    <ClerkTokenProvider>
      <SubscriptionProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
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

// Main app component with necessary providers
export default function App() {
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
