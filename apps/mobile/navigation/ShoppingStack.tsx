/**
 * ShoppingStack
 *
 * Navigation stack for Shopping tab (replaces MealPlanningStack).
 * Main screen is the shopping/grocery list.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroceryListScreen from '../screens/GroceryListScreen';

export type ShoppingStackParamList = {
  ShoppingListScreen: undefined;
};

const Stack = createNativeStackNavigator<ShoppingStackParamList>();

export default function ShoppingStack() {
  return (
    <Stack.Navigator
      initialRouteName="ShoppingListScreen"
      screenOptions={{
        headerShown: false, // No default headers in editorial design
      }}
    >
      <Stack.Screen
        name="ShoppingListScreen"
        component={GroceryListScreen}
        options={{ title: 'Shopping' }}
      />
    </Stack.Navigator>
  );
}
