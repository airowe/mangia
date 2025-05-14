import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Product } from "../models/Product";
import PantryGroup from "./PantryGroup";
import { colors } from "../theme/colors";

type Props = {
  products?: Product[];
  onDelete: (id: string) => void;
};

export const PantryList: React.FC<Props> = ({ products, onDelete }) => {
  const grouped = {
    Fridge: products?.filter((p) => p.category === "Fridge"),
    Freezer: products?.filter((p) => p.category === "Freezer"),
    Pantry: products?.filter((p) => p.category === "Pantry"),
    "Spice Drawer": products?.filter((p) => p.category === "Spice Drawer"),
  };

  const categoryColors = {
    Fridge: colors.secondary,
    Freezer: "#5DADE2",
    Pantry: "#CC5500",
    "Spice Drawer": "#A569BD",
  };

  return (
    <View style={{ padding: 16 }}>
      {products && Object.keys(grouped).length > 0 ? (
        <View>
          {Object.entries(grouped).map(([category, items]) => (
            <PantryGroup
              key={category}
              title={category}
              items={items || []}
              color={categoryColors[category as keyof typeof categoryColors]}
              onDelete={onDelete}
            />
          ))}
        </View>
      ) : (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={styles.empty}>No items in pantry</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "700",
  },
  item: {
    padding: 12,
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    fontWeight: "500",
  },
  quantity: {
    color: "#555",
  },
  empty: {
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 20,
    color: "#777",
  },
});
