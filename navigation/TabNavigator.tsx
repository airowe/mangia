/**
 * TabNavigator
 *
 * Main bottom tab navigation with editorial glass tab bar and center FAB.
 *
 * Tabs:
 * 1. Home - Main dashboard with "On The Menu" recipes
 * 2. Pantry - Pantry inventory management
 * 3. [FAB] - Center floating action button for quick add
 * 4. Shopping - Shopping/grocery list (replaces Planner)
 * 5. Recipes - Recipe library/collections
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import ShoppingStack from './ShoppingStack';
import RecipeLibraryStack from './RecipeLibraryStack';
import PantryStack from './PantryStack';
import { CustomTabBar } from '../components/navigation';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Pantry"
        component={PantryStack}
        options={{ title: 'Pantry' }}
      />
      <Tab.Screen
        name="Shopping"
        component={ShoppingStack}
        options={{ title: 'Shopping' }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipeLibraryStack}
        options={{ title: 'Recipes' }}
      />
    </Tab.Navigator>
  );
}
