import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import BarcodeScreen from "../screens/BarcodeScreen";
import { CustomHeader } from "../components/CustomHeader";
import { ManualEntryScreen } from "../screens/ManualEntryScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import { Product } from "../models/Product";

// Define the param list for the root stack
export type RootStackParamList = {
  HomeScreen: undefined;
  BarcodeScreen: undefined;
  ManualEntryScreen: undefined;
  ProductDetail: { product: Product };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

const screenOptions: NativeStackNavigationOptions = {
  header: ({ route, options }) => {
    const showBackButton = route.name !== "HomeScreen";
    return (
      <CustomHeader
        showBackButton={showBackButton}
        title={options.title as string}
      />
    );
  },
  headerShown: true,
  contentStyle: { backgroundColor: "#fff" },
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
        options={{ title: "" }}
      />
      <Stack.Screen
        name="BarcodeScreen"
        component={BarcodeScreen}
        options={{ title: "Scan Barcode" }}
      />
      <Stack.Screen
        name="ManualEntryScreen"
        component={ManualEntryScreen}
        options={{ title: "Add Product" }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: "Product Details" }}
      />
    </Stack.Navigator>
  );
}
