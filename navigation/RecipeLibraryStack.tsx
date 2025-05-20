import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipesScreen } from "../screens/RecipesScreen";
import RecipeCatalogScreen from "../screens/RecipeCatalogScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import { AllRecipesScreen } from "../screens/AllRecipesScreen";

const Stack = createNativeStackNavigator();

export default function RecipeLibraryStack() {
  return (
    <Stack.Navigator
      initialRouteName="RecipesScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="RecipesScreen" component={RecipesScreen} />
      <Stack.Screen name="RecipeCatalog" component={RecipeCatalogScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="AllRecipes" component={AllRecipesScreen} />
    </Stack.Navigator>
  );
}
