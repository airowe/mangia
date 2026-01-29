import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MealPlannerScreen from '../screens/MealPlannerScreen';
import GroceryListScreen from '../screens/GroceryListScreen';
import { useSharedValue } from 'react-native-reanimated';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { CustomHeader } from '../components/CustomHeader';

type MealPlanningStackParamList = {
  MealPlannerScreen: undefined;
  GroceryListScreen: { recipeIds: string[] };
};

const Stack = createNativeStackNavigator<MealPlanningStackParamList>();

export default function MealPlanningStack() {
  const scrollY = useSharedValue(0);

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
      <Stack.Screen
        name="GroceryListScreen"
        component={GroceryListScreen}
        options={{ title: "Grocery List" }}
      />
    </Stack.Navigator>
  );
}
