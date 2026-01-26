// screens/PantryScreen.tsx
// Pantry management - track ingredients you have at home

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import ReanimatedAnimated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { Screen } from "../components/Screen";
import { GlassCard } from "../components/glass";
import { useTheme } from "../theme";
import { PantryItem } from "../models/Product";
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

// Storage locations
const LOCATIONS = ["fridge", "freezer", "pantry"] as const;
type StorageLocation = (typeof LOCATIONS)[number];

export default function PantryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isPremium } = usePremiumFeature();
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

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

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    loadingText: {
      marginTop: spacing.lg,
      color: colors.textSecondary,
      ...typography.styles.body,
    },
    whatCanIMakeButton: {
      margin: spacing.lg,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    whatCanIMakeContent: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      flex: 1,
    },
    whatCanIMakeText: {
      marginLeft: spacing.md,
      flex: 1,
    },
    whatCanIMakeTitle: {
      ...typography.styles.headline,
      color: colors.text,
    },
    whatCanIMakeSubtitle: {
      ...typography.styles.caption1,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    whatCanIMakeRight: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
    },
    premiumChip: {
      backgroundColor: colors.primaryLight,
      height: 24,
    },
    premiumChipText: {
      fontSize: 11,
      color: colors.primary,
    },
    header: {
      padding: spacing.lg,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...typography.styles.title1,
      color: colors.text,
    },
    headerSubtitle: {
      ...typography.styles.subheadline,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      padding: spacing.xxxl,
    },
    emptyTitle: {
      ...typography.styles.title2,
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    emptySubtitle: {
      ...typography.styles.body,
      color: colors.textSecondary,
      textAlign: "center" as const,
      marginBottom: spacing.xl,
    },
    emptyButton: {
      paddingHorizontal: spacing.lg,
    },
    listContent: {
      paddingBottom: 100,
    },
    itemCard: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      padding: spacing.lg,
      backgroundColor: colors.card,
    },
    itemInfo: {
      flex: 1,
    },
    itemTitle: {
      ...typography.styles.body,
      fontWeight: "500" as const,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    itemMeta: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
    },
    chip: {
      height: 28,
      backgroundColor: colors.surfaceElevated,
    },
    itemUnit: {
      ...typography.styles.subheadline,
      color: colors.textSecondary,
    },
    quantityControls: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    qtyButton: {
      margin: 0,
    },
    quantityText: {
      ...typography.styles.headline,
      color: colors.text,
      minWidth: 30,
      textAlign: "center" as const,
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
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    deleteText: {
      color: colors.textOnPrimary,
      ...typography.styles.caption2,
      marginTop: spacing.xs,
    },
    fab: {
      position: "absolute" as const,
      right: spacing.lg,
      bottom: spacing.lg,
      backgroundColor: colors.primary,
    },
    modal: {
      backgroundColor: colors.card,
      margin: spacing.xl,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
    },
    modalTitle: {
      ...typography.styles.title2,
      color: colors.text,
      marginBottom: spacing.lg,
    },
    input: {
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
    },
    row: {
      flexDirection: "row" as const,
      gap: spacing.md,
    },
    halfInput: {
      flex: 1,
    },
    locationLabel: {
      ...typography.styles.subheadline,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    locationButtons: {
      flexDirection: "row" as const,
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    locationChip: {
      backgroundColor: colors.surfaceElevated,
    },
    locationChipSelected: {
      backgroundColor: colors.primaryLight,
    },
    modalActions: {
      flexDirection: "row" as const,
      gap: spacing.md,
    },
    cancelButton: {
      flex: 1,
    },
    addButton: {
      flex: 1,
    },
  }), [colors, spacing, borderRadius, typography]);

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

  // Get location icon
  const getLocationIcon = useCallback((
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
  }, []);

  // Render swipe delete action
  const renderRightActions = useCallback((
    itemId: string,
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <Animated.View
        style={[dynamicStyles.deleteAction, { transform: [{ translateX }] }]}
      >
        <TouchableOpacity
          style={dynamicStyles.deleteButton}
          onPress={() => handleDeleteItem(itemId)}
        >
          <MaterialCommunityIcons name="delete" size={24} color={colors.textOnPrimary} />
          <Text style={dynamicStyles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [dynamicStyles, colors.textOnPrimary, handleDeleteItem]);

  // Render pantry item
  const renderItem = useCallback(
    ({ item, index }: { item: PantryItem; index: number }) => (
      <ReanimatedAnimated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <Swipeable
          renderRightActions={(progress) => renderRightActions(item.id, progress)}
          overshootRight={false}
        >
          <View style={dynamicStyles.itemCard}>
            <View style={dynamicStyles.itemInfo}>
              <Text style={dynamicStyles.itemTitle}>{item.title}</Text>
              <View style={dynamicStyles.itemMeta}>
                {item.location && (
                  <Chip icon={getLocationIcon(item.location)} style={dynamicStyles.chip}>
                    {item.location}
                  </Chip>
                )}
                {item.unit && (
                  <Text style={dynamicStyles.itemUnit}>
                    {item.quantity || 1} {item.unit}
                  </Text>
                )}
              </View>
            </View>

            <View style={dynamicStyles.quantityControls}>
              <IconButton
                icon="minus"
                size={20}
                onPress={() => handleQuantityChange(item.id, -1)}
                style={dynamicStyles.qtyButton}
              />
              <Text style={dynamicStyles.quantityText}>{item.quantity || 1}</Text>
              <IconButton
                icon="plus"
                size={20}
                onPress={() => handleQuantityChange(item.id, 1)}
                style={dynamicStyles.qtyButton}
              />
            </View>
          </View>
        </Swipeable>
      </ReanimatedAnimated.View>
    ),
    [dynamicStyles, handleQuantityChange, handleDeleteItem, getLocationIcon, renderRightActions]
  );

  // Loading state
  if (isLoading) {
    return (
      <Screen style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>Loading pantry...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={dynamicStyles.container}>
      {/* What Can I Make? Button */}
      <ReanimatedAnimated.View entering={FadeInDown.duration(400)}>
        <TouchableOpacity onPress={handleWhatCanIMake} activeOpacity={0.8}>
          <GlassCard style={dynamicStyles.whatCanIMakeButton} elevation={2} padding="none">
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, padding: spacing.lg }}>
              <View style={dynamicStyles.whatCanIMakeContent}>
                <MaterialCommunityIcons
                  name="chef-hat"
                  size={28}
                  color={colors.primary}
                />
                <View style={dynamicStyles.whatCanIMakeText}>
                  <Text style={dynamicStyles.whatCanIMakeTitle}>What Can I Make?</Text>
                  <Text style={dynamicStyles.whatCanIMakeSubtitle}>
                    Find recipes using your pantry ingredients
                  </Text>
                </View>
              </View>
              <View style={dynamicStyles.whatCanIMakeRight}>
                {!isPremium && (
                  <Chip compact style={dynamicStyles.premiumChip} textStyle={dynamicStyles.premiumChipText}>
                    Premium
                  </Chip>
                )}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </ReanimatedAnimated.View>

      {/* Header stats */}
      <ReanimatedAnimated.View entering={FadeInDown.delay(100).duration(400)} style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>My Pantry</Text>
        <Text style={dynamicStyles.headerSubtitle}>
          {items.length} item{items.length !== 1 ? "s" : ""}
        </Text>
      </ReanimatedAnimated.View>

      {/* Empty state */}
      {items.length === 0 ? (
        <ReanimatedAnimated.View entering={FadeIn.delay(200).duration(400)} style={dynamicStyles.emptyContainer}>
          <MaterialCommunityIcons
            name="fridge-outline"
            size={80}
            color={colors.textTertiary}
          />
          <Text style={dynamicStyles.emptyTitle}>Your pantry is empty</Text>
          <Text style={dynamicStyles.emptySubtitle}>
            Add items you have at home to get smarter grocery lists
          </Text>
          <Button
            mode="contained"
            onPress={() => setShowAddModal(true)}
            style={dynamicStyles.emptyButton}
            icon="plus"
          >
            Add First Item
          </Button>
        </ReanimatedAnimated.View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={dynamicStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={dynamicStyles.separator} />}
        />
      )}

      {/* FAB to add item */}
      <FAB
        icon="plus"
        style={dynamicStyles.fab}
        onPress={() => setShowAddModal(true)}
        color={colors.textOnPrimary}
      />

      {/* Add Item Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={dynamicStyles.modal}
        >
          <Text style={dynamicStyles.modalTitle}>Add to Pantry</Text>

          <TextInput
            mode="outlined"
            label="Item name"
            value={newItem.title}
            onChangeText={(text) =>
              setNewItem((prev) => ({ ...prev, title: text }))
            }
            style={dynamicStyles.input}
            autoFocus
          />

          <View style={dynamicStyles.row}>
            <TextInput
              mode="outlined"
              label="Quantity"
              value={newItem.quantity}
              onChangeText={(text) =>
                setNewItem((prev) => ({ ...prev, quantity: text }))
              }
              keyboardType="numeric"
              style={[dynamicStyles.input, dynamicStyles.halfInput]}
            />
            <TextInput
              mode="outlined"
              label="Unit (optional)"
              value={newItem.unit}
              onChangeText={(text) =>
                setNewItem((prev) => ({ ...prev, unit: text }))
              }
              placeholder="oz, lb, cups..."
              style={[dynamicStyles.input, dynamicStyles.halfInput]}
            />
          </View>

          <Text style={dynamicStyles.locationLabel}>Storage Location</Text>
          <View style={dynamicStyles.locationButtons}>
            {LOCATIONS.map((loc) => (
              <Chip
                key={loc}
                selected={newItem.location === loc}
                onPress={() =>
                  setNewItem((prev) => ({ ...prev, location: loc }))
                }
                style={[
                  dynamicStyles.locationChip,
                  newItem.location === loc && dynamicStyles.locationChipSelected,
                ]}
                icon={getLocationIcon(loc)}
              >
                {loc.charAt(0).toUpperCase() + loc.slice(1)}
              </Chip>
            ))}
          </View>

          <View style={dynamicStyles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowAddModal(false)}
              style={dynamicStyles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddItem}
              loading={isAdding}
              disabled={isAdding || !newItem.title.trim()}
              style={dynamicStyles.addButton}
            >
              Add Item
            </Button>
          </View>
        </Modal>
      </Portal>
    </Screen>
  );
}
