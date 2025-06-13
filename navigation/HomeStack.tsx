import React, { useRef } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import BarcodeScreen from "../screens/BarcodeScreen";
import { CustomHeader } from "../components/CustomHeader";
import { ManualEntryScreen } from "../screens/ManualEntryScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import ReceiptScanScreen from "../screens/ReceiptScanScreen";
import { Product } from "../models/Product";
import { Animated } from "react-native";

// Define the param list for the root stack
export type RootStackParamList = {
  HomeScreen: undefined;
  BarcodeScreen: undefined;
  ManualEntryScreen: undefined;
  ProductDetail: { product: Product };
  ReceiptScanScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

export default function HomeStack() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const screenOptions: NativeStackNavigationOptions = {
    header: ({ route, options }) => {
      const showBackButton = route.name !== "HomeScreen";
      return (
        <CustomHeader
          showBackButton={showBackButton}
          title={options.title as string}
          scrollY={route.name === "HomeScreen" ? scrollY : undefined}
        />
      );
    },
    headerShown: true,
  };

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
      <Stack.Screen
        name="ReceiptScanScreen"
        component={ReceiptScanScreen}
        options={{ title: "Scan Receipt" }}
      />
    </Stack.Navigator>
  );
}
