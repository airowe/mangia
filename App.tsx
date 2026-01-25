import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "./lib/clerk";
import { ClerkTokenProvider } from "./contexts/ClerkTokenProvider";
import { AuthScreen } from "./screens/AuthScreen";
import { AccountScreen } from "./screens/AccountScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import TabNavigator from "./navigation/TabNavigator";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { colors } from "./theme/colors";

const Stack = createNativeStackNavigator();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable");
}

// Loading component while Clerk initializes
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

// Navigation component that uses auth state
function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();

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
              title: 'Account',
              headerBackTitle: 'Back'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
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

// Main app component with necessary providers
export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Missing Clerk publishable key</Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <PaperProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <AppContent />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </PaperProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    marginBottom: 20,
    textAlign: "center",
  },
});
