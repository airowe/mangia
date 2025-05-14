import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PantryScreen from '../screens/PantryScreen';
import { HomeScreen } from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator initialRouteName='HomeScreen' screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="Pantry" component={PantryScreen} />
    </Stack.Navigator>
  );
}
