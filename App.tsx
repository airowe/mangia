import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./lib/supabase";
import { AuthScreen } from "./screens/AuthScreen";
import { AccountScreen } from "./screens/AccountScreen";
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
} from "react-native";
import { colors } from "./theme/colors";
import { Screen } from "./components/Screen";
import { getSession } from "./lib/auth";

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
        // Get the current session and user
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (isMounted) {
          // If we have a session, verify the user is still valid
          if (currentSession) {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
              console.log('Invalid session, signing out...');
              await supabase.auth.signOut();
              setSession(null);
            } else {
              console.log('Valid session found');
              setSession(currentSession);
            }
          } else {
            console.log('No session found');
            setSession(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setError('Failed to initialize authentication. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      
      if (isMounted) {
        // On sign out, clear the session
        if (event === 'SIGNED_OUT') {
          setSession(null);
        } 
        // On token refresh, update the session
        else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(newSession);
        }
        // On other events, validate the session
        else if (newSession) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('Invalid user in session, signing out...');
            await supabase.auth.signOut();
            setSession(null);
          } else {
            setSession(newSession);
          }
        } else {
          setSession(null);
        }
        setError(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
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
        <View style={styles.buttonContainer}>
          <Button
            title="Retry"
            onPress={async () => {
              setError(null);
              setIsLoading(true);
              try {
                // Try to get a fresh session
                const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) throw sessionError;
                
                if (newSession) {
                  // Verify the user is still valid
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    setSession(newSession);
                  } else {
                    await supabase.auth.signOut();
                    setSession(null);
                  }
                } else {
                  setSession(null);
                }
              } catch (err) {
                console.error('Error retrying authentication:', err);
                setError('Failed to authenticate. Please try logging in again.');
              } finally {
                setIsLoading(false);
              }
            }}
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Sign In"
            onPress={async () => {
              await supabase.auth.signOut();
              setSession(null);
            }}
          />
        </View>
      </View>
    );
  }

  // Show auth screen if no session, otherwise show main app
  return (
    <Screen noPadding style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonSpacer: {
    width: 10,
  },
});
