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
  Alert,
  LogBox,
  TouchableOpacity,
} from "react-native";
import { colors } from "./theme/colors";
import { Screen } from "./components/Screen";
import { getSession } from "./lib/auth";

// Declare global ErrorUtils for TypeScript
declare global {
  interface ErrorUtils {
    getGlobalHandler(): (error: Error, isFatal?: boolean) => void;
    setGlobalHandler(handler: (error: Error, isFatal?: boolean) => void): void;
  }
}

// Ignore specific warnings
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "AsyncStorage has been extracted from react-native core",
]);

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught:", error, errorInfo);
    Alert.alert(
      "Something went wrong",
      "The app encountered an error. Please restart the app."
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorBoundaryContainer}>
          <Text style={styles.errorBoundaryText}>
            Something went wrong. Please restart the app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const Stack = createNativeStackNavigator();

// Main app container with safe area handling
function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Get the current session from Supabase
        // This will use the persisted session from AsyncStorage if available
        const currentSession = await getSession();

        if (isMounted) {
          console.log("Initial session:", currentSession);
          setSession(currentSession);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event, newSession);
      if (isMounted) {
        setSession(newSession);
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

  // Debug log current state
  console.log('App rendering with state:', {
    isLoading,
    hasSession: !!session,
    error: error || 'No error'
  });

  // Show auth screen if no session, otherwise show main app
  return (
    <Screen noPadding style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer
        onReady={() => console.log('Navigation container is ready')}
        onStateChange={(state) => console.log('Navigation state changed:', state)}
      >
        <ErrorBoundary>
          {session ? (
            <TabNavigator />
          ) : (
            <Stack.Navigator 
              screenOptions={{ headerShown: false }}
              screenListeners={{
                state: (e) => {
                  console.log('Navigation state changed:', e.data.state);
                },
              }}
            >
              <Stack.Screen 
                name="Auth" 
                component={AuthScreen} 
                listeners={{
                  focus: () => console.log('Auth screen focused'),
                  blur: () => console.log('Auth screen blurred'),
                }}
              />
            </Stack.Navigator>
          )}
        </ErrorBoundary>
      </NavigationContainer>
    </Screen>
  );
}

// Debug button component for development
const DebugButton = () => {
  const showDebugInfo = () => {
    Alert.alert(
      'Debug Info',
      'Debug information is available in the console.',
      [
        { 
          text: 'Dump State to Console', 
          onPress: () => console.log('Debug: Current app state') 
        },
        { text: 'OK' }
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={{
        position: 'absolute',
        top: 50,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 20,
        zIndex: 9999,
      }}
      onPress={showDebugInfo}
    >
      <Text style={{ color: 'white' }}>Debug</Text>
    </TouchableOpacity>
  );
};

// Main app component with necessary providers
export default function App() {
  // Log app start
  console.log('App component mounted');
  
  // Add global error handler
  const handleGlobalError = (error: Error, isFatal: boolean) => {
    console.error('Global error:', { error, isFatal });
    Alert.alert(
      'Unexpected Error',
      'An unexpected error occurred. Please restart the app.\n\n' + 
      `Error: ${error.message || 'Unknown error'}`
    );
  };
  
  // Set up global error handler
  useEffect(() => {
    const errorHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      handleGlobalError(error, isFatal || false);
      errorHandler(error, isFatal);
    });
    
    return () => {
      ErrorUtils.setGlobalHandler(errorHandler);
    };
  }, []);
  
  // Add debug button in development
  if (__DEV__) {
    return (
      <>
        <DebugButton />
        <AppContent />
      </>
    );
  }
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppContent />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
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
  errorBoundaryContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorBoundaryText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});
