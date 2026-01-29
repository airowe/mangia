// screens/GroceryListScreen.tsx
// Grocery list with items organized by category - Editorial redesign
// Design reference: grocery_shopping_list_1/code.html

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  ScrollView,
  TextInput,
  Keyboard,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReanimatedAnimated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { Screen } from "../components/Screen";
import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";
import { IngredientCategory } from "../models/Recipe";
import { ConsolidatedIngredient } from "../models/GroceryList";
import { RecipeWithIngredients, fetchRecipeById } from "../lib/recipeService";
import {
  generateGroceryList,
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
  const insets = useSafeAreaInsets();
  const recipeIds = route.params?.recipeIds ?? [];

  const [items, setItems] = useState<GroceryItemWithChecked[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAlreadyHave, setShowAlreadyHave] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  // Add item manually
  const handleAddItem = useCallback(() => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    const newItem: GroceryItemWithChecked = {
      name: trimmed,
      total_quantity: 1,
      unit: "",
      category: "other" as IngredientCategory,
      from_recipes: [],
      in_pantry: false,
      pantry_quantity: 0,
      need_to_buy: 1,
      checked: false,
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemText("");
    Keyboard.dismiss();
  }, [newItemText]);

  // Load recipes and generate grocery list
  const loadGroceryList = useCallback(async () => {
    // If no recipe IDs, skip loading and show empty state
    if (recipeIds.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const recipePromises = recipeIds.map((id) => fetchRecipeById(id));
      const fetchedRecipes = await Promise.all(recipePromises);
      const validRecipes = fetchedRecipes.filter(
        (r): r is RecipeWithIngredients => r !== null
      );
      setRecipes(validRecipes);

      const consolidated = await generateGroceryList(validRecipes);
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

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadGroceryList();
  }, [loadGroceryList]);

  const toggleItem = useCallback((itemName: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.name === itemName ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleClear = useCallback(() => {
    Alert.alert("Clear List", "Are you sure you want to clear all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => setItems((prev) => prev.map((i) => ({ ...i, checked: false }))),
      },
    ]);
  }, []);

  const itemsToBuy = useMemo(
    () => items.filter((item) => item.need_to_buy > 0 || !item.in_pantry),
    [items]
  );

  const itemsInPantry = useMemo(
    () => items.filter((item) => item.in_pantry && item.need_to_buy === 0),
    [items]
  );

  const sections = useMemo((): Section[] => {
    const categoryMap = new Map<IngredientCategory, GroceryItemWithChecked[]>();

    for (const item of itemsToBuy) {
      const existing = categoryMap.get(item.category) || [];
      categoryMap.set(item.category, [...existing, item]);
    }

    const result: Section[] = [];

    for (const [category, categoryItems] of categoryMap.entries()) {
      result.push({
        title: getCategoryDisplayName(category),
        category,
        data: categoryItems.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }

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

  const checkedCount = useMemo(
    () => itemsToBuy.filter((i) => i.checked).length,
    [itemsToBuy]
  );
  const totalToBuy = itemsToBuy.length;

  const handleShare = useCallback(async () => {
    let shareText = "🛒 Grocery List\n";
    shareText += `📅 ${new Date().toLocaleDateString()}\n\n`;

    if (recipes.length > 0) {
      shareText += `For: ${recipes.map((r) => r.title).join(", ")}\n\n`;
    }

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
      await Share.share({ message: shareText, title: "Grocery List" });
    } catch (error) {
      console.error("Error sharing grocery list:", error);
    }
  }, [recipes, sections]);

  const renderItem = useCallback(
    ({ item, index }: { item: GroceryItemWithChecked; index: number }) => (
      <ReanimatedAnimated.View entering={FadeInDown.delay(index * 30).duration(300)}>
        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => toggleItem(item.name)}
          activeOpacity={0.9}
        >
          {/* Custom Checkbox */}
          <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
            {item.checked && (
              <MaterialCommunityIcons
                name="check"
                size={14}
                color={mangiaColors.white}
              />
            )}
          </View>

          {/* Item Details */}
          <View style={styles.itemContent}>
            <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
              {item.name}
            </Text>
            <Text style={styles.itemQuantity}>
              {item.need_to_buy > 0 ? item.need_to_buy : item.total_quantity}
              {item.unit ? ` ${item.unit}` : ""}
            </Text>
          </View>
        </TouchableOpacity>
      </ReanimatedAnimated.View>
    ),
    [toggleItem]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length} Items</Text>
      </View>
    ),
    []
  );

  const renderAlreadyHave = () => {
    if (itemsInPantry.length === 0) return null;

    return (
      <ReanimatedAnimated.View entering={FadeIn.duration(400)} style={styles.alreadyHaveSection}>
        <TouchableOpacity
          style={styles.alreadyHaveHeader}
          onPress={() => setShowAlreadyHave(!showAlreadyHave)}
        >
          <View style={styles.alreadyHaveTitle}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={mangiaColors.sage}
            />
            <Text style={styles.alreadyHaveText}>
              Already Have ({itemsInPantry.length})
            </Text>
          </View>
          <MaterialCommunityIcons
            name={showAlreadyHave ? "chevron-up" : "chevron-down"}
            size={24}
            color={mangiaColors.brown}
          />
        </TouchableOpacity>

        {showAlreadyHave && (
          <View style={styles.alreadyHaveList}>
            {itemsInPantry.map((item, index) => (
              <ReanimatedAnimated.View
                key={item.name}
                entering={FadeInDown.delay(index * 30).duration(300)}
                style={styles.alreadyHaveItem}
              >
                <MaterialCommunityIcons
                  name="checkbox-marked-circle-outline"
                  size={18}
                  color={mangiaColors.sage}
                />
                <Text style={styles.alreadyHaveItemText}>
                  {item.name}
                  {item.pantry_quantity > 0 && (
                    <Text style={styles.pantryQuantity}>
                      {" "}({item.pantry_quantity} {item.unit})
                    </Text>
                  )}
                </Text>
              </ReanimatedAnimated.View>
            ))}
          </View>
        )}
      </ReanimatedAnimated.View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Screen style={styles.container} noPadding>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mangiaColors.terracotta} />
          <Text style={styles.loadingText}>Generating grocery list...</Text>
        </View>
      </Screen>
    );
  }

  // Empty state - different message if no recipes selected vs no ingredients
  if (items.length === 0) {
    const noRecipesSelected = recipeIds.length === 0;
    return (
      <Screen style={styles.container} noPadding>
        <ReanimatedAnimated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={noRecipesSelected ? "cart-plus" : "cart-outline"}
            size={80}
            color={mangiaColors.taupe}
          />
          <Text style={styles.emptyTitle}>
            {noRecipesSelected ? "Your List is Empty" : "No ingredients found"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {noRecipesSelected
              ? "Add items manually or select recipes from your menu"
              : "The selected recipes don't have any ingredients"}
          </Text>

          {/* Manual add input */}
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="Add an item..."
              placeholderTextColor={mangiaColors.taupe}
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.addItemButton,
                !newItemText.trim() && styles.addItemButtonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!newItemText.trim()}
            >
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color={newItemText.trim() ? mangiaColors.white : mangiaColors.taupe}
              />
            </TouchableOpacity>
          </View>

          {!noRecipesSelected && (
            <TouchableOpacity style={styles.emptyButtonSecondary} onPress={handleBack}>
              <Text style={styles.emptyButtonSecondaryText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </ReanimatedAnimated.View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container} noPadding>
      {/* Header */}
      <ReanimatedAnimated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={mangiaColors.dark}
          />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <MaterialCommunityIcons
              name="share-variant"
              size={22}
              color={mangiaColors.dark}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </ReanimatedAnimated.View>

      {/* Content */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: 200 + insets.bottom }]}
        ListHeaderComponent={
          <ReanimatedAnimated.View entering={FadeInDown.delay(100).duration(400)} style={styles.headlineContainer}>
            <Text style={styles.headline}>
              Your Weekly{"\n"}
              <Text style={styles.headlineAccent}>Market Haul</Text>
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.shoppingBadge}>
                <Text style={styles.shoppingBadgeText}>SHOPPING LIST</Text>
              </View>
              <Text style={styles.metaText}>
                {recipes.length} Recipe{recipes.length !== 1 ? "s" : ""} • {totalToBuy} Items
              </Text>
            </View>
          </ReanimatedAnimated.View>
        }
        ListFooterComponent={renderAlreadyHave}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={mangiaColors.terracotta}
          />
        }
      />

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient
          colors={["rgba(248, 247, 246, 0)", "#F8F7F6", "#F8F7F6"]}
          style={styles.footerGradient}
        />
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => {
            Alert.alert(
              "Shop Ingredients",
              "This feature will connect to grocery delivery services.",
              [{ text: "OK" }]
            );
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.shopButtonText}>Shop Ingredients</Text>
          <View style={styles.shopButtonDivider} />
          <View style={styles.shopButtonIcons}>
            <View style={styles.shopIcon}>
              <MaterialCommunityIcons
                name="cart"
                size={14}
                color={mangiaColors.terracotta}
              />
            </View>
            <View style={[styles.shopIcon, styles.shopIconOverlap]}>
              <MaterialCommunityIcons
                name="truck-delivery"
                size={14}
                color={mangiaColors.terracotta}
              />
            </View>
          </View>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={mangiaColors.white}
          />
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F6",
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: "600",
    color: mangiaColors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: mangiaColors.terracotta,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: mangiaColors.white,
  },
  emptyButtonSecondary: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 12,
  },
  emptyButtonSecondaryText: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: mangiaColors.terracotta,
  },
  addItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  addItemInput: {
    flex: 1,
    height: 52,
    backgroundColor: mangiaColors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.dark,
    borderWidth: 1,
    borderColor: "#E8E6E3",
  },
  addItemButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: mangiaColors.terracotta,
    justifyContent: "center",
    alignItems: "center",
  },
  addItemButtonDisabled: {
    backgroundColor: "#E8E6E3",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "rgba(248, 247, 246, 0.95)",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  clearText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: mangiaColors.terracotta,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Headline
  headlineContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 40,
    fontWeight: "500",
    color: mangiaColors.dark,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    fontStyle: "italic",
    color: mangiaColors.terracotta,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  shoppingBadge: {
    backgroundColor: `${mangiaColors.terracotta}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shoppingBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: mangiaColors.terracotta,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: mangiaColors.brown,
  },

  // List
  listContent: {
    paddingBottom: 200,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  sectionTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: "500",
    color: mangiaColors.dark,
  },
  sectionCount: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: mangiaColors.brown,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },

  // Item Row
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#E4DFDC",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: mangiaColors.terracotta,
    borderColor: mangiaColors.terracotta,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    color: mangiaColors.dark,
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    textDecorationColor: mangiaColors.terracotta,
    color: mangiaColors.brown,
  },
  itemQuantity: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: mangiaColors.brown,
    marginTop: 2,
  },

  // Already Have Section
  alreadyHaveSection: {
    marginTop: 24,
    marginHorizontal: 24,
    backgroundColor: mangiaColors.white,
    borderRadius: 12,
    overflow: "hidden",
  },
  alreadyHaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  alreadyHaveTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alreadyHaveText: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: mangiaColors.sage,
  },
  alreadyHaveList: {
    padding: 12,
  },
  alreadyHaveItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  alreadyHaveItemText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.dark,
  },
  pantryQuantity: {
    color: mangiaColors.brown,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  footerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 56,
    backgroundColor: mangiaColors.terracotta,
    borderRadius: 12,
    paddingHorizontal: 24,
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  shopButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    color: mangiaColors.white,
    letterSpacing: 0.5,
  },
  shopButtonDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  shopButtonIcons: {
    flexDirection: "row",
  },
  shopIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: mangiaColors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: mangiaColors.terracotta,
  },
  shopIconOverlap: {
    marginLeft: -8,
  },
});
