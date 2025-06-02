import React from "react";
import { FlatList, StyleSheet, View, Text } from "react-native";
import { Product } from "../models/Product";
import { colors } from "../theme/colors";
import PantryItemComponent from "./PantryItemComponent";

interface ProductListProps {
  products: Product[];
  onAddToPantry: (product: Product) => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  title?: string;
  isInitialLoad?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onAddToPantry,
  onEndReached,
  loadingMore = false,
  hasMore = false,
  title = "Available Products",
  isInitialLoad = false,
}) => {
  if (isInitialLoad) {
    return null;
  }

  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PantryItemComponent
            product={{
              ...item,
              quantity: 0, // Default quantity for available products
            }}
            isInPantry={false}
            onAddToPantry={() => onAddToPantry(item)}
            onRemoveFromPantry={() => {}}
            onQuantityChange={() => {}}
          />
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});

export default ProductList;
