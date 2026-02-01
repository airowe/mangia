// screens/PantryScreen.tsx
// Pantry management - track ingredients you have at home
// Editorial design with "market-shape" asymmetric cards

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import {
  Text,
  Portal,
  Modal,
  Button,
  IconButton,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import ReanimatedAnimated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "../components/Screen";
import { EmptyPantryState } from "../components/pantry/EmptyPantryState";
import { PantryItem } from "../models/Product";
import { usePremiumFeature } from "../hooks/usePremiumFeature";
import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily, editorialTextStyles } from "../theme/tokens/typography";

type PantryStackParamList = {
  PantryMain: undefined;
  AIPantryScannerScreen: undefined;
  WhatCanIMakeScreen: undefined;
  SubscriptionScreen: undefined;
};

type NavigationProp = StackNavigationProp<PantryStackParamList>;
import {
  fetchPantryItems,
  addToPantry,
  updatePantryItemQuantity,
  removeFromPantry,
} from "../lib/pantry";
import { DEV_BYPASS_AUTH } from "../lib/devConfig";
import { isAbortError } from "../hooks/useAbortableEffect";

// Storage locations / categories
const CATEGORIES = ["All", "Dry Goods", "Spices", "Refrigerated", "Produce"] as const;
type Category = (typeof CATEGORIES)[number];

// Stock status levels — status and label computed server-side on GET /api/pantry
import type { StockStatus } from '../models/Product';

// Get stock color (UI-only mapping, kept client-side)
function getStockColor(status: StockStatus): string {
  switch (status) {
    case 'critical': return '#EF4444'; // red
    case 'low': return mangiaColors.terracotta;
    case 'medium': return mangiaColors.sage;
    case 'full': return mangiaColors.sage;
  }
}

// Market shape card variants for visual interest
const MARKET_SHAPES = [
  { borderTopLeftRadius: 0, borderTopRightRadius: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },   // TL cut
  { borderTopLeftRadius: 24, borderTopRightRadius: 0, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },   // TR cut
  { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 0, borderBottomRightRadius: 24 },   // BL cut
  { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 0 },   // BR cut
] as const;

// Animation 7: Animated category pill with spring press feedback
const AnimatedCategoryPill = React.memo(({
  category,
  index,
  isSelected,
  onSelect,
}: {
  category: Category;
  index: number;
  isSelected: boolean;
  onSelect: (category: Category) => void;
}) => {
  const scale = useSharedValue(1);
  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <ReanimatedAnimated.View
      key={category}
      entering={FadeInRight.delay(index * 50).duration(300)}
      style={pillStyle}
    >
      <TouchableOpacity
        onPress={() => onSelect(category)}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(isSelected ? 1.05 : 1, { damping: 12 }); }}
        style={[
          styles.categoryPill,
          isSelected && styles.categoryPillSelected,
        ]}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.categoryPillText,
          isSelected && styles.categoryPillTextSelected,
        ]}>
          {category}
        </Text>
      </TouchableOpacity>
    </ReanimatedAnimated.View>
  );
});

// Animation 9: Animated quantity button with spring scale
const AnimatedQuantityButton = React.memo(({
  icon,
  onPress: onPressHandler,
}: {
  icon: "minus" | "plus";
  onPress: () => void;
}) => {
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  return (
    <ReanimatedAnimated.View style={btnStyle}>
      <TouchableOpacity
        style={styles.quantityButton}
        onPressIn={() => { btnScale.value = withSpring(0.8, { damping: 15 }); }}
        onPressOut={() => { btnScale.value = withSpring(1, { damping: 10 }); }}
        onPress={onPressHandler}
      >
        <MaterialCommunityIcons name={icon} size={14} color={mangiaColors.taupe} />
      </TouchableOpacity>
    </ReanimatedAnimated.View>
  );
});

// Animation 4: Animated stock bar with smooth width transition
const AnimatedStockBar = React.memo(({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) => {
  const barWidth = useSharedValue(progress);
  React.useEffect(() => {
    barWidth.value = withTiming(progress, { duration: 400 });
  }, [progress, barWidth]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
    backgroundColor: color,
    height: '100%',
    borderRadius: 3,
  }));
  return (
    <View style={styles.stockBar}>
      <ReanimatedAnimated.View style={barStyle} />
    </View>
  );
});

// Animation 9: Animated quantity text with pop on change
const AnimatedQuantityText = React.memo(({
  quantity,
  unit,
}: {
  quantity: number;
  unit?: string;
}) => {
  const textScale = useSharedValue(1);
  React.useEffect(() => {
    textScale.value = withSpring(1.15, { damping: 12 });
    const timer = setTimeout(() => {
      textScale.value = withSpring(1, { damping: 12 });
    }, 100);
    return () => clearTimeout(timer);
  }, [quantity, textScale]);
  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
  }));
  return (
    <ReanimatedAnimated.View style={textStyle}>
      <Text style={styles.quantityText}>
        {quantity}{unit ? unit.charAt(0) : ''}
      </Text>
    </ReanimatedAnimated.View>
  );
});

export default function PantryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isPremium } = usePremiumFeature();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [searchFocused, setSearchFocused] = useState(false);

  // Form state for adding items
  const [newItem, setNewItem] = useState({
    title: "",
    quantity: "1",
    unit: "",
    location: "pantry" as string,
  });

  // Load pantry items
  const loadPantry = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetchPantryItems({ signal });
      if (!signal?.aborted) {
        setItems(data);
      }
    } catch (error) {
      if (isAbortError(error)) return;
      console.error("Error loading pantry:", error);
      if (!signal?.aborted) {
        Alert.alert("Error", "Failed to load pantry items");
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadPantry(abortController.signal);
    return () => { abortController.abort(); };
  }, [loadPantry]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPantry();
  }, [loadPantry]);

  // Filter items by search and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" ||
        (item.location && item.location.toLowerCase() === selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  // Group items by location/category for section display
  const groupedItems = useMemo(() => {
    const groups: Record<string, PantryItem[]> = {};
    filteredItems.forEach((item) => {
      const category = item.location || 'Other';
      const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
      if (!groups[capitalizedCategory]) {
        groups[capitalizedCategory] = [];
      }
      groups[capitalizedCategory].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Navigate to What Can I Make screen
  const handleWhatCanIMake = useCallback(() => {
    navigation.navigate("WhatCanIMakeScreen");
  }, [navigation]);

  // Add item to pantry
  const handleAddItem = useCallback(async () => {
    if (!newItem.title.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    setIsAdding(true);
    try {
      const pantryItem: PantryItem = {
        id: "",
        title: newItem.title.trim(),
        quantity: parseFloat(newItem.quantity) || 1,
        unit: newItem.unit || undefined,
        location: newItem.location,
      };

      const { data, error } = await addToPantry(pantryItem);

      if (error) {
        throw error;
      }

      if (data) {
        setItems((prev) => [data, ...prev]);
      }

      setNewItem({
        title: "",
        quantity: "1",
        unit: "",
        location: "pantry",
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item to pantry");
    } finally {
      setIsAdding(false);
    }
  }, [newItem]);

  // Update quantity
  const handleQuantityChange = useCallback(
    async (itemId: string, change: number) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const currentQty = item.quantity || 1;
      const newQty = Math.max(0, currentQty + change);

      if (newQty === 0) {
        Alert.alert("Remove Item", `Remove ${item.title} from your pantry?`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => handleDeleteItem(itemId),
          },
        ]);
        return;
      }

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
      );

      try {
        const { error } = await updatePantryItemQuantity(itemId, newQty);
        if (error) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId ? { ...i, quantity: currentQty } : i
            )
          );
          Alert.alert("Error", "Failed to update quantity");
        }
      } catch (error) {
        console.error("Error updating quantity:", error);
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, quantity: currentQty } : i
          )
        );
      }
    },
    [items]
  );

  // Delete item
  const handleDeleteItem = useCallback(async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    try {
      await removeFromPantry(itemId);
    } catch (error) {
      console.error("Error deleting item:", error);
      loadPantry();
      Alert.alert("Error", "Failed to remove item");
    }
  }, [loadPantry]);

  // Render pantry item card (market-shape style)
  // Animation 1: FadeOutLeft + SlideOutLeft on deletion
  const renderItemCard = useCallback((item: PantryItem, index: number) => {
    const shapeIndex = index % MARKET_SHAPES.length;
    const shape = MARKET_SHAPES[shapeIndex];
    const stockStatus: StockStatus = item.stockStatus || 'full';
    const stockColor = getStockColor(stockStatus);
    const stockProgress = Math.min((item.quantity || 1) / 10, 1);

    return (
      <ReanimatedAnimated.View
        key={item.id}
        entering={FadeInDown.delay(index * 50).duration(300)}
        exiting={SlideOutLeft.duration(300).withCallback(() => {})}
        layout={Layout.springify().damping(15)}
      >
        <TouchableOpacity
          style={[styles.itemCard, shape]}
          activeOpacity={0.9}
        >
          {/* Item Image */}
          <View style={styles.itemImageContainer}>
            <View style={styles.itemImagePlaceholder}>
              <MaterialCommunityIcons
                name="food-variant"
                size={32}
                color={mangiaColors.taupe}
              />
            </View>
          </View>

          {/* Item Details */}
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleContainer}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.unit && (
                  <Text style={styles.itemBrand}>{item.unit}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.addToCartButton}>
                <MaterialCommunityIcons
                  name="basket-plus"
                  size={18}
                  color={mangiaColors.sage}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.itemFooter}>
              {/* Quantity Controls — Animation 9 */}
              <View style={styles.quantityControls}>
                <AnimatedQuantityButton
                  icon="minus"
                  onPress={() => handleQuantityChange(item.id, -1)}
                />
                <AnimatedQuantityText quantity={item.quantity || 1} unit={item.unit} />
                <AnimatedQuantityButton
                  icon="plus"
                  onPress={() => handleQuantityChange(item.id, 1)}
                />
              </View>

              {/* Stock Indicator — Animation 4 */}
              {stockStatus === 'critical' || stockStatus === 'low' ? (
                <View style={[styles.stockBadge, { backgroundColor: `${stockColor}15` }]}>
                  <Text style={[styles.stockBadgeText, { color: stockColor }]}>
                    {item.stockLabel || 'In Stock'}
                  </Text>
                </View>
              ) : (
                <AnimatedStockBar progress={stockProgress} color={stockColor} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </ReanimatedAnimated.View>
    );
  }, [handleQuantityChange]);

  // Render category section
  const renderSection = useCallback((category: string, sectionItems: PantryItem[], sectionIndex: number) => {
    return (
      <ReanimatedAnimated.View
        key={category}
        entering={FadeInDown.delay(sectionIndex * 100).duration(400)}
        style={styles.section}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{category}</Text>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionCount}>
            {sectionItems.length} Item{sectionItems.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Section Items */}
        <View style={styles.sectionItems}>
          {sectionItems.map((item, index) => renderItemCard(item, index))}
        </View>
      </ReanimatedAnimated.View>
    );
  }, [renderItemCard]);

  // Loading state
  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mangiaColors.terracotta} />
          <Text style={styles.loadingText}>Loading pantry...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container} noPadding>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={mangiaColors.terracotta}
            colors={[mangiaColors.terracotta]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ReanimatedAnimated.View entering={FadeInDown.duration(400)} style={styles.header}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.menuButton}>
              <MaterialCommunityIcons name="menu" size={28} color={mangiaColors.dark} />
            </TouchableOpacity>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.notificationButton}>
                <MaterialCommunityIcons name="bell-outline" size={24} color={mangiaColors.dark} />
              </TouchableOpacity>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account" size={24} color={mangiaColors.brown} />
              </View>
            </View>
          </View>

          {/* Headline */}
          <View style={styles.headlineContainer}>
            <Text style={styles.headline}>
              The <Text style={styles.headlineAccent}>Pantry</Text>
            </Text>
            <Text style={styles.subtitle}>
              Your curated collection of essentials.
            </Text>
            {/* Debug: show bypass status */}
            {__DEV__ || DEV_BYPASS_AUTH ? (
              <Text style={{ fontSize: 10, color: mangiaColors.taupe, marginTop: 4 }}>
                Mode: {DEV_BYPASS_AUTH ? 'Mock Data' : 'API'} | Items: {items.length}
              </Text>
            ) : null}
          </View>
        </ReanimatedAnimated.View>

        {/* Search Bar */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.searchContainer}
        >
          <View style={[
            styles.searchBar,
            searchFocused && styles.searchBarFocused,
          ]}>
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={searchFocused ? mangiaColors.terracotta : mangiaColors.taupe}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Find ingredients..."
              placeholderTextColor={mangiaColors.taupe}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <TouchableOpacity style={styles.filterButton}>
              <MaterialCommunityIcons
                name="tune-variant"
                size={20}
                color={mangiaColors.dark}
              />
            </TouchableOpacity>
          </View>
        </ReanimatedAnimated.View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat, i) => (
            <AnimatedCategoryPill
              key={cat}
              category={cat}
              index={i}
              isSelected={selectedCategory === cat}
              onSelect={setSelectedCategory}
            />
          ))}
        </ScrollView>

        {/* What Can I Make Button */}
        <ReanimatedAnimated.View entering={FadeInDown.delay(200).duration(400)}>
          <TouchableOpacity
            style={styles.whatCanIMakeCard}
            onPress={handleWhatCanIMake}
            activeOpacity={0.9}
          >
            <View style={styles.whatCanIMakeContent}>
              <MaterialCommunityIcons
                name="chef-hat"
                size={32}
                color={mangiaColors.terracotta}
              />
              <View style={styles.whatCanIMakeText}>
                <Text style={styles.whatCanIMakeTitle}>What Can I Make?</Text>
                <Text style={styles.whatCanIMakeSubtitle}>
                  Find recipes using your pantry
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={mangiaColors.taupe}
            />
          </TouchableOpacity>
        </ReanimatedAnimated.View>

        {/* Empty state */}
        {filteredItems.length === 0 ? (
          <EmptyPantryState
            onScanPantry={() => {
              navigation.navigate("AIPantryScannerScreen");
            }}
            onAddManually={() => setShowAddModal(true)}
          />
        ) : (
          /* Content Sections */
          <View style={styles.sectionsContainer}>
            {Object.entries(groupedItems).map(([category, sectionItems], index) =>
              renderSection(category, sectionItems, index)
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
          <Text style={styles.modalTitle}>Add to Pantry</Text>

          <View style={styles.modalInputContainer}>
            <Text style={styles.modalLabel}>Item Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Olive Oil"
              placeholderTextColor={mangiaColors.taupe}
              value={newItem.title}
              onChangeText={(text) => setNewItem((prev) => ({ ...prev, title: text }))}
              autoFocus
            />
          </View>

          <View style={styles.modalRow}>
            <View style={[styles.modalInputContainer, { flex: 1 }]}>
              <Text style={styles.modalLabel}>Quantity</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="1"
                placeholderTextColor={mangiaColors.taupe}
                value={newItem.quantity}
                onChangeText={(text) => setNewItem((prev) => ({ ...prev, quantity: text }))}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={[styles.modalInputContainer, { flex: 1 }]}>
              <Text style={styles.modalLabel}>Unit</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="oz, lb, cups..."
                placeholderTextColor={mangiaColors.taupe}
                value={newItem.unit}
                onChangeText={(text) => setNewItem((prev) => ({ ...prev, unit: text }))}
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalAddButton,
                (!newItem.title.trim() || isAdding) && styles.modalAddButtonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!newItem.title.trim() || isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={mangiaColors.white} />
              ) : (
                <Text style={styles.modalAddText}>Add Item</Text>
              )}
            </TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mangiaColors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: mangiaColors.creamDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${mangiaColors.terracotta}30`,
  },
  headlineContainer: {
    marginBottom: 16,
  },
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 48,
    fontWeight: '300',
    color: mangiaColors.dark,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    fontStyle: 'italic',
    fontWeight: '400',
    color: mangiaColors.terracotta,
  },
  subtitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontStyle: 'italic',
    color: mangiaColors.brown,
    marginTop: 8,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: mangiaColors.white,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E8E6E3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBarFocused: {
    borderColor: mangiaColors.terracotta,
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.dark,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${mangiaColors.sage}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Categories
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: mangiaColors.white,
    borderWidth: 1,
    borderColor: '#E8E6E3',
  },
  categoryPillSelected: {
    backgroundColor: mangiaColors.terracotta,
    borderColor: mangiaColors.terracotta,
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryPillText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: mangiaColors.brown,
  },
  categoryPillTextSelected: {
    color: mangiaColors.white,
  },

  // What Can I Make
  whatCanIMakeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    backgroundColor: `${mangiaColors.sage}15`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${mangiaColors.sage}30`,
  },
  whatCanIMakeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  whatCanIMakeText: {
    marginLeft: 16,
  },
  whatCanIMakeTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    color: mangiaColors.dark,
  },
  whatCanIMakeSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: mangiaColors.brown,
    marginTop: 2,
  },

  // Sections
  sectionsContainer: {
    paddingHorizontal: 24,
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sectionTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    color: mangiaColors.dark,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E6E3',
    marginTop: 4,
  },
  sectionCount: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: mangiaColors.taupe,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionItems: {
    gap: 12,
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    backgroundColor: mangiaColors.white,
    padding: 4,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: '#F5F0EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImageContainer: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemImagePlaceholder: {
    flex: 1,
    backgroundColor: '#F5F0EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    paddingLeft: 16,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 20,
    color: mangiaColors.dark,
    lineHeight: 24,
  },
  itemBrand: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: mangiaColors.taupe,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  addToCartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${mangiaColors.sage}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: mangiaColors.cream,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F5F0EC',
  },
  quantityButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: mangiaColors.dark,
    minWidth: 32,
    textAlign: 'center',
  },
  stockBar: {
    width: 48,
    height: 6,
    backgroundColor: '#F5F0EC',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    color: mangiaColors.dark,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: mangiaColors.terracotta,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  emptyButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: mangiaColors.white,
  },

  // Modal
  modal: {
    backgroundColor: mangiaColors.white,
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    color: mangiaColors.dark,
    marginBottom: 24,
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: mangiaColors.brown,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: mangiaColors.cream,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.dark,
    borderWidth: 1,
    borderColor: '#E8E6E3',
  },
  modalRow: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E8E6E3',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: mangiaColors.brown,
  },
  modalAddButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: mangiaColors.terracotta,
    alignItems: 'center',
  },
  modalAddButtonDisabled: {
    opacity: 0.5,
  },
  modalAddText: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: mangiaColors.white,
  },
});
