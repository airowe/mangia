/**
 * HomeStack
 *
 * Navigation stack for the Home tab.
 * Editorial design: screens handle their own headers internally.
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WantToCookScreen } from "../screens/WantToCookScreen";
import { ManualEntryScreen } from "../screens/ManualEntryScreen";
import { ImportRecipeScreen } from "../screens/ImportRecipeScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";
import CookingModeScreen from "../screens/CookingModeScreen";

// Define the param list for the root stack
export type RootStackParamList = {
  WantToCookScreen: undefined;
  ManualEntryScreen: undefined;
  ImportRecipeScreen: undefined;
  RecipeDetailScreen: { recipeId: string };
  GroceryListScreen: { recipeIds: string[] };
  SubscriptionScreen: undefined;
  CookingModeScreen: { recipeId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="WantToCookScreen"
      screenOptions={{
        headerShown: false, // Editorial design: screens handle their own headers
      }}
    >
      <Stack.Screen
        name="WantToCookScreen"
        component={WantToCookScreen}
        options={{ title: "Want to Cook" }}
      />
      <Stack.Screen
        name="ManualEntryScreen"
        component={ManualEntryScreen}
        options={{ title: "Add Item" }}
      />
      <Stack.Screen
        name="ImportRecipeScreen"
        component={ImportRecipeScreen}
        options={{ title: "Import Recipe" }}
      />
      <Stack.Screen
        name="RecipeDetailScreen"
        component={RecipeDetailScreen}
        options={{ title: "Recipe" }}
      />
      <Stack.Screen
        name="SubscriptionScreen"
        component={SubscriptionScreen}
        options={{
          title: "Premium",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CookingModeScreen"
        component={CookingModeScreen}
        options={{
          title: "Cooking Mode",
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
