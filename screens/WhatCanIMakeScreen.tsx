import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  Chip,
  IconButton,
  SegmentedButtons,
  Surface,
  ProgressBar,
  Divider,
  Button,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { RecipeMatch, findRecipeMatches } from "../lib/whatCanIMake";
import { usePremiumFeature } from "../hooks/usePremiumFeature";

type RootStackParamList = {
  RecipeDetailScreen: { recipeId: string };
  SubscriptionScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

type FilterMode = "all" | "complete" | "almost";

export const WhatCanIMakeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isPremium, requirePremium } = usePremiumFeature();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matches, setMatches] = useState<RecipeMatch[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check premium access on mount
  useEffect(() => {
    if (!isPremium) {
      // Show paywall and don't load data
      requirePremium("what_can_i_make");
    }
  }, [isPremium, requirePremium]);

  // Load recipe matches
  const loadMatches = useCallback(async () => {
    if (!isPremium) return;

    try {
      setError(null);
      // Get all recipes with any match (0% threshold)
      const results = await findRecipeMatches(0);
      // Only show recipes with at least some matches
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

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMatches();
  }, [loadMatches]);

  // Filter matches based on mode
  const filteredMatches = matches.filter((match) => {
    switch (filterMode) {
      case "complete":
        return match.isCompleteMatch;
      case "almost":
        return !match.isCompleteMatch && match.matchPercentage >= 50;
      default:
        return true;
    }
  });

  // Navigate to recipe detail
  const handleRecipePress = (recipeId: string) => {
    navigation.navigate("RecipeDetailScreen", { recipeId });
  };

  // Toggle expanded state for a recipe
  const toggleExpanded = (recipeId: string) => {
    setExpandedRecipeId((prev) => (prev === recipeId ? null : recipeId));
  };

  // Get color based on match percentage
  const getMatchColor = (percentage: number): string => {
    if (percentage === 100) return colors.success;
    if (percentage >= 80) return "#8BC34A"; // Light green
    if (percentage >= 50) return colors.warning;
    return colors.error;
  };

  // Render a single recipe match card
  const renderMatchCard = ({ item }: { item: RecipeMatch }) => {
    const isExpanded = expandedRecipeId === item.recipe.id;
    const matchColor = getMatchColor(item.matchPercentage);

    return (
      <Surface style={styles.card} elevation={1}>
        <TouchableOpacity
          onPress={() => handleRecipePress(item.recipe.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            {/* Recipe image or placeholder */}
            {item.recipe.image_url ? (
              <Image
                source={{ uri: item.recipe.image_url }}
                style={styles.recipeImage}
              />
            ) : (
              <View style={[styles.recipeImage, styles.imagePlaceholder]}>
                <MaterialCommunityIcons
                  name="food"
                  size={32}
                  color={colors.textSecondary}
                />
              </View>
            )}

            <View style={styles.cardContent}>
              <Text style={styles.recipeTitle} numberOfLines={2}>
                {item.recipe.title}
              </Text>

              {/* Match percentage indicator */}
              <View style={styles.matchInfo}>
                <View style={styles.matchBadge}>
                  <Text style={[styles.matchPercentage, { color: matchColor }]}>
                    {item.matchPercentage}%
                  </Text>
                  <Text style={styles.matchLabel}>
                    {item.isCompleteMatch
                      ? "Ready to cook!"
                      : `${item.haveIngredients.length}/${item.totalIngredients} ingredients`}
                  </Text>
                </View>

                {item.isCompleteMatch && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={colors.success}
                  />
                )}
              </View>

              {/* Progress bar */}
              <ProgressBar
                progress={item.matchPercentage / 100}
                color={matchColor}
                style={styles.progressBar}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Expand/collapse button for ingredients */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => toggleExpanded(item.recipe.id)}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? "Hide details" : "Show ingredients"}
          </Text>
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>

        {/* Expanded ingredient details */}
        {isExpanded && (
          <View style={styles.ingredientDetails}>
            <Divider style={styles.divider} />

            {/* Ingredients you have */}
            {item.haveIngredients.length > 0 && (
              <View style={styles.ingredientSection}>
                <Text style={styles.ingredientSectionTitle}>
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={colors.success}
                  />{" "}
                  You have ({item.haveIngredients.length})
                </Text>
                <View style={styles.chipContainer}>
                  {item.haveIngredients.map((ing, index) => (
                    <Chip
                      key={index}
                      style={styles.haveChip}
                      textStyle={styles.chipText}
                      icon="check"
                    >
                      {ing.recipeIngredient.name}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Missing ingredients */}
            {item.missingIngredients.length > 0 && (
              <View style={styles.ingredientSection}>
                <Text style={styles.ingredientSectionTitle}>
                  <MaterialCommunityIcons
                    name="cart-plus"
                    size={16}
                    color={colors.warning}
                  />{" "}
                  Need to buy ({item.missingIngredients.length})
                </Text>
                <View style={styles.chipContainer}>
                  {item.missingIngredients.map((ing, index) => (
                    <Chip
                      key={index}
                      style={styles.missingChip}
                      textStyle={styles.chipText}
                      icon="cart"
                    >
                      {ing.name}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </Surface>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    const message =
      filterMode === "complete"
        ? "No recipes can be made completely with your current pantry."
        : filterMode === "almost"
          ? "No recipes found that match at least 50% of your pantry."
          : "No recipe matches found. Try adding more items to your pantry!";

    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons
          name="chef-hat"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyTitle}>No Matches Found</Text>
        <Text style={styles.emptySubtitle}>{message}</Text>
        {filterMode !== "all" && (
          <Button
            mode="outlined"
            onPress={() => setFilterMode("all")}
            style={styles.resetButton}
          >
            Show All Matches
          </Button>
        )}
      </View>
    );
  };

  // Summary stats
  const completeCount = matches.filter((m) => m.isCompleteMatch).length;
  const almostCount = matches.filter(
    (m) => !m.isCompleteMatch && m.matchPercentage >= 50
  ).length;

  // Premium gate - show paywall prompt
  if (!isPremium) {
    return (
      <View style={styles.premiumGate}>
        <MaterialCommunityIcons
          name="lock"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.premiumTitle}>Premium Feature</Text>
        <Text style={styles.premiumSubtitle}>
          Upgrade to Premium to discover which recipes you can make with
          ingredients you already have!
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("SubscriptionScreen")}
          style={styles.upgradeButton}
          icon="crown"
        >
          Upgrade to Premium
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: colors.success }]}>
            {completeCount}
          </Text>
          <Text style={styles.summaryLabel}>Ready</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: colors.warning }]}>
            {almostCount}
          </Text>
          <Text style={styles.summaryLabel}>Almost</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: colors.textSecondary }]}>
            {matches.length}
          </Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <SegmentedButtons
        value={filterMode}
        onValueChange={(value) => setFilterMode(value as FilterMode)}
        buttons={[
          { value: "all", label: "All" },
          { value: "complete", label: "Ready", icon: "check-circle" },
          { value: "almost", label: "Almost", icon: "clock-outline" },
        ]}
        style={styles.filterTabs}
      />

      {/* Error state */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={loadMatches}>Retry</Button>
        </View>
      )}

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Matching recipes to your pantry...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={renderMatchCard}
          keyExtractor={(item) => item.recipe.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: "space-around",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  filterTabs: {
    margin: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    padding: 12,
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  matchInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  matchPercentage: {
    fontSize: 20,
    fontWeight: "bold",
  },
  matchLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expandButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  ingredientDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  divider: {
    marginBottom: 12,
  },
  ingredientSection: {
    marginBottom: 12,
  },
  ingredientSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  haveChip: {
    backgroundColor: `${colors.success}20`,
  },
  missingChip: {
    backgroundColor: `${colors.warning}20`,
  },
  chipText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  resetButton: {
    marginTop: 16,
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
  },
  errorText: {
    color: colors.error,
    marginBottom: 8,
    textAlign: "center",
  },
  premiumGate: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 16,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 24,
  },
  upgradeButton: {
    paddingHorizontal: 24,
  },
});

export default WhatCanIMakeScreen;
