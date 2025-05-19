import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./lib/supabase";
import { AuthScreen } from "./screens/AuthScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TabNavigator from "./navigation/TabNavigator";
import * as Updates from "expo-updates";
import LogRocket from "@logrocket/react-native";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { colors } from "./theme/colors";

const Stack = createNativeStackNavigator();

// Main app container with safe area handling
function AppContent() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    return () => listener?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    LogRocket.init("ceqmhr/grosheries", {
      updateId: Updates.isEmbeddedLaunch ? null : Updates.updateId,
      expoChannel: Updates.channel,
    });
  }, []);

  if (session === null) {
    // Show loading state
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    // Not logged in - show auth screen
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  // Logged in - show main app
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </View>
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
