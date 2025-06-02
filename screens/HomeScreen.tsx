import React, { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, View, Animated, RefreshControl, Alert, ActivityIndicator } from "react-native";
import { Screen } from "../components/Screen";
import PantryList from "../components/PantryList";
import ProductList from "../components/ProductList";
import { PantryItem, Product } from "../models/Product";
import {
  fetchPantryItems,
  addToPantry,
  updatePantryItemQuantity,
  removeFromPantry,
} from "../lib/pantry";
import { colors } from "../theme/colors";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { fetchAllProducts } from "../lib/products";

type RootStackParamList = {
  BarcodeScreen: undefined;
  ManualEntryScreen: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "BarcodeScreen"
>;

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingPantry, setIsLoadingPantry] = useState<boolean>(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  
  // Filter out products that are already in the pantry
  const availableProducts = allProducts.filter(
    product => !pantryItems.some(item => item.id === product.id)
  );

  const scrollY = useRef(new Animated.Value(0)).current;

  const handleBarcodeScan = useCallback(() => {
    navigation.navigate("BarcodeScreen");
  }, [navigation]);

  const handleManualEntry = useCallback(() => {
    navigation.navigate("ManualEntryScreen");
  }, [navigation]);

  const loadProducts = useCallback(
    async (pageNum: number = 1) => {
      const isFirstPage = pageNum === 1;
      if (!isFirstPage) {
        setLoadingMore(true);
      }

      try {
        const response = await fetchAllProducts({
          page: pageNum,
          limit: pagination.limit,
        });

        // Ensure we have valid data
        const products = Array.isArray(response.data) ? response.data : [];

        // Update products list based on pagination
        setAllProducts((prev) =>
          pageNum === 1 ? products : [...prev, ...products]
        );

        // Update pagination state
        setPagination((prev) => ({
          ...prev,
          page: response.page || pageNum,
          total: response.total || 0,
          totalPages: response.totalPages || 1,
          limit: response.limit || prev.limit,
        }));
      } catch (error) {
        console.error("Error loading products:", error);
        Alert.alert("Error", "Failed to load products");
      } finally {
        setIsLoadingProducts(false);
        setLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [pagination.limit]
  );

  const loadPantryItems = useCallback(async () => {
    try {
      const items = await fetchPantryItems();
      setPantryItems(items);
      setIsLoadingPantry(false);
      return items;
    } catch (error) {
      console.error("Error loading pantry items:", error);
      Alert.alert("Error", "Failed to load pantry items");
      setIsLoadingPantry(false);
      return [];
    }
  }, []);

  const handleAddToPantry = useCallback(async (product: PantryItem) => {
    try {
      // Optimistically update the UI
      setAllProducts((prev) => prev.filter((p) => p.id !== product.id));

      const { data, error } = await addToPantry(product);
      if (error) {
        console.error("Error adding to pantry:", error);
        // Revert optimistic update on error
        setAllProducts((prev) => [...prev, product]);
        return;
      }

      if (data) {
        // Add the new item to the pantry items
        setPantryItems((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error("Error in handleAddToPantry:", error);
      // Revert optimistic update on error
      setAllProducts((prev) => [...prev, product]);
    }
  }, []);

  const handleRemoveFromPantry = useCallback(async (product: PantryItem) => {

    //Add a confirm alert
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove ${product.title} from your pantry?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Optimistically update the UI
              setPantryItems((prev) => prev.filter((p) => p.id !== product.id));

              const result = await removeFromPantry(product.id);
              if (!result) {
                console.error("Error removing from pantry:", result);
                // Revert optimistic update on error
                setPantryItems((prev) => [...prev, product]);
                return;
              }

              // The item was already removed optimistically at the start
            } catch (error) {
              console.error("Error in handleRemoveFromPantry:", error);
              // Revert optimistic update on error
              setPantryItems((prev) => [...prev, product]);
            }
          },
        },
      ]
    );
  }, []);

  const handleQuantityChange = useCallback(
    async (productId: string, change: number) => {
      // Find the current product to get its current quantity
      const currentProduct = pantryItems.find((item) => item.id === productId);
      if (!currentProduct) return;

      // Calculate the new quantity (ensure it doesn't go below 1)
      const currentQuantity = currentProduct.quantity || 1;
      const newQuantity = Math.max(1, currentQuantity + change);

      // Optimistically update the UI
      const updatedProduct = { ...currentProduct, quantity: newQuantity };
      setPantryItems((prev) =>
        prev.map((item) => (item.id === productId ? updatedProduct : item))
      );

      try {
        // Update the server
        const result = await updatePantryItemQuantity(productId, newQuantity);
        if (result.error) throw result.error;
      } catch (error) {
        // Revert optimistic update on error
        console.error("Error updating quantity:", error);
        setPantryItems((prev) =>
          prev.map((item) => (item.id === productId ? currentProduct : item))
        );
        Alert.alert("Error", "Failed to update item quantity");
      }
    },
    [pantryItems]
  );

  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      loadProducts(pagination.page + 1);
    }
  }, [pagination.page, pagination.totalPages, loadProducts]);

  useEffect(() => {
    loadProducts(1);
    loadPantryItems();
  }, [loadProducts, loadPantryItems]);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  // Show loading indicator while pantry is loading
  if (isLoadingPantry) {
    return isLoadingProducts ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    ) : null;
  }

  return (
    <Screen style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadPantryItems();
              loadProducts(1);
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.scrollViewContent,
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: (event: any) => {
              // Optional: Add any additional scroll handling here
            },
          }
        )}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.listContainer}>
          {/* Pantry Items */}
          <PantryList
            title="My Pantry"
            products={pantryItems}
            onRemoveFromPantry={handleRemoveFromPantry}
            onQuantityChange={handleQuantityChange}
            pantryItems={pantryItems}
            onEndReached={handleLoadMore}
            loadingMore={loadingMore}
            hasMore={pagination.page < pagination.totalPages}
            isInitialLoad={isLoadingPantry}
          />

          {/* Available Products (not in pantry) */}
          {availableProducts.length > 0 && (
            <ProductList
              title="Available Products"
              products={availableProducts}
              onAddToPantry={handleAddToPantry}
              onEndReached={handleLoadMore}
              loadingMore={loadingMore}
              hasMore={pagination.page < pagination.totalPages}
            />
          )}

        </View>
      </Animated.ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleBarcodeScan}
          style={[styles.button, styles.containedButton]}
          labelStyle={[styles.buttonLabel, { color: "white" }]}
          theme={{ colors: { primary: colors.primary } }}
        >
          Scan Barcode
        </Button>
        <Button
          mode="outlined"
          onPress={handleManualEntry}
          style={[styles.button, styles.outlinedButton]}
          labelStyle={[styles.buttonLabel, { color: colors.primary }]}
          theme={{ colors: { primary: colors.primary } }}
        >
          Add Manually
        </Button>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  productsList: {
    paddingBottom: 16,
  },
  productsRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
    paddingTop: 0, // We'll control the top padding dynamically
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(253, 246, 240, 0.85)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  button: {
    flex: 1,
    marginHorizontal: 6,
    height: 38,
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 0,
    paddingVertical: 0,
    height: 20,
    lineHeight: 20,
  },
  containedButton: {
    backgroundColor: colors.primary,
    elevation: 0,
  },
  outlinedButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: colors.primary,
  },
});

export default HomeScreen;
