import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl } from 'react-native';
import { Product } from '../models/Product';
import PantryItem from './PantryItem';
import { colors } from '../theme/colors';

interface PantryListProps {
  products?: Product[];
  collections: Record<string, Product[]>;
  onAddToPantry: (product: Product) => void;
  onQuantityChange: (productId: string, change: number) => void;
  pantryItems: Product[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

const PantryList: React.FC<PantryListProps> = ({
  collections,
  onAddToPantry,
  onQuantityChange,
  pantryItems,
  onRefresh,
  refreshing = false,
}) => {
  // Check if a product is in the pantry
  const isInPantry = (productId: string) => {
    return pantryItems.some(item => item.id === productId);
  };

  // Check if there are any products in any collection
  const hasProducts = useMemo(() => {
    if (!collections) {
      return false;
    }
    
    return Object.values(collections).some(collection => 
      Array.isArray(collection) && collection.length > 0
    );
  }, [collections]);

  // If collections is undefined or null, show a loading state
  if (!collections) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.debugText}>Loading products...</Text>
      </View>
    );
  }

  // If there are no products, show an empty state
  if (!hasProducts) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products available</Text>
        <Text style={styles.debugText}>Collections keys: {Object.keys(collections).join(', ')}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {Object.entries(collections).map(([title, products]) => {
        if (!products || products.length === 0) return null;
        
        return (
          <View key={title} style={styles.collectionContainer}>
            <Text style={styles.collectionTitle}>{title}</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            >
              {products.map((product) => (
                <PantryItem
                  key={product.id}
                  product={product}
                  isInPantry={isInPantry(product.id)}
                  onAddToPantry={onAddToPantry}
                  onQuantityChange={onQuantityChange}
                />
              ))}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  debugText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
  },
  collectionContainer: {
    marginBottom: 24,
  },
  collectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginHorizontal: 16,
    color: colors.text,
  },
  productsContainer: {
    paddingHorizontal: 8,
  },
});

export default PantryList;
