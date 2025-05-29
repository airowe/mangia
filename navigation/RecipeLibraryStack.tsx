import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipesScreen } from "../screens/RecipesScreen";
import RecipeCatalogScreen from "../screens/RecipeCatalogScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import RecipeCreateScreen from "../screens/RecipeCreateScreen";
import { SearchResultsScreen } from "../screens/SearchResultsScreen";

const Stack = createNativeStackNavigator();

export type RecipeLibraryStackParamList = {
  RecipesScreen: undefined;
  RecipeCatalog: undefined;
  RecipeDetail: { id: string };
  RecipeCreate: undefined;
  SearchResults: { searchQuery: string };
};

export default function RecipeLibraryStack() {
  return (
    <Stack.Navigator
      initialRouteName="RecipesScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="RecipesScreen" component={RecipesScreen} />
      <Stack.Screen name="RecipeCatalog" component={RecipeCatalogScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen 
        name="RecipeCreate" 
        component={RecipeCreateScreen} 
        options={{ title: 'Add Recipe' }}
      />
      <Stack.Screen 
        name="SearchResults" 
        component={SearchResultsScreen}
        options={{ title: 'Search Results' }}
      />
    </Stack.Navigator>
  );
}
