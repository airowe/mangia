import React from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
} from "react-native";
import { PantryItem } from "../models/Product";
import PantryItemComponent from "./PantryItemComponent";
import { colors } from "../theme/colors";

interface PantryListProps {
  products: PantryItem[];
  onAddToPantry?: (product: PantryItem) => void;
  onRemoveFromPantry?: (product: PantryItem) => void;
  onQuantityChange: (productId: string, change: number) => void;
  pantryItems: PantryItem[];
  onRefresh?: () => void;
  refreshing?: boolean;
  contentContainerStyle?: object;
  onEndReached?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  title?: string;
  isInitialLoad?: boolean;
}

const PantryList: React.FC<PantryListProps> = ({
  products,
  onAddToPantry,
  onRemoveFromPantry,
  onQuantityChange,
  pantryItems,
  onRefresh,
  refreshing = false,
  contentContainerStyle,
  onEndReached,
  loadingMore = false,
  hasMore = false,
  title,
  isInitialLoad = false,
}) => {
  // Check if a product is in the pantry
  const isInPantry = (productId: string) => {
    return pantryItems.some((item) => item.id === productId);
  };

  // Return null or an empty view during initial load
  if (isInitialLoad) {
    return null;
  }

  // Filter out products with undefined IDs
  const validProducts =
    products?.filter((product) => product.id !== undefined) || [];

  // If there are no valid products, show a message
  if (validProducts.length === 0) {
    return (
      <View style={[styles.emptyContainer, contentContainerStyle]}>
        <Text style={styles.emptyText}>No products found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, contentContainerStyle]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.horizontalContainer,
          contentContainerStyle,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        onScrollEndDrag={({ nativeEvent }) => {
          if (onEndReached && !loadingMore) {
            const { layoutMeasurement, contentOffset, contentSize } =
              nativeEvent;
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
          <View key={`pantry-item-${product.id}`} style={styles.itemWrapper}>
            <PantryItemComponent
              key={`pantry-item-${product.id}-content`}
              product={product}
              onAddToPantry={onAddToPantry}
              onRemoveFromPantry={onRemoveFromPantry}
              onQuantityChange={onQuantityChange}
              isInPantry={isInPantry(product.id)}
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

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 16,
    marginBottom: 4,
  },
  horizontalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    paddingBottom: 12, // Extra padding for scroll indicator
    alignItems: "flex-start",
  },
  itemWrapper: {
    marginRight: 16,
    marginBottom: 8, // Add bottom margin for better spacing
    width: 150, // Fixed width for each item
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  loadingMore: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadMorePlaceholder: {
    width: 20,
    height: 20,
  },
  debugText: {
    color: "red",
    fontSize: 14,
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    marginHorizontal: 16,
    color: colors.text,
  },
});

export default PantryList;
