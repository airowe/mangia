import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Text, RefreshControl } from "react-native";
import { Screen } from "../components/Screen";
import PantryList from "../components/PantryList";
import { MOCK_PRODUCTS, Product } from "../models/Product";
import { fetchPantryItems } from "../lib/pantry";
import { colors } from "../theme/colors";

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [pantryItems, setPantryItems] = useState<Product[]>([]);
  const [collections, setCollections] =
    useState<Record<string, Product[]>>(MOCK_PRODUCTS);

  useEffect(() => {
    // Initial load
    loadPantryItems();
  }, []);

  const loadPantryItems = useCallback(async () => {
    try {
      setRefreshing(true);
      const items = await fetchPantryItems();
      setPantryItems(items);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading pantry items:", error);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    loadPantryItems();
  }, [loadPantryItems]);

  const handleAddToPantry = async (product: Product) => {
    // In a real app, you would add the product to the pantry via an API call
    await loadPantryItems();
  };

  const handleQuantityChange = (productId: string, change: number) => {
    // In a real app, you would update the quantity via an API call
    // This is a no-op for now
  };

  useEffect(() => {
    loadPantryItems();
  }, [loadPantryItems]);

  return (
    <Screen noPadding>
      <View style={styles.container}>
        <PantryList
          collections={collections}
          onAddToPantry={handleAddToPantry}
          onQuantityChange={handleQuantityChange}
          pantryItems={pantryItems}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
});
