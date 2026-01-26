/**
 * TabNavigator
 *
 * Main bottom tab navigation with custom glass tab bar and primary action button.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import MealPlanningStack from './MealPlanningStack';
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
        name="MealPlanner"
        component={MealPlanningStack}
        options={{ title: 'Planner' }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipeLibraryStack}
        options={{ title: 'Recipes' }}
      />
    </Tab.Navigator>
  );
}
