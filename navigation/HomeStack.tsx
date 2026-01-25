import React, { useRef } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WantToCookScreen } from "../screens/WantToCookScreen";
import { CustomHeader } from "../components/CustomHeader";
import { ManualEntryScreen } from "../screens/ManualEntryScreen";
import { ImportRecipeScreen } from "../screens/ImportRecipeScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";
import CookingModeScreen from "../screens/CookingModeScreen";
import { Animated } from "react-native";

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

import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

export default function HomeStack() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const screenOptions: NativeStackNavigationOptions = {
    header: ({ route, options }) => {
      const showBackButton = route.name !== "WantToCookScreen";
      return (
        <CustomHeader
          showBackButton={showBackButton}
          title={options.title as string}
          scrollY={route.name === "WantToCookScreen" ? scrollY : undefined}
        />
      );
    },
    headerShown: true,
  };

  return (
    <Stack.Navigator
      initialRouteName="WantToCookScreen"
      screenOptions={screenOptions}
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
