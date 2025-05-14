import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import { colors } from "../theme/colors";
import { Product } from "../models/Product";
import { getPantry, removeProduct } from "../storage/pantryStorage";
import PantryGroup from "../components/PantryGroup";

export default function PantryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    const items = await getPantry();
    setProducts(items);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    await removeProduct(id);
    await loadItems();
  };

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const grouped = {
    Fridge: products.filter((p) => p.category === "Fridge"),
    Freezer: products.filter((p) => p.category === "Freezer"),
    Pantry: products.filter((p) => p.category === "Pantry"),
    "Spice Drawer": products.filter((p) => p.category === "Spice Drawer"),
  };

  const categoryColors = {
    Fridge: colors.secondary,
    Freezer: "#5DADE2",
    Pantry: colors.primary,
    "Spice Drawer": "#A569BD",
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {Object.entries(grouped).map(([category, items]) => (
        <PantryGroup
          key={category}
          title={category}
          items={items}
          color={categoryColors[category as keyof typeof categoryColors]}
          onDelete={handleDelete}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
});
