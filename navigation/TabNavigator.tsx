import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeStack from './HomeStack';
import MealPlanningStack from './MealPlanningStack';
import RecipeLibraryStack from './RecipeLibraryStack';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'MealPlanner') iconName = 'restaurant';
          else if (route.name === 'Recipes') iconName = 'book';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{ title: 'Home' }} 
      />
      <Tab.Screen 
        name="MealPlanner" 
        component={MealPlanningStack} 
        options={{ title: 'Meal Planner' }} 
      />
      <Tab.Screen 
        name="Recipes" 
        component={RecipeLibraryStack} 
        options={{ title: 'Recipes' }} 
      />
    </Tab.Navigator>
  );
}
