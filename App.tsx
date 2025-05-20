import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./lib/supabase";
import { AuthScreen } from "./screens/AuthScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TabNavigator from "./navigation/TabNavigator";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Button,
} from "react-native";
import { colors } from "./theme/colors";
import { Screen } from "./components/Screen";

const Stack = createNativeStackNavigator();

// Main app container with safe area handling
function AppContent() {
  function AppContent() {
    const [session, setSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let isMounted = true;

      const initializeAuth = async () => {
        try {
          const { data, error: sessionError } =
            await supabase.auth.getSession();

          if (isMounted) {
            if (sessionError) {
              console.error("Error getting session:", sessionError);
              setError("Failed to check authentication status");
              return;
            }
            console.log("Initial session:", data.session);
            setSession(data.session);
          }
        } catch (err) {
          console.error("Unexpected error:", err);
          if (isMounted) {
            setError("An unexpected error occurred");
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      initializeAuth();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event, session);
        if (isMounted) {
          setSession(session);
          setError(null);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }, []);

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={() => {
              setError(null);
              setIsLoading(true);
              supabase.auth.getSession().then(({ data }) => {
                setSession(data.session);
                setIsLoading(false);
              });
            }}
          />
        </View>
      );
    }
  }

  // Logged in - show main app
  return (
    <Screen noPadding style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </Screen>
  );
}

// Main app component with necessary providers
export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppContent />
      </GestureHandlerRootView>
    </SafeAreaProvider>
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
