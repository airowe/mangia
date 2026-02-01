/**
 * PantryStack
 *
 * Navigation stack for the Pantry tab.
 * Editorial design: screens handle their own headers internally.
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PantryScreen from "../screens/PantryScreen";
import ManualItemEntryScreen from "../screens/ManualItemEntryScreen";
import AIPantryScannerScreen from "../screens/AIPantryScannerScreen";
import ConfirmScannedItemsScreen from "../screens/ConfirmScannedItemsScreen";
import KitchenAlertsScreen from "../screens/KitchenAlertsScreen";
import WhatCanIMakeScreen from "../screens/WhatCanIMakeScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";

// Define the param list for the pantry stack
export type PantryStackParamList = {
  PantryMain: undefined;
  ManualItemEntryScreen: undefined;
  AIPantryScannerScreen: undefined;
  ConfirmScannedItemsScreen: {
    scannedItems: {
      name: string;
      category: string;
      confidence: number;
      quantity: number;
      unit: string;
      expiryDate: string | null;
      requiresReview: boolean;
    }[];
  };
  KitchenAlertsScreen: undefined;
  WhatCanIMakeScreen: { initialIngredient?: string } | undefined;
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
        name="ManualItemEntryScreen"
        component={ManualItemEntryScreen}
        options={{
          title: "Add Item",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="AIPantryScannerScreen"
        component={AIPantryScannerScreen}
        options={{
          title: "AI Scanner",
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="ConfirmScannedItemsScreen"
        component={ConfirmScannedItemsScreen}
        options={{
          title: "Confirm Items",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="KitchenAlertsScreen"
        component={KitchenAlertsScreen}
        options={{
          title: "Kitchen Alerts",
        }}
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
