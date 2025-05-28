import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MealPlannerScreen from '../screens/MealPlannerScreen';

const Stack = createNativeStackNavigator();

export default function MealPlanningStack() {
  return (
    <Stack.Navigator
      initialRouteName="MealPlannerScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="MealPlannerScreen" component={MealPlannerScreen} />
    </Stack.Navigator>
  );
}
