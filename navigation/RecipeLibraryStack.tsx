import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipesScreen } from "../screens/RecipesScreen";
import RecipeSearchScreen from "../screens/RecipeSearchScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import RecipeCreateScreen from "../screens/RecipeCreateScreen";
import { SearchResultsScreen } from "../screens/SearchResultsScreen";
import { Animated } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { CustomHeader } from "../components/CustomHeader";
import { useRef, useMemo } from "react";

const Stack = createNativeStackNavigator();

export type RecipeLibraryStackParamList = {
  RecipesScreen: undefined;
  RecipeSearch: undefined;
  RecipeDetail: { id: string };
  RecipeCreate: undefined;
  SearchResults: { searchQuery: string };
};

export default function RecipeLibraryStack() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const screenOptions: NativeStackNavigationOptions = useMemo(() => ({
    header: ({ route, options }) => {
      const showBackButton = route.name !== "RecipesScreen";
      return (
        <CustomHeader
          showBackButton={showBackButton}
          title={options.title as string}
          scrollY={route.name === "RecipesScreen" ? scrollY : undefined}
        />
      );
    },
    headerShown: true,
  }), [scrollY]);

  return (
    <Stack.Navigator
      initialRouteName="RecipesScreen"
      screenOptions={screenOptions}
    >
      <Stack.Screen name="RecipesScreen" component={RecipesScreen} />
      <Stack.Screen name="RecipeSearch" component={RecipeSearchScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen
        name="RecipeCreate"
        component={RecipeCreateScreen}
        options={{ title: "Add Recipe" }}
      />
      <Stack.Screen
        name="SearchResults"
        component={SearchResultsScreen}
        options={{ title: "Search Results" }}
      />
    </Stack.Navigator>
  );
}
