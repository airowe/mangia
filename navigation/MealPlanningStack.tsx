import React, { useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MealPlannerScreen from '../screens/MealPlannerScreen';
import { Animated } from 'react-native';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { CustomHeader } from '../components/CustomHeader';

const Stack = createNativeStackNavigator();

export default function MealPlanningStack() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const screenOptions: NativeStackNavigationOptions = {
    header: ({ route, options }) => {
      const showBackButton = route.name !== "MealPlannerScreen";
      return (
        <CustomHeader
          showBackButton={showBackButton}
          title={options.title as string}
          scrollY={route.name === "MealPlannerScreen" ? scrollY : undefined}
        />
      );
    },
    headerShown: true,
  };

  return (
    <Stack.Navigator
      initialRouteName="MealPlannerScreen"
      screenOptions={screenOptions}
    >
      <Stack.Screen name="MealPlannerScreen" component={MealPlannerScreen} />
    </Stack.Navigator>
  );
}
