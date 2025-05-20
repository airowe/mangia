import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import PantryScreen from '../screens/PantryScreen';
import BarcodeScreen from '../screens/BarcodeScreen';
import { CustomHeader } from '../components/CustomHeader';
import { View } from 'react-native';

const Stack = createNativeStackNavigator();

import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

const screenOptions: NativeStackNavigationOptions = {
  header: ({ route, options }) => {
    const showBackButton = route.name !== 'HomeScreen';
    return (
      <CustomHeader 
        showBackButton={showBackButton} 
        title={options.title as string}
      />
    );
  },
  headerShown: true,
  contentStyle: { backgroundColor: '#fff' },
};

export default function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={screenOptions}
    >
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ title: '' }}
      />
      <Stack.Screen 
        name="Pantry" 
        component={PantryScreen} 
        options={{ title: 'Pantry' }}
      />
      <Stack.Screen 
        name="BarcodeScreen" 
        component={BarcodeScreen} 
        options={{ title: 'Scan Barcode' }}
      />
    </Stack.Navigator>
  );
}
