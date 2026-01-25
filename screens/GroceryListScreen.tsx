// screens/GroceryListScreen.tsx
// Grocery list with items organized by category

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  SectionList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Text, Checkbox, Button, IconButton, Chip } from "react-native-paper";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import { IngredientCategory } from "../models/Recipe";
import { ConsolidatedIngredient } from "../models/GroceryList";
import { RecipeWithIngredients, fetchRecipeById } from "../lib/recipeService";
import {
  generateGroceryList,
  getItemsToBuy,
  getItemsInPantry,
} from "../lib/groceryList";
import { getCategoryDisplayName } from "../utils/categorizeIngredient";

type GroceryListScreenRouteProp = RouteProp<
  { params: { recipeIds: string[] } },
  "params"
>;

type RootStackParamList = {
  WantToCookScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface GroceryItemWithChecked extends ConsolidatedIngredient {
  checked: boolean;
}

interface Section {
  title: string;
  category: IngredientCategory;
  data: GroceryItemWithChecked[];
}

export default function GroceryListScreen() {
  const route = useRoute<GroceryListScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { recipeIds } = route.params;

  const [items, setItems] = useState<GroceryItemWithChecked[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAlreadyHave, setShowAlreadyHave] = useState(false);

  // Load recipes and generate grocery list
  const loadGroceryList = useCallback(async () => {
    try {
      // Fetch all recipes
      const recipePromises = recipeIds.map((id) => fetchRecipeById(id));
      const fetchedRecipes = await Promise.all(recipePromises);

      // Filter out null results
      const validRecipes = fetchedRecipes.filter(
        (r): r is RecipeWithIngredients => r !== null
      );
      setRecipes(validRecipes);

      // Generate consolidated grocery list
      const consolidated = await generateGroceryList(validRecipes);

      // Add checked state
      const itemsWithChecked = consolidated.map((item) => ({
        ...item,
        checked: false,
      }));

      setItems(itemsWithChecked);
    } catch (error) {
      console.error("Error loading grocery list:", error);
      Alert.alert("Error", "Failed to generate grocery list");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [recipeIds]);

  useEffect(() => {
    loadGroceryList();
  }, [loadGroceryList]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadGroceryList();
  }, [loadGroceryList]);

  // Toggle item checked state
  const toggleItem = useCallback((itemName: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.name === itemName ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  // Get items to buy (not in pantry or need more)
  const itemsToBuy = useMemo(
    () => items.filter((item) => item.need_to_buy > 0 || !item.in_pantry),
    [items]
  );

  // Get items already in pantry
  const itemsInPantry = useMemo(
    () => items.filter((item) => item.in_pantry && item.need_to_buy === 0),
    [items]
  );

  // Group items by category for sections
  const sections = useMemo((): Section[] => {
    const categoryMap = new Map<IngredientCategory, GroceryItemWithChecked[]>();

    // Group items to buy by category
    for (const item of itemsToBuy) {
      const existing = categoryMap.get(item.category) || [];
      categoryMap.set(item.category, [...existing, item]);
    }

    // Convert to sections array and sort
    const result: Section[] = [];

    for (const [category, categoryItems] of categoryMap.entries()) {
      result.push({
        title: getCategoryDisplayName(category),
        category,
        data: categoryItems.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }

    // Sort sections by store order
    return result.sort((a, b) => {
      const order: Record<IngredientCategory, number> = {
        produce: 1,
        meat_seafood: 2,
        dairy_eggs: 3,
        bakery: 4,
        frozen: 5,
        canned: 6,
        pantry: 7,
        other: 8,
      };
      return (order[a.category] || 8) - (order[b.category] || 8);
    });
  }, [itemsToBuy]);

  // Count checked/unchecked items
  const checkedCount = useMemo(
    () => itemsToBuy.filter((i) => i.checked).length,
    [itemsToBuy]
  );
  const totalToBuy = itemsToBuy.length;

  // Render a single grocery item
  const renderItem = useCallback(
    ({ item }: { item: GroceryItemWithChecked }) => (
      <TouchableOpacity
        style={[styles.itemRow, item.checked && styles.itemRowChecked]}
        onPress={() => toggleItem(item.name)}
        activeOpacity={0.7}
      >
        <Checkbox
          status={item.checked ? "checked" : "unchecked"}
          onPress={() => toggleItem(item.name)}
          color={colors.primary}
        />
        <View style={styles.itemContent}>
          <Text
            style={[styles.itemName, item.checked && styles.itemNameChecked]}
          >
            {item.name}
          </Text>
          <Text style={styles.itemQuantity}>
            {item.need_to_buy > 0 ? item.need_to_buy : item.total_quantity}
            {item.unit ? ` ${item.unit}` : ""}
          </Text>
        </View>
        {item.from_recipes.length > 0 && (
          <View style={styles.recipeIndicator}>
            <MaterialCommunityIcons
              name="food"
              size={14}
              color={colors.textTertiary}
            />
            <Text style={styles.recipeCount}>{item.from_recipes.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [toggleItem]
  );

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length} items</Text>
      </View>
    ),
    []
  );

  // Render already have section
  const renderAlreadyHave = () => {
    if (itemsInPantry.length === 0) return null;

    return (
      <View style={styles.alreadyHaveSection}>
        <TouchableOpacity
          style={styles.alreadyHaveHeader}
          onPress={() => setShowAlreadyHave(!showAlreadyHave)}
        >
          <View style={styles.alreadyHaveTitle}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.alreadyHaveText}>
              Already Have ({itemsInPantry.length})
            </Text>
          </View>
          <MaterialCommunityIcons
            name={showAlreadyHave ? "chevron-up" : "chevron-down"}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {showAlreadyHave && (
          <View style={styles.alreadyHaveList}>
            {itemsInPantry.map((item) => (
              <View key={item.name} style={styles.alreadyHaveItem}>
                <MaterialCommunityIcons
                  name="checkbox-marked-circle-outline"
                  size={18}
                  color={colors.success}
                />
                <Text style={styles.alreadyHaveItemText}>
                  {item.name}
                  {item.pantry_quantity > 0 && (
                    <Text style={styles.pantryQuantity}>
                      {" "}
                      ({item.pantry_quantity} {item.unit})
                    </Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Generating grocery list...</Text>
        </View>
      </Screen>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Screen style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="cart-outline"
            size={80}
            color={colors.textTertiary}
          />
          <Text style={styles.emptyTitle}>No ingredients found</Text>
          <Text style={styles.emptySubtitle}>
            The selected recipes don't have any ingredients
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.emptyButton}
          >
            Go Back
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Shopping List</Text>
          <Text style={styles.headerSubtitle}>
            {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} •{" "}
            {totalToBuy} items
          </Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {checkedCount}/{totalToBuy}
          </Text>
        </View>
      </View>

      {/* Recipe chips */}
      <View style={styles.recipeChips}>
        {recipes.map((recipe) => (
          <Chip
            key={recipe.id}
            style={styles.recipeChip}
            textStyle={styles.recipeChipText}
          >
            {recipe.title}
          </Chip>
        ))}
      </View>

      {/* Grocery list by category */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={renderAlreadyHave}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {/* Bottom actions */}
      {checkedCount === totalToBuy && totalToBuy > 0 && (
        <View style={styles.bottomActions}>
          <Button
            mode="contained"
            onPress={() => {
              Alert.alert(
                "Shopping Complete!",
                "Would you like to add these items to your pantry?",
                [
                  { text: "Not Now", style: "cancel" },
                  {
                    text: "Add to Pantry",
                    onPress: () => {
                      // TODO: Add to pantry
                      navigation.goBack();
                    },
                  },
                ]
              );
            }}
            icon="check-all"
            style={styles.completeButton}
            contentStyle={styles.completeButtonContent}
          >
            Complete Shopping
          </Button>
        </View>
      )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerInfo: {},
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  recipeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
    backgroundColor: colors.card,
  },
  recipeChip: {
    backgroundColor: colors.primaryLight,
  },
  recipeChipText: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.lightGray,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  sectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemRowChecked: {
    backgroundColor: colors.lightGray,
  },
  itemContent: {
    flex: 1,
    marginLeft: 4,
  },
  itemName: {
    fontSize: 16,
    color: colors.text,
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    color: colors.textSecondary,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recipeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 8,
  },
  recipeCount: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  alreadyHaveSection: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  alreadyHaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  alreadyHaveTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alreadyHaveText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.success,
  },
  alreadyHaveList: {
    padding: 12,
  },
  alreadyHaveItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  alreadyHaveItemText: {
    fontSize: 14,
    color: colors.text,
  },
  pantryQuantity: {
    color: colors.textSecondary,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  completeButton: {
    borderRadius: 8,
    backgroundColor: colors.success,
  },
  completeButtonContent: {
    paddingVertical: 8,
  },
});
