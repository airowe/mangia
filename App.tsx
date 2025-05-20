import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./lib/supabase";
import { AuthScreen } from "./screens/AuthScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TabNavigator from "./navigation/TabNavigator";
import { ActivityIndicator, StatusBar, StyleSheet, View, Text } from "react-native";
import { colors } from "./theme/colors";
import { Screen } from "./components/Screen";

const Stack = createNativeStackNavigator();

// Main app container with safe area handling
function AppContent() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Always use real Supabase auth in both dev and production
    supabase.auth.getSession().then(({ data }) => {
      console.log('Initial session:', data.session);
      setSession(data.session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    // Not logged in - show auth screen
    return (
      <Screen noPadding style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <Stack.Navigator 
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </Screen>
    );
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
