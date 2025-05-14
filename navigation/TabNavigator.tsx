import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import MealPlanningStack from './MealPlanningStack';
import RecipeLibraryStack from './RecipeLibraryStack';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Meal Planning') iconName = 'restaurant';
          else if (route.name === 'Recipes') iconName = 'book';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Meal Planning" component={MealPlanningStack}  />
      <Tab.Screen name="Recipes" component={RecipeLibraryStack} />
    </Tab.Navigator>
  );
}
