import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  Alert,
  Animated,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Screen } from "../components/Screen";
import PantryList from "../components/PantryList";
import { Product } from "../models/Product";
import {
  fetchAllProducts,
  fetchPantryItems,
  addToPantry,
  updatePantryItemQuantity,
} from "../lib/pantry";
import { colors } from "../theme/colors";
import { Button } from "react-native-paper";
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

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [pantryItems, setPantryItems] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

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
        setLoadingMore(false);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    },
    [pagination.limit]
  );

  const loadPantryItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await fetchPantryItems();
      setPantryItems(items);
    } catch (error) {
      console.error("Error loading pantry items:", error);
      Alert.alert("Error", "Failed to load pantry items");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddToPantry = useCallback(async (product: Product) => {
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

  const headerHeight = 60;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Screen style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      <Animated.ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadPantryItems}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingTop: headerHeight },
        ]}
        // Removed refresh control
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
            onAddToPantry={handleAddToPantry}
            onQuantityChange={handleQuantityChange}
            pantryItems={pantryItems}
            onEndReached={handleLoadMore}
            isInitialLoad={isInitialLoad}
            loadingMore={loadingMore}
            hasMore={pagination.page < pagination.totalPages}
          />

          {/* All Products */}
          <PantryList
            title="All Products"
            products={allProducts}
            onAddToPantry={handleAddToPantry}
            onQuantityChange={handleQuantityChange}
            pantryItems={pantryItems}
            onEndReached={handleLoadMore}
            loadingMore={loadingMore}
            hasMore={pagination.page < pagination.totalPages}
            isInitialLoad={isInitialLoad}
          />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  scrollViewContent: {
    paddingBottom: 80,
    paddingTop: 0, // We'll control the top padding dynamically
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
