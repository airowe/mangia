import React, { useRef } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { CustomHeader } from "../components/CustomHeader";
import { ManualEntryScreen } from "../screens/ManualEntryScreen";
import { ImportRecipeScreen } from "../screens/ImportRecipeScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import { Animated } from "react-native";

// Define the param list for the root stack
export type RootStackParamList = {
  HomeScreen: undefined;
  ManualEntryScreen: undefined;
  ImportRecipeScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

export default function HomeStack() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const screenOptions: NativeStackNavigationOptions = {
    header: ({ route, options }) => {
      const showBackButton = route.name !== "HomeScreen";
      return (
        <CustomHeader
          showBackButton={showBackButton}
          title={options.title as string}
          scrollY={route.name === "HomeScreen" ? scrollY : undefined}
        />
      );
    },
    headerShown: true,
  };

  return (
    <Stack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: "" }}
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
    </Stack.Navigator>
  );
}
