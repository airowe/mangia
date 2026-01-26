// screens/GroceryListScreen.tsx
// Grocery list with items organized by category

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  SectionList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from "react-native";
import { Text, Checkbox, Button, IconButton, Chip } from "react-native-paper";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { Screen } from "../components/Screen";
import { useTheme } from "../theme";
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
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

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

  // Share grocery list
  const handleShare = useCallback(async () => {
    let shareText = "🛒 Grocery List\n";
    shareText += `📅 ${new Date().toLocaleDateString()}\n\n`;

    // Add recipe names
    if (recipes.length > 0) {
      shareText += `For: ${recipes.map((r) => r.title).join(", ")}\n\n`;
    }

    // Add items by category
    for (const section of sections) {
      shareText += `${section.title}:\n`;
      for (const item of section.data) {
        const checked = item.checked ? "✓" : "☐";
        const qty = item.need_to_buy > 0 ? item.need_to_buy : item.total_quantity;
        const unit = item.unit ? ` ${item.unit}` : "";
        shareText += `${checked} ${qty}${unit} ${item.name}\n`;
      }
      shareText += "\n";
    }

    shareText += "— Shared from Mangia 🍝";

    try {
      await Share.share({
        message: shareText,
        title: "Grocery List",
      });
    } catch (error) {
      console.error("Error sharing grocery list:", error);
    }
  }, [recipes, sections]);

  const styles = useMemo(
    () => ({
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
        marginTop: spacing.md,
        color: colors.textSecondary,
        ...typography.styles.body,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        padding: spacing.xxl,
      },
      emptyTitle: {
        ...typography.styles.title2,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
      },
      emptySubtitle: {
        ...typography.styles.body,
        color: colors.textSecondary,
        textAlign: "center" as const,
        marginBottom: spacing.xl,
      },
      emptyButton: {
        paddingHorizontal: spacing.md,
      },
      header: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        padding: spacing.md,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerInfo: {},
      headerActions: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
      },
      headerTitle: {
        ...typography.styles.title2,
        color: colors.text,
      },
      headerSubtitle: {
        ...typography.styles.body,
        color: colors.textSecondary,
        marginTop: 2,
      },
      progressBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
      },
      progressText: {
        ...typography.styles.body,
        color: colors.textOnPrimary,
        fontWeight: "600" as const,
      },
      recipeChips: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        padding: spacing.sm,
        gap: spacing.sm,
        backgroundColor: colors.card,
      },
      recipeChip: {
        backgroundColor: colors.primaryLight,
      },
      recipeChipText: {
        ...typography.styles.caption2,
      },
      listContent: {
        paddingBottom: 100,
      },
      sectionHeader: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surfaceElevated,
        marginTop: spacing.sm,
      },
      sectionTitle: {
        ...typography.styles.body,
        fontWeight: "600" as const,
        color: colors.text,
      },
      sectionCount: {
        ...typography.styles.body,
        color: colors.textSecondary,
      },
      itemRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      itemRowChecked: {
        backgroundColor: colors.surfaceElevated,
      },
      itemContent: {
        flex: 1,
        marginLeft: spacing.xs,
      },
      itemName: {
        ...typography.styles.body,
        color: colors.text,
      },
      itemNameChecked: {
        textDecorationLine: "line-through" as const,
        color: colors.textSecondary,
      },
      itemQuantity: {
        ...typography.styles.body,
        color: colors.textSecondary,
        marginTop: 2,
      },
      recipeIndicator: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: spacing.xs,
        marginRight: spacing.sm,
      },
      recipeCount: {
        ...typography.styles.caption2,
        color: colors.textTertiary,
      },
      alreadyHaveSection: {
        marginTop: spacing.md,
        backgroundColor: colors.card,
        borderRadius: borderRadius.sm,
        marginHorizontal: spacing.md,
        overflow: "hidden" as const,
      },
      alreadyHaveHeader: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      alreadyHaveTitle: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: spacing.sm,
      },
      alreadyHaveText: {
        ...typography.styles.body,
        fontWeight: "500" as const,
        color: colors.success,
      },
      alreadyHaveList: {
        padding: spacing.sm,
      },
      alreadyHaveItem: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: spacing.sm,
        paddingVertical: spacing.sm,
      },
      alreadyHaveItemText: {
        ...typography.styles.body,
        color: colors.text,
      },
      pantryQuantity: {
        color: colors.textSecondary,
      },
      bottomActions: {
        position: "absolute" as const,
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.md,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      },
      completeButton: {
        borderRadius: borderRadius.sm,
        backgroundColor: colors.success,
      },
      completeButtonContent: {
        paddingVertical: spacing.sm,
      },
    }),
    [colors, spacing, borderRadius, typography]
  );

  // Render a single grocery item
  const renderItem = useCallback(
    ({ item, index }: { item: GroceryItemWithChecked; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
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
      </Animated.View>
    ),
    [toggleItem, styles, colors]
  );

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length} items</Text>
      </View>
    ),
    [styles]
  );

  // Render already have section
  const renderAlreadyHave = () => {
    if (itemsInPantry.length === 0) return null;

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.alreadyHaveSection}>
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
            {itemsInPantry.map((item, index) => (
              <Animated.View
                key={item.name}
                entering={FadeInDown.delay(index * 30).duration(300)}
                style={styles.alreadyHaveItem}
              >
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
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>
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
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
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
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {/* Header with progress */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Shopping List</Text>
          <Text style={styles.headerSubtitle}>
            {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} •{" "}
            {totalToBuy} items
          </Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="share-variant"
            size={24}
            iconColor={colors.primary}
            onPress={handleShare}
          />
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {checkedCount}/{totalToBuy}
            </Text>
          </View>
        </View>
      </Animated.View>

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
        <Animated.View entering={FadeIn.duration(400)} style={styles.bottomActions}>
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
        </Animated.View>
      )}
    </Screen>
  );
}
