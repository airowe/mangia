// screens/WhatCanIMakeScreen.tsx
// What Can I Make - recipe matching based on pantry ingredients
// Design reference: what_can_i_make?_1/code.html

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReanimatedAnimated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native-paper";

import { Screen } from "../components/Screen";
import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";
import { RecipeMatch, findRecipeMatches } from "../lib/whatCanIMake";
import { usePremiumFeature } from "../hooks/usePremiumFeature";

type RootStackParamList = {
  RecipeDetailScreen: { recipeId: string };
  SubscriptionScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Mock active ingredients for demo
const MOCK_INGREDIENTS = ["Tomatoes", "Fresh Basil", "Mozzarella", "Garlic"];

// Asymmetric card radius patterns
const CARD_SHAPES = [
  { borderTopLeftRadius: 24, borderTopRightRadius: 4, borderBottomLeftRadius: 4, borderBottomRightRadius: 24 },
  { borderTopLeftRadius: 4, borderTopRightRadius: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 4 },
] as const;

export const WhatCanIMakeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { isPremium, requirePremium } = usePremiumFeature();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matches, setMatches] = useState<RecipeMatch[]>([]);
  const [activeIngredients, setActiveIngredients] = useState<string[]>(MOCK_INGREDIENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPremium) {
      requirePremium("what_can_i_make");
    }
  }, [isPremium, requirePremium]);

  const loadMatches = useCallback(async () => {
    if (!isPremium) return;

    try {
      setError(null);
      const results = await findRecipeMatches(0);
      setMatches(results.filter((m) => m.matchPercentage > 0));
    } catch (err) {
      console.error("Error loading matches:", err);
      setError("Failed to load recipe matches. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isPremium]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMatches();
  }, [loadMatches]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRecipePress = useCallback((recipeId: string) => {
    navigation.navigate("RecipeDetailScreen", { recipeId });
  }, [navigation]);

  const removeIngredient = useCallback((ingredient: string) => {
    setActiveIngredients((prev) => prev.filter((i) => i !== ingredient));
  }, []);

  const addIngredient = useCallback(() => {
    if (searchQuery.trim() && !activeIngredients.includes(searchQuery.trim())) {
      setActiveIngredients((prev) => [...prev, searchQuery.trim()]);
      setSearchQuery("");
    }
  }, [searchQuery, activeIngredients]);

  const getMatchBadge = useCallback((match: RecipeMatch) => {
    if (match.isCompleteMatch) {
      return { text: "Perfect Match", color: mangiaColors.sage, bgColor: `${mangiaColors.sage}E6` };
    }
    if (match.missingIngredients.length === 1) {
      return { text: `Missing: ${match.missingIngredients[0].name}`, color: mangiaColors.white, bgColor: `${mangiaColors.terracotta}E6` };
    }
    return { text: `Use ${match.haveIngredients.length} ingredients`, color: mangiaColors.dark, bgColor: "rgba(255, 255, 255, 0.9)" };
  }, []);

  const renderRecipeCard = useCallback(({ item, index }: { item: RecipeMatch; index: number }) => {
    const shape = CARD_SHAPES[index % 2];
    const badge = getMatchBadge(item);
    const aspectRatio = index % 3 === 0 ? 0.8 : index % 3 === 1 ? 0.75 : 1;

    return (
      <ReanimatedAnimated.View
        entering={FadeInDown.delay(index * 100).duration(400)}
        style={[styles.recipeCard, index % 2 === 1 && styles.recipeCardOffset]}
      >
        <TouchableOpacity
          onPress={() => handleRecipePress(item.recipe.id)}
          activeOpacity={0.9}
        >
          {/* Image Container */}
          <View style={[styles.imageContainer, shape, { aspectRatio }]}>
            {item.recipe.image_url ? (
              <Image
                source={{ uri: item.recipe.image_url }}
                style={styles.recipeImage}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons
                  name="food"
                  size={48}
                  color={mangiaColors.taupe}
                />
              </View>
            )}

            {/* Match Badge */}
            <View style={[styles.matchBadge, { backgroundColor: badge.bgColor }]}>
              <Text style={[styles.matchBadgeText, { color: badge.color }]}>
                {badge.text}
              </Text>
            </View>

            {/* Favorite Button */}
            <TouchableOpacity style={styles.favoriteButton}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={20}
                color={mangiaColors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View style={styles.recipeDetails}>
            <View style={styles.recipeMeta}>
              <View style={styles.timeRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color={mangiaColors.terracotta}
                />
                <Text style={styles.timeText}>
                  {item.recipe.cook_time || item.recipe.prep_time || 30} min
                </Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.categoryText}>
                {item.recipe.meal_type || "Recipe"}
              </Text>
            </View>
            <Text style={styles.recipeTitle} numberOfLines={2}>
              {item.recipe.title}
            </Text>
            <Text style={styles.recipeDescription} numberOfLines={2}>
              {item.recipe.description || "A delicious recipe for any occasion."}
            </Text>
          </View>
        </TouchableOpacity>
      </ReanimatedAnimated.View>
    );
  }, [getMatchBadge, handleRecipePress]);

  // Premium gate
  if (!isPremium) {
    return (
      <Screen style={styles.container} noPadding>
        <ReanimatedAnimated.View entering={FadeIn.duration(400)} style={styles.premiumGate}>
          <MaterialCommunityIcons
            name="lock"
            size={64}
            color={mangiaColors.taupe}
          />
          <Text style={styles.premiumTitle}>Premium Feature</Text>
          <Text style={styles.premiumSubtitle}>
            Upgrade to Premium to discover which recipes you can make with ingredients you already have!
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate("SubscriptionScreen")}
          >
            <MaterialCommunityIcons name="crown" size={20} color={mangiaColors.white} />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.headerButton}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color={mangiaColors.dark}
          />
        </TouchableOpacity>
      </ReanimatedAnimated.View>

      <FlashList
        data={matches}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.recipe.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Headline */}
            <ReanimatedAnimated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.headlineContainer}
            >
              <Text style={styles.headline}>What can I make?</Text>
              <Text style={styles.subheadline}>
                Open the fridge. Tell us what you see.
              </Text>
            </ReanimatedAnimated.View>

            {/* Search Bar */}
            <ReanimatedAnimated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.searchContainer}
            >
              <View style={styles.searchBar}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={mangiaColors.brown}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Add an ingredient (e.g., Eggs, Spinach)"
                  placeholderTextColor={mangiaColors.taupe}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={addIngredient}
                  returnKeyType="done"
                />
              </View>
            </ReanimatedAnimated.View>

            {/* Active Ingredient Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsContainer}
            >
              {activeIngredients.map((ingredient, index) => (
                <ReanimatedAnimated.View
                  key={ingredient}
                  entering={FadeInRight.delay(300 + index * 50).duration(300)}
                >
                  <View style={styles.ingredientPill}>
                    <Text style={styles.ingredientPillText}>{ingredient}</Text>
                    <TouchableOpacity
                      onPress={() => removeIngredient(ingredient)}
                      style={styles.pillRemoveButton}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={16}
                        color="#5C6B58"
                      />
                    </TouchableOpacity>
                  </View>
                </ReanimatedAnimated.View>
              ))}
            </ScrollView>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Section Header */}
            <ReanimatedAnimated.View
              entering={FadeInDown.delay(400).duration(400)}
              style={styles.sectionHeader}
            >
              <Text style={styles.sectionTitle}>Matching Recipes</Text>
              <Text style={styles.resultCount}>{matches.length} Results</Text>
            </ReanimatedAnimated.View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={mangiaColors.terracotta} />
              <Text style={styles.loadingText}>Matching recipes to your pantry...</Text>
            </View>
          ) : (
            <ReanimatedAnimated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
              <MaterialCommunityIcons
                name="chef-hat"
                size={64}
                color={mangiaColors.taupe}
              />
              <Text style={styles.emptyTitle}>No Matches Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adding more ingredients to find matching recipes!
              </Text>
            </ReanimatedAnimated.View>
          )
        }
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F6",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "rgba(248, 247, 246, 0.8)",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },

  // Headline
  headlineContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 36,
    fontWeight: "500",
    fontStyle: "italic",
    color: mangiaColors.dark,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subheadline: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: mangiaColors.brown,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: mangiaColors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.dark,
    padding: 0,
  },

  // Pills
  pillsContainer: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 24,
  },
  ingredientPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${mangiaColors.sage}25`,
    borderWidth: 1,
    borderColor: `${mangiaColors.sage}40`,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  ingredientPillText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: "#5C6B58",
  },
  pillRemoveButton: {
    padding: 2,
  },

  // Divider
  divider: {
    height: 1,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: "#E5E0DD",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: "700",
    color: mangiaColors.dark,
  },
  resultCount: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: mangiaColors.terracotta,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },

  // Recipe Card
  recipeCard: {
    width: "48%",
    marginBottom: 24,
  },
  recipeCardOffset: {
    marginTop: 48,
  },
  imageContainer: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#E5E0DD",
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0EBE8",
  },
  matchBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  matchBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  recipeDetails: {
    paddingTop: 12,
  },
  recipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: mangiaColors.brown,
  },
  metaDot: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: mangiaColors.brown,
    marginHorizontal: 6,
  },
  categoryText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: mangiaColors.brown,
  },
  recipeTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 20,
    fontWeight: "600",
    color: mangiaColors.dark,
    lineHeight: 24,
    marginBottom: 4,
  },
  recipeDescription: {
    fontFamily: fontFamily.serif,
    fontSize: 14,
    fontStyle: "italic",
    color: "#5C4D46",
    lineHeight: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
    marginTop: 16,
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
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
  },

  // Premium Gate
  premiumGate: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  premiumTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    fontWeight: "600",
    color: mangiaColors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: mangiaColors.terracotta,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: mangiaColors.white,
  },
});

export default WhatCanIMakeScreen;
