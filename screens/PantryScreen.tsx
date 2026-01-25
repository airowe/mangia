// screens/PantryScreen.tsx
// Pantry management - track ingredients you have at home

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  FAB,
  Portal,
  Modal,
  IconButton,
  Chip,
  Surface,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import { PantryItem } from "../models/Product";
import { IngredientCategory } from "../models/Recipe";
import { usePremiumFeature } from "../hooks/usePremiumFeature";

type PantryStackParamList = {
  PantryMain: undefined;
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
import { getCategoryDisplayName } from "../utils/categorizeIngredient";

// Storage locations
const LOCATIONS = ["fridge", "freezer", "pantry"] as const;
type StorageLocation = (typeof LOCATIONS)[number];

// Common units
const UNITS = ["", "oz", "lb", "g", "kg", "cups", "tbsp", "tsp", "pieces"];

export default function PantryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isPremium } = usePremiumFeature();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form state for adding items
  const [newItem, setNewItem] = useState({
    title: "",
    quantity: "1",
    unit: "",
    location: "pantry" as StorageLocation,
  });

  // Navigate to What Can I Make screen
  const handleWhatCanIMake = useCallback(() => {
    navigation.navigate("WhatCanIMakeScreen");
  }, [navigation]);

  // Load pantry items
  const loadPantry = useCallback(async () => {
    try {
      const data = await fetchPantryItems();
      setItems(data);
    } catch (error) {
      console.error("Error loading pantry:", error);
      Alert.alert("Error", "Failed to load pantry items");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPantry();
  }, [loadPantry]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPantry();
  }, [loadPantry]);

  // Add item to pantry
  const handleAddItem = useCallback(async () => {
    if (!newItem.title.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    setIsAdding(true);
    try {
      const pantryItem: PantryItem = {
        id: "", // Will be set by server
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

      // Reset form
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
        // Confirm deletion
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
          // Revert on error
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId ? { ...i, quantity: currentQty } : i
            )
          );
          Alert.alert("Error", "Failed to update quantity");
        }
      } catch (error) {
        console.error("Error updating quantity:", error);
        // Revert on error
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
    // Optimistic removal
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    try {
      await removeFromPantry(itemId);
    } catch (error) {
      console.error("Error deleting item:", error);
      // Reload to restore state
      loadPantry();
      Alert.alert("Error", "Failed to remove item");
    }
  }, [loadPantry]);

  // Render swipe delete action
  const renderRightActions = (
    itemId: string,
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <Animated.View
        style={[styles.deleteAction, { transform: [{ translateX }] }]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(itemId)}
        >
          <MaterialCommunityIcons name="delete" size={24} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render pantry item
  const renderItem = useCallback(
    ({ item }: { item: PantryItem }) => (
      <Swipeable
        renderRightActions={(progress) => renderRightActions(item.id, progress)}
        overshootRight={false}
      >
        <View style={styles.itemCard}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <View style={styles.itemMeta}>
              {item.location && (
                <Chip icon={getLocationIcon(item.location)} style={styles.chip}>
                  {item.location}
                </Chip>
              )}
              {item.unit && (
                <Text style={styles.itemUnit}>
                  {item.quantity || 1} {item.unit}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.quantityControls}>
            <IconButton
              icon="minus"
              size={20}
              onPress={() => handleQuantityChange(item.id, -1)}
              style={styles.qtyButton}
            />
            <Text style={styles.quantityText}>{item.quantity || 1}</Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={() => handleQuantityChange(item.id, 1)}
              style={styles.qtyButton}
            />
          </View>
        </View>
      </Swipeable>
    ),
    [handleQuantityChange, handleDeleteItem]
  );

  // Get location icon
  const getLocationIcon = (
    location: string
  ): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (location) {
      case "fridge":
        return "fridge";
      case "freezer":
        return "snowflake";
      case "pantry":
        return "cupboard";
      default:
        return "package-variant";
    }
  };

  // Group items by location
  const groupedItems = items.reduce(
    (acc, item) => {
      const location = item.location || "other";
      if (!acc[location]) acc[location] = [];
      acc[location].push(item);
      return acc;
    },
    {} as Record<string, PantryItem[]>
  );

  // Loading state
  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading pantry...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {/* What Can I Make? Button */}
      <TouchableOpacity onPress={handleWhatCanIMake} activeOpacity={0.8}>
        <Surface style={styles.whatCanIMakeButton} elevation={2}>
          <View style={styles.whatCanIMakeContent}>
            <MaterialCommunityIcons
              name="chef-hat"
              size={28}
              color={colors.primary}
            />
            <View style={styles.whatCanIMakeText}>
              <Text style={styles.whatCanIMakeTitle}>What Can I Make?</Text>
              <Text style={styles.whatCanIMakeSubtitle}>
                Find recipes using your pantry ingredients
              </Text>
            </View>
          </View>
          <View style={styles.whatCanIMakeRight}>
            {!isPremium && (
              <Chip compact style={styles.premiumChip} textStyle={styles.premiumChipText}>
                Premium
              </Chip>
            )}
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </View>
        </Surface>
      </TouchableOpacity>

      {/* Header stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pantry</Text>
        <Text style={styles.headerSubtitle}>
          {items.length} item{items.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Empty state */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="fridge-outline"
            size={80}
            color={colors.textTertiary}
          />
          <Text style={styles.emptyTitle}>Your pantry is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add items you have at home to get smarter grocery lists
          </Text>
          <Button
            mode="contained"
            onPress={() => setShowAddModal(true)}
            style={styles.emptyButton}
            icon="plus"
          >
            Add First Item
          </Button>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* FAB to add item */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        color="#fff"
      />

      {/* Add Item Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Add to Pantry</Text>

          <TextInput
            mode="outlined"
            label="Item name"
            value={newItem.title}
            onChangeText={(text) =>
              setNewItem((prev) => ({ ...prev, title: text }))
            }
            style={styles.input}
            autoFocus
          />

          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label="Quantity"
              value={newItem.quantity}
              onChangeText={(text) =>
                setNewItem((prev) => ({ ...prev, quantity: text }))
              }
              keyboardType="numeric"
              style={[styles.input, styles.halfInput]}
            />
            <TextInput
              mode="outlined"
              label="Unit (optional)"
              value={newItem.unit}
              onChangeText={(text) =>
                setNewItem((prev) => ({ ...prev, unit: text }))
              }
              placeholder="oz, lb, cups..."
              style={[styles.input, styles.halfInput]}
            />
          </View>

          <Text style={styles.locationLabel}>Storage Location</Text>
          <View style={styles.locationButtons}>
            {LOCATIONS.map((loc) => (
              <Chip
                key={loc}
                selected={newItem.location === loc}
                onPress={() =>
                  setNewItem((prev) => ({ ...prev, location: loc }))
                }
                style={[
                  styles.locationChip,
                  newItem.location === loc && styles.locationChipSelected,
                ]}
                icon={getLocationIcon(loc)}
              >
                {loc.charAt(0).toUpperCase() + loc.slice(1)}
              </Chip>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowAddModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddItem}
              loading={isAdding}
              disabled={isAdding || !newItem.title.trim()}
              style={styles.addButton}
            >
              Add Item
            </Button>
          </View>
        </Modal>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
  },
  whatCanIMakeButton: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  whatCanIMakeContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  whatCanIMakeText: {
    marginLeft: 12,
    flex: 1,
  },
  whatCanIMakeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  whatCanIMakeSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  whatCanIMakeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  premiumChip: {
    backgroundColor: `${colors.primary}20`,
    height: 24,
  },
  premiumChipText: {
    fontSize: 11,
    color: colors.primary,
  },
  header: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.card,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 6,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    height: 28,
    backgroundColor: colors.lightGray,
  },
  itemUnit: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    margin: 0,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    minWidth: 30,
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  deleteAction: {
    width: 80,
    backgroundColor: colors.error,
  },
  deleteButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
  modal: {
    backgroundColor: colors.card,
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  locationButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  locationChip: {
    backgroundColor: colors.lightGray,
  },
  locationChipSelected: {
    backgroundColor: colors.primaryLight,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
});
