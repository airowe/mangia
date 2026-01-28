import React from "react";
import { StyleSheet, View, Text, ScrollView, RefreshControl } from "react-native";
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

  // Filter out products with undefined IDs
  const validProducts = products?.filter((product) => product.id !== undefined) || [];

  // If there are no valid products, show a message
  if (validProducts.length === 0) {
    return (
      <View style={[styles.emptyContainer]}>
        <Text style={styles.emptyText}>No products found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalContainer}
        onScrollEndDrag={({ nativeEvent }) => {
          if (onEndReached && !loadingMore) {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToEnd =
              layoutMeasurement.width + contentOffset.x >=
              contentSize.width - 50;
            if (isCloseToEnd) {
              onEndReached();
            }
          }
        }}
        scrollEventThrottle={400}
      >
        {validProducts.map((product) => (
          <View key={`product-${product.id}`} style={styles.itemWrapper}>
            <PantryItemComponent
              key={`product-${product.id}-content`}
              product={{
                ...product,
                quantity: 0, // Default quantity for available products
              }}
              isInPantry={false}
              onAddToPantry={() => onAddToPantry(product)}
              onRemoveFromPantry={() => {}}
              onQuantityChange={() => {}}
            />
          </View>
        ))}
      </ScrollView>
      {onEndReached && !loadingMore && hasMore && (
        <View style={styles.loadMorePlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingVertical: 4,
  },
  horizontalContainer: {
    paddingHorizontal: 8,
  },
  itemWrapper: {
    marginRight: 12,
    marginBottom: 4,
  },
  loadMorePlaceholder: {
    height: 10,
  },
  sectionTitle: {
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
