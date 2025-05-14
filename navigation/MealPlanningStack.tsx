import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MealPlannerScreen from '../screens/MealPlannerScreen';

const Stack = createNativeStackNavigator();

export default function MealPlanningStack() {
  return (
    <Stack.Navigator initialRouteName="Meal Planner" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Meal Planner" component={MealPlannerScreen} />
    </Stack.Navigator>
  );
}
