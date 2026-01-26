/**
 * PantryStack
 *
 * Navigation stack for the Pantry tab.
 * Editorial design: screens handle their own headers internally.
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PantryScreen from "../screens/PantryScreen";
import WhatCanIMakeScreen from "../screens/WhatCanIMakeScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";

// Define the param list for the pantry stack
export type PantryStackParamList = {
  PantryMain: undefined;
  WhatCanIMakeScreen: undefined;
  RecipeDetailScreen: { recipeId: string };
  SubscriptionScreen: undefined;
};

const Stack = createNativeStackNavigator<PantryStackParamList>();

export default function PantryStack() {
  return (
    <Stack.Navigator
      initialRouteName="PantryMain"
      screenOptions={{
        headerShown: false, // Editorial design: screens handle their own headers
      }}
    >
      <Stack.Screen
        name="PantryMain"
        component={PantryScreen}
        options={{ title: "Pantry" }}
      />
      <Stack.Screen
        name="WhatCanIMakeScreen"
        component={WhatCanIMakeScreen}
        options={{ title: "What Can I Make?" }}
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
    </Stack.Navigator>
  );
}
