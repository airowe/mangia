import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipesScreen } from "../screens/RecipesScreen";
import RecipeCatalogScreen from "../screens/RecipeCatalogScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import SeedRecipesScreen from "../screens/SeedRecipesScreen";

const Stack = createNativeStackNavigator();

export default function RecipeLibraryStack() {
  return (
    <Stack.Navigator
      initialRouteName="SeedRecipes"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Recipes" component={RecipesScreen} />
      <Stack.Screen name="RecipeCatalog" component={RecipeCatalogScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="SeedRecipes" component={SeedRecipesScreen} />
    </Stack.Navigator>
  );
}
