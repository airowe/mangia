/**
 * HomeScreen
 *
 * Main home screen displaying pantry items and products.
 * Editorial design with warm colors and magazine-style typography.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  StyleSheet,
  View,
  Text,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Screen } from '../components/Screen';
import { AddToPantrySheet } from '../components/AddToPantrySheet';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import PantryList from '../components/PantryList';
import ProductList from '../components/ProductList';
import { PantryItem, Product } from '../models/Product';
import {
  fetchPantryItems,
  addToPantry,
  updatePantryItemQuantity,
  removeFromPantry,
} from '../lib/pantry';
import { useTheme } from '../theme';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { fetchAllProducts } from '../lib/products';

type RootStackParamList = {
  ManualEntryScreen: undefined;
  ImportRecipeScreen: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ManualEntryScreen'
>;

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const handleAddToPantryPress = useCallback(() => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.expand();
    }
  }, []);

  const handleManualPress = useCallback(() => {
    bottomSheetRef.current?.close();
    navigation.navigate('ManualEntryScreen');
  }, [navigation]);

  const handleImportRecipePress = useCallback(() => {
    navigation.navigate('ImportRecipeScreen');
  }, [navigation]);

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
    (product) => !pantryItems.some((item) => item.id === product.id)
  );

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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
        console.error('Error loading products:', error);
        Alert.alert('Error', 'Failed to load products');
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
      console.error('Error loading pantry items:', error);
      Alert.alert('Error', 'Failed to load pantry items');
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
        console.error('Error adding to pantry:', error);
        // Revert optimistic update on error
        setAllProducts((prev) => [...prev, product]);
        return;
      }

      if (data) {
        // Add the new item to the pantry items
        setPantryItems((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error('Error in handleAddToPantry:', error);
      // Revert optimistic update on error
      setAllProducts((prev) => [...prev, product]);
    }
  }, []);

  const handleRemoveFromPantry = useCallback(async (product: PantryItem) => {
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove ${product.title} from your pantry?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically update the UI
              setPantryItems((prev) => prev.filter((p) => p.id !== product.id));

              const result = await removeFromPantry(product.id);
              if (!result) {
                console.error('Error removing from pantry:', result);
                // Revert optimistic update on error
                setPantryItems((prev) => [...prev, product]);
                return;
              }
            } catch (error) {
              console.error('Error in handleRemoveFromPantry:', error);
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
        console.error('Error updating quantity:', error);
        setPantryItems((prev) =>
          prev.map((item) => (item.id === productId ? currentProduct : item))
        );
        Alert.alert('Error', 'Failed to update item quantity');
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

  // Show loading indicator while pantry is loading
  if (isLoadingPantry) {
    return isLoadingProducts ? (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    ) : null;
  }

  const supportsBlur = Platform.OS === 'ios';

  const renderSheetBackground = useCallback(
    (bgProps: any) => {
      if (supportsBlur) {
        return (
          <View
            style={[
              styles.sheetBackground,
              { borderRadius: borderRadius.xl },
            ]}
            {...bgProps}
          >
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.glass },
              ]}
            />
          </View>
        );
      }

      return (
        <View
          style={[
            styles.sheetBackground,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
            },
          ]}
          {...bgProps}
        />
      );
    },
    [supportsBlur, isDark, colors.glass, colors.surface, borderRadius.xl]
  );

  return (
    <Screen style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
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
        contentContainerStyle={[styles.scrollViewContent]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={[styles.listContainer, { paddingHorizontal: spacing.lg }]}>
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

      {/* Action buttons */}
      <View
        style={[
          styles.buttonContainer,
          {
            backgroundColor: supportsBlur ? 'transparent' : colors.glass,
            borderTopColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
          },
        ]}
      >
        {supportsBlur && (
          <>
            <BlurView
              intensity={60}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]}
            />
          </>
        )}
        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={handleImportRecipePress}
            style={[styles.importButton, { borderColor: colors.primary, borderRadius: borderRadius.full }]}
            labelStyle={[styles.importButtonLabel, { color: colors.primary }]}
            icon="link-variant"
          >
            Import Recipe
          </Button>
          <Button
            mode="contained"
            onPress={handleAddToPantryPress}
            style={[styles.addButton, { borderRadius: borderRadius.full }]}
            labelStyle={styles.addButtonLabel}
            buttonColor={colors.primary}
            icon="plus"
          >
            Add to Pantry
          </Button>
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableContentPanningGesture={true}
        handleIndicatorStyle={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
        }}
        backgroundComponent={renderSheetBackground}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={isDark ? 0.7 : 0.5}
          />
        )}
      >
        <AddToPantrySheet onManualPress={handleManualPress} />
      </BottomSheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  container: {
    flex: 1,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
    paddingTop: 0,
  },
  listContainer: {},
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  importButton: {
    flex: 1,
  },
  importButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    paddingVertical: 2,
  },
  addButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
