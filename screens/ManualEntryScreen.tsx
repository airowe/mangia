import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, ScrollView } from "react-native";
import { ProductForm } from "../components/ProductForm";
import { getPantry } from "../storage/pantryStorage";
import { useFocusEffect } from "@react-navigation/native";
import { Product } from "../models/Product";
import { PantryScreen } from "./PantryScreen";

export const ManualEntryScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);

  const loadPantry = async () => {
    console.log(await getPantry());
    const pantry = await getPantry();
    setProducts(pantry);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPantry();
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Pantry Item</Text>
        <ProductForm onAdded={loadPantry} />
      </View>

      <PantryScreen />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f4f6f8",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4, // Android shadow
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  item: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: {
    fontSize: 16,
    color: "#555",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    fontStyle: "italic",
  },
});
