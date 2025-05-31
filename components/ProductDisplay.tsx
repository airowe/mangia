import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Product } from "../models/Product";

interface ProductDisplayProps {
  product: Product;
}
const ProductDisplay: React.FC<ProductDisplayProps> = ({ product }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{product.title}</Text>
      <Text style={styles.category}>{product.category}</Text>
      <Text style={styles.quantity}>
        {product.quantity} {product.unit}
      </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  quantity: {
  },
  category: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
});
export default ProductDisplay;
