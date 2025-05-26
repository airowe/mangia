import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Text, RefreshControl, ScrollView, Alert } from "react-native";
import { Screen } from "../components/Screen";
import PantryList from "../components/PantryList";
import PantryItem from "../components/PantryItem";
import { Product, MOCK_PRODUCTS } from "../models/Product";
import { fetchPantryItems, saveToPantry, updatePantryItemQuantity } from "../lib/pantry";
import { colors } from "../theme/colors";
import { FAB } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  BarcodeScreen: undefined;
  ManualEntryScreen: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "BarcodeScreen"
>;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleBarcodeScan = () => {
    navigation.navigate("BarcodeScreen");
  };

  const handleManualEntry = () => {
    navigation.navigate("ManualEntryScreen");
  };
  
  const [refreshing, setRefreshing] = useState(false);
  const [pantryItems, setPantryItems] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Record<string, Product[]>>({});

  useEffect(() => {
    // Initial load
    loadPantryItems();
  }, []);

  // Commenting out until we have a products endpoint
  // const loadDefaultCollections = async () => {
  //   try {
  //     const allProducts = await fetchAllProducts();
  //     // Group products by category for the default collections
  //     const defaultCollections = allProducts.reduce((acc: Record<string, Product[]>, product: Product) => {
  //       const category = product.category || 'Other';
  //       if (!acc[category]) {
  //         acc[category] = [];
  //       }
  //       acc[category].push(product);
  //       return acc;
  //     }, {});
  //     return defaultCollections;
  //   } catch (error) {
  //     console.error("Error loading default collections:", error);
  //     return {};
  //   }
  // };

  const loadPantryItems = useCallback(async () => {
    try {
      setRefreshing(true);
      const items = await fetchPantryItems();
      setPantryItems(items);
      
      // Group items by location
      const grouped = items.reduce((acc: Record<string, Product[]>, item) => {
        const location = item.location || 'Uncategorized';
        if (!acc[location]) {
          acc[location] = [];
        }
        acc[location].push(item);
        return acc;
      }, {});
      
      setCollections(grouped);
    } catch (error) {
      setCollections({});
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    loadPantryItems();
  }, [loadPantryItems]);

  const handleAddToPantry = async (product: Product) => {
    try {
      const { data, error } = await saveToPantry(product);
      if (error) {
        console.error("Error adding to pantry:", error);
        return;
      }
      
      if (data) {
        // Add the new item to the local state
        setPantryItems(prevItems => [...prevItems, data]);
        
        // Update collections with the new item
        setCollections(prevCollections => {
          const location = data.location || 'Uncategorized';
          const updatedCollections = { ...prevCollections };
          
          if (!updatedCollections[location]) {
            updatedCollections[location] = [];
          }
          
          // Check if item already exists in this location
          const existingItemIndex = updatedCollections[location].findIndex(item => item.id === data.id);
          
          if (existingItemIndex >= 0) {
            // Update existing item
            updatedCollections[location][existingItemIndex] = data;
          } else {
            // Add new item
            updatedCollections[location] = [...updatedCollections[location], data];
          }
          
          return updatedCollections;
        });
      }
    } catch (error) {
      console.error("Error in handleAddToPantry:", error);
    }
  };

  const handleQuantityChange = async (productId: string, change: number) => {
    // Find the current product to get its current quantity
    const currentProduct = pantryItems.find(item => item.id === productId);
    if (!currentProduct) {
      return;
    }
    
    // Calculate the new quantity (ensure it doesn't go below 1)
    const currentQuantity = currentProduct.quantity || 1;
    const newQuantity = Math.max(1, currentQuantity + change);
    
    // Optimistically update the UI
    const updatedProduct = { ...currentProduct, quantity: newQuantity };
    
    // Update pantry items state
    setPantryItems(prevItems => 
      prevItems.map(item => 
        item.id === productId ? updatedProduct : item
      )
    );
    
    // Update collections state
    setCollections(prevCollections => {
      const updatedCollections = { ...prevCollections };
      
      Object.keys(updatedCollections).forEach(location => {
        const itemIndex = updatedCollections[location].findIndex(
          item => item.id === productId
        );
        
        if (itemIndex >= 0) {
          updatedCollections[location] = updatedCollections[location].map(
            item => item.id === productId ? updatedProduct : item
          );
        }
      });
      
      return updatedCollections;
    });
    
    try {
      // Update the server
      const result = await updatePantryItemQuantity(productId, newQuantity);
      
      if (result.error) {
        // Revert optimistic update on error
        setPantryItems(prevItems => 
          prevItems.map(item => 
            item.id === productId ? currentProduct : item
          )
        );
        
        // Optionally show an error message to the user
        console.error('Failed to update quantity:', result.error);
      }
    } catch (error) {
      // Revert optimistic update on error
      setPantryItems(prevItems => 
        prevItems.map(item => 
          item.id === productId ? currentProduct : item
        )
      );
      
      console.error('Error updating quantity:', error);
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
        
        <View style={styles.fabContainer}>
          <FAB
            style={[styles.fab, styles.fabLeft]}
            icon="barcode-scan"
            onPress={handleBarcodeScan}
            color="white"
          />
          <FAB
            style={[styles.fab, styles.fabRight]}
            icon="plus"
            onPress={handleManualEntry}
            color="white"
          />
        </View>
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
  fabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    zIndex: 1,
  },
  fab: {
    backgroundColor: colors.primary,
  },
  fabLeft: {
    alignSelf: 'flex-start',
  },
  fabRight: {
    alignSelf: 'flex-end',
  },
});
