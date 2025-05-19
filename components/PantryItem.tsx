import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/80x80.png?text=No+Image";

const PantryItem = ({ item }: { item: any }) => (
  <View style={styles.card}>
    <Image
      source={{ uri: item.image || PLACEHOLDER_IMAGE }}
      style={styles.image}
      resizeMode="cover"
    />
    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
    {item.quantity !== undefined && (
      <Text style={styles.quantity}>Qty: {item.quantity}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: 100,
    height: 100,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: "#eee",
  },
  title: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 2,
  },
  quantity: {
    fontSize: 12,
    color: "#666",
  },
});

export default PantryItem;