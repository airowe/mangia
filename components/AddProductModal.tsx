import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, Button } from "react-native";
import { Product } from "../models/Product";
import { getPantry } from "../storage/pantryStorage";
import { ProductForm } from "./ProductForm";

export default function AddProductModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);

  const loadPantry = async () => {
    console.log(await getPantry());
    const pantry = await getPantry();
    setProducts(pantry);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modal}>
        <Text style={styles.cardTitle}>Add Pantry Item</Text>
        <ProductForm onAdded={loadPantry} />
        <Button title="Close" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: { fontSize: 20, marginBottom: 16 },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
});
