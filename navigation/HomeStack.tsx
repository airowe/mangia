import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import PantryScreen from '../screens/PantryScreen';
import BarcodeScreen from '../screens/BarcodeScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="Pantry" component={PantryScreen} />
      <Stack.Screen name="BarcodeScreen" component={BarcodeScreen} />
    </Stack.Navigator>
  );
}
