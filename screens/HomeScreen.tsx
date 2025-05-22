import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Text, RefreshControl, ScrollView } from "react-native";
import { Screen } from "../components/Screen";
import PantryList from "../components/PantryList";
import PantryItem from "../components/PantryItem";
import { Product, MOCK_PRODUCTS } from "../models/Product";
import { fetchPantryItems, saveToPantry, updatePantryItemQuantity, fetchAllProducts } from "../lib/pantry";
import { colors } from "../theme/colors";
import { FAB } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  BarcodeScanner: undefined;
  // Add other screens as needed
};

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "BarcodeScanner"
>;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleBarcodeScan = () => {
    navigation.navigate("BarcodeScanner");
  };
  const [refreshing, setRefreshing] = useState(false);
  const [pantryItems, setPantryItems] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Record<string, Product[]>>({});

  useEffect(() => {
    // Initial load
    loadPantryItems();
  }, []);

  const loadDefaultCollections = async () => {
    try {
      const allProducts = await fetchAllProducts();
      // Group products by category for the default collections
      const defaultCollections = allProducts.reduce((acc: Record<string, Product[]>, product: Product) => {
        const category = product.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {});
      return defaultCollections;
    } catch (error) {
      console.error("Error loading default collections:", error);
      return {};
    }
  };

  const loadPantryItems = useCallback(async () => {
    try {
      setRefreshing(true);
      const items = await fetchPantryItems();
      setPantryItems(items);
      
      if (items.length > 0) {
        // Group items by location if user has items
        const groupedItems = items.reduce((acc: Record<string, Product[]>, item: Product) => {
          const location = item.location || 'Uncategorized';
          if (!acc[location]) {
            acc[location] = [];
          }
          acc[location].push(item);
          return acc;
        }, {});
        setCollections(groupedItems);
      } else {
        // Load default collections if pantry is empty
        const defaultCollections = await loadDefaultCollections();
        setCollections(defaultCollections);
      }
      
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading pantry items:", JSON.stringify(error));
      // Try to load default collections even if there's an error
      try {
        const defaultCollections = await loadDefaultCollections();
        setCollections(defaultCollections);
      } catch (e) {
        console.error("Failed to load default collections:", e);
        setCollections({});
      }
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    loadPantryItems();
  }, [loadPantryItems]);

  const handleAddToPantry = async (product: Product) => {
    const { error } = await saveToPantry(product);
    if (error) {
      console.error("Error adding to pantry:", error);
    }
    await loadPantryItems();
  };

  const handleQuantityChange = async (productId: string, change: number) => {
    console.log('handleQuantityChange called with:', { productId, change });
    
    // Find the current product to get its current quantity
    const currentProduct = pantryItems.find(item => item.id === productId);
    if (!currentProduct) {
      console.error("Product not found in pantry");
      return;
    }
    
    // Calculate the new quantity (ensure it doesn't go below 1)
    const currentQuantity = currentProduct.quantity || 1;
    const newQuantity = Math.max(1, currentQuantity + change);
    
    console.log('Updating quantity:', { 
      currentQuantity, 
      change, 
      newQuantity,
      productId,
      productTitle: currentProduct.title
    });
    
    try {
      // Update with the new absolute quantity
      console.log('Calling updatePantryItemQuantity...');
      const result = await updatePantryItemQuantity(productId, newQuantity);
      console.log('updatePantryItemQuantity result:', result);
      
      if (result.error) {
        console.error('Error from updatePantryItemQuantity:', result.error);
      } else {
        console.log('Successfully updated quantity, refreshing pantry items...');
      }
      
      // Refresh the pantry items
      await loadPantryItems();
    } catch (error) {
      console.error('Error in handleQuantityChange:', error);
    }
  };

  useEffect(() => {
    loadPantryItems();
  }, [loadPantryItems]);

  return (
    <Screen noPadding>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {/* Existing Collections */}
          <PantryList
            collections={collections}
            onAddToPantry={handleAddToPantry}
            onQuantityChange={handleQuantityChange}
            pantryItems={pantryItems}
            contentContainerStyle={styles.listContent}
          />
          
          {/* Add Items Section */}
          <View style={styles.addItemsSection}>
            <Text style={styles.sectionTitle}>Add Items</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.addItemsContainer}
            >
              {MOCK_PRODUCTS['Pantry']?.map((product) => (
                <PantryItem
                  key={product.id}
                  product={product}
                  isInPantry={pantryItems.some(item => item.id === product.id)}
                  onAddToPantry={handleAddToPantry}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </ScrollView>
          </View>
        </ScrollView>
        
        <FAB
          style={styles.fab}
          icon="barcode-scan"
          onPress={handleBarcodeScan}
          color="white"
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80, // Extra space at the bottom for FAB
  },
  addItemsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.text,
  },
  addItemsContainer: {
    paddingBottom: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 16, // Add bottom padding to prevent content from being hidden by FAB
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    zIndex: 1,
  },
});
