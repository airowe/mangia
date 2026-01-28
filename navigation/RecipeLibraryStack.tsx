/**
 * RecipeLibraryStack
 *
 * Navigation stack for the Recipes tab.
 * Editorial design: screens handle their own headers internally.
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipesScreen } from "../screens/RecipesScreen";
import RecipeSearchScreen from "../screens/RecipeSearchScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import RecipeCreateScreen from "../screens/RecipeCreateScreen";
import { SearchResultsScreen } from "../screens/SearchResultsScreen";
import CollectionsScreen from "../screens/CollectionsScreen";
import CollectionDetailScreen from "../screens/CollectionDetailScreen";
import CookbooksScreen from "../screens/CookbooksScreen";

export type RecipeLibraryStackParamList = {
  RecipesScreen: undefined;
  RecipeSearch: undefined;
  RecipeDetail: { id: string };
  RecipeCreate: undefined;
  SearchResults: { searchQuery: string };
  Collections: undefined;
  CollectionDetail: { id: string; name: string };
  Cookbooks: undefined;
};

const Stack = createNativeStackNavigator<RecipeLibraryStackParamList>();

export default function RecipeLibraryStack() {
  return (
    <Stack.Navigator
      initialRouteName="RecipesScreen"
      screenOptions={{
        headerShown: false, // Editorial design: screens handle their own headers
      }}
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
      <Stack.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{ title: "Collections" }}
      />
      <Stack.Screen
        name="CollectionDetail"
        component={CollectionDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name="Cookbooks"
        component={CookbooksScreen}
        options={{ title: "My Cookbooks" }}
      />
    </Stack.Navigator>
  );
}
