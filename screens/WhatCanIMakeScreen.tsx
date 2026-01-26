import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
  Surface,
  ProgressBar,
  Divider,
  Button,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { useTheme } from "../theme";
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
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matches, setMatches] = useState<RecipeMatch[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check premium access on mount
  useEffect(() => {
    if (!isPremium) {
      requirePremium("what_can_i_make");
    }
  }, [isPremium, requirePremium]);

  // Load recipe matches
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

  const handleRecipePress = (recipeId: string) => {
    navigation.navigate("RecipeDetailScreen", { recipeId });
  };

  const toggleExpanded = (recipeId: string) => {
    setExpandedRecipeId((prev) => (prev === recipeId ? null : recipeId));
  };

  const getMatchColor = useCallback(
    (percentage: number): string => {
      if (percentage === 100) return colors.success;
      if (percentage >= 80) return "#8BC34A";
      if (percentage >= 50) return colors.warning;
      return colors.error;
    },
    [colors]
  );

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      summaryBar: {
        flexDirection: "row" as const,
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        justifyContent: "space-around" as const,
        alignItems: "center" as const,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      summaryItem: {
        alignItems: "center" as const,
      },
      summaryCount: {
        fontSize: 24,
        fontWeight: "bold" as const,
      },
      summaryLabel: {
        ...typography.styles.caption1,
        color: colors.textSecondary,
        marginTop: spacing.xs,
      },
      summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: colors.border,
      },
      filterTabs: {
        margin: spacing.md,
      },
      listContent: {
        padding: spacing.md,
        paddingTop: 0,
      },
      card: {
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        backgroundColor: colors.surface,
        overflow: "hidden" as const,
      },
      cardHeader: {
        flexDirection: "row" as const,
        padding: spacing.md,
      },
      recipeImage: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.border,
      },
      imagePlaceholder: {
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
      cardContent: {
        flex: 1,
        marginLeft: spacing.md,
        justifyContent: "center" as const,
      },
      recipeTitle: {
        ...typography.styles.body,
        fontWeight: "600" as const,
        color: colors.text,
        marginBottom: spacing.xs,
      },
      matchInfo: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
        marginBottom: spacing.sm,
      },
      matchBadge: {
        flexDirection: "row" as const,
        alignItems: "baseline" as const,
        gap: spacing.sm,
      },
      matchPercentage: {
        fontSize: 20,
        fontWeight: "bold" as const,
      },
      matchLabel: {
        ...typography.styles.caption1,
        color: colors.textSecondary,
      },
      progressBar: {
        height: 6,
        borderRadius: 3,
      },
      expandButton: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      },
      expandButtonText: {
        ...typography.styles.body,
        color: colors.primary,
        marginRight: spacing.xs,
      },
      ingredientDetails: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
      },
      divider: {
        marginBottom: spacing.md,
      },
      ingredientSection: {
        marginBottom: spacing.md,
      },
      ingredientSectionTitle: {
        ...typography.styles.subheadline,
        fontWeight: "600" as const,
        color: colors.text,
        marginBottom: spacing.sm,
      },
      chipContainer: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        gap: spacing.sm,
      },
      haveChip: {
        backgroundColor: `${colors.success}20`,
      },
      missingChip: {
        backgroundColor: `${colors.warning}20`,
      },
      chipText: {
        ...typography.styles.caption1,
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
      emptyState: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingVertical: spacing.xxxl,
        paddingHorizontal: spacing.xxl,
      },
      emptyTitle: {
        ...typography.styles.title3,
        color: colors.text,
        marginTop: spacing.md,
      },
      emptySubtitle: {
        ...typography.styles.body,
        color: colors.textSecondary,
        textAlign: "center" as const,
        marginTop: spacing.sm,
        lineHeight: 20,
      },
      resetButton: {
        marginTop: spacing.md,
      },
      errorContainer: {
        padding: spacing.md,
        alignItems: "center" as const,
      },
      errorText: {
        color: colors.error,
        marginBottom: spacing.sm,
        textAlign: "center" as const,
        ...typography.styles.body,
      },
      premiumGate: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        padding: spacing.xxl,
      },
      premiumTitle: {
        ...typography.styles.title1,
        color: colors.text,
        marginTop: spacing.md,
      },
      premiumSubtitle: {
        ...typography.styles.body,
        color: colors.textSecondary,
        textAlign: "center" as const,
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
        lineHeight: 24,
      },
      upgradeButton: {
        paddingHorizontal: spacing.xl,
      },
    }),
    [colors, spacing, borderRadius, typography]
  );

  const renderMatchCard = useCallback(
    ({ item, index }: { item: RecipeMatch; index: number }) => {
      const isExpanded = expandedRecipeId === item.recipe.id;
      const matchColor = getMatchColor(item.matchPercentage);

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
          <Surface style={styles.card} elevation={1}>
            <TouchableOpacity
              onPress={() => handleRecipePress(item.recipe.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
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

                  <ProgressBar
                    progress={item.matchPercentage / 100}
                    color={matchColor}
                    style={styles.progressBar}
                  />
                </View>
              </View>
            </TouchableOpacity>

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

            {isExpanded && (
              <View style={styles.ingredientDetails}>
                <Divider style={styles.divider} />

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
                      {item.haveIngredients.map((ing, idx) => (
                        <Chip
                          key={idx}
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
                      {item.missingIngredients.map((ing, idx) => (
                        <Chip
                          key={idx}
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
        </Animated.View>
      );
    },
    [expandedRecipeId, getMatchColor, styles, colors]
  );

  const renderEmptyState = () => {
    if (isLoading) return null;

    const message =
      filterMode === "complete"
        ? "No recipes can be made completely with your current pantry."
        : filterMode === "almost"
          ? "No recipes found that match at least 50% of your pantry."
          : "No recipe matches found. Try adding more items to your pantry!";

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
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
      </Animated.View>
    );
  };

  const completeCount = matches.filter((m) => m.isCompleteMatch).length;
  const almostCount = matches.filter(
    (m) => !m.isCompleteMatch && m.matchPercentage >= 50
  ).length;

  if (!isPremium) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.premiumGate}>
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
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.summaryBar}>
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
      </Animated.View>

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

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={loadMatches}>Retry</Button>
        </View>
      )}

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
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

export default WhatCanIMakeScreen;
