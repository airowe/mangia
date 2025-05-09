import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "./screens/HomeScreen";
import { ManualEntryScreen } from "./screens/ManualEntryScreen";
import { supabase } from "./lib/supabase";
import { AuthScreen } from "./screens/AuthScreen";
import BarcodeScannerScreen from "./screens/BarcodeScreen";
import { RecipesScreen } from "./screens/RecipesScreen";
import RecipeCreateScreen from "./screens/RecipeCreateScreen";

const Stack = createNativeStackNavigator();

export default function App() {
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

  if (!session) {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Auth">
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ManualEntry" component={ManualEntryScreen} />
        <Stack.Screen name="ScanBarcode" component={BarcodeScannerScreen} />
        <Stack.Screen name="Pantry" component={ManualEntryScreen} />
        <Stack.Screen name="Recipes" component={RecipesScreen} />
        <Stack.Screen name="RecipeCreateScreen" component={RecipeCreateScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
