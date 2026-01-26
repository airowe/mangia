import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "react-native-paper";
import { View, ScrollView, RefreshControl, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { fetchAllRecipes, fetchRecipes } from "../lib/recipes";
import { Recipe } from "../models/Recipe";
import { Screen } from "../components/Screen";
import { useTheme } from "../theme";
import { RecipeItem } from "../components/RecipeItem";
import { RecipeList as RecipeListComponent } from '../components/RecipeList';
import { FeaturedRecipeCard } from '../components/editorial';
import { RecipeLibraryStackParamList } from "../navigation/RecipeLibraryStack";

type RecipesScreenNavigationProp = NativeStackNavigationProp<
  RecipeLibraryStackParamList,
  "RecipesScreen"
>;

export const RecipesScreen = () => {
  const navigation = useNavigation<RecipesScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [userRecipesPagination, setUserRecipesPagination] = useState({
    page: 1,
    limit: 10,
    hasMore: true,
    isFetching: false,
  });

  const [allRecipesPagination, setAllRecipesPagination] = useState({
    page: 1,
    limit: 10,
    hasMore: true,
    isFetching: false,
  });
  const [loading, setLoading] = useState({
    all: false,
    user: false,
  });
  const [error, setError] = useState({
    user: null as string | null,
    all: null as string | null,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Get featured recipe (first one with an image, or just first one)
  const featuredRecipe = useMemo(() => {
    const withImage = userRecipes.find(r => r.image_url);
    return withImage || userRecipes[0];
  }, [userRecipes]);

  // Remaining recipes (excluding featured)
  const remainingRecipes = useMemo(() => {
    if (!featuredRecipe) return userRecipes;
    return userRecipes.filter(r => r.id !== featuredRecipe.id);
  }, [userRecipes, featuredRecipe]);

  // Dynamic styles based on theme - Editorial magazine design
  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Featured hero section
    featuredSection: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    featuredLabel: {
      ...typography.editorialStyles.byline,
      color: colors.primary,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    // Section styling
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.editorialStyles.sectionHeading,
      color: colors.text,
    },
    viewAllButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    viewAllText: {
      ...typography.editorialStyles.byline,
      color: colors.primary,
    },
    recipesContainer: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      minHeight: 200,
    },
    recipeCard: {
      width: 200,
      marginHorizontal: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 3,
      marginBottom: spacing.lg,
    },
    loadingMore: {
      padding: spacing.lg,
      alignItems: "center" as const,
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      gap: spacing.sm,
    },
    loadingText: {
      color: colors.textSecondary,
      ...typography.editorialStyles.byline,
    },
    endOfList: {
      color: colors.textSecondary,
      ...typography.editorialStyles.byline,
      textAlign: 'center' as const,
      paddingVertical: spacing.xl,
    },
    errorContainer: {
      padding: spacing.xl,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      margin: spacing.lg,
      borderWidth: 1,
      borderColor: colors.error,
    },
    errorText: {
      ...typography.editorialStyles.recipeBody,
      color: colors.error,
      marginBottom: spacing.md,
      textAlign: "center" as const,
    },
    retryButton: {
      marginTop: spacing.md,
      padding: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.full,
    },
    // Bottom action bar
    buttonContainer: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      padding: spacing.lg,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    button: {
      flex: 1,
      height: 48,
      justifyContent: "center" as const,
      borderRadius: borderRadius.full,
    },
    buttonLabel: {
      ...typography.editorialStyles.byline,
      fontWeight: "600" as const,
      marginVertical: 0,
      paddingVertical: 0,
      fontSize: 13,
    },
    containedButton: {
      backgroundColor: colors.primary,
      elevation: 0,
    },
    outlinedButton: {
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderWidth: 1,
      borderColor: colors.primary,
    },
  }), [colors, spacing, borderRadius, typography, isDark]);

  const loadUserRecipes = useCallback(async (showLoading = true, loadMore = false) => {
    try {
      if (showLoading) {
        setLoading((prev) => ({ ...prev, user: true }));
      } else {
        setUserRecipesPagination(prev => ({ ...prev, isFetching: true }));
      }

      setError((prev) => ({ ...prev, user: null }));

      const page = loadMore ? userRecipesPagination.page + 1 : 1;
      const response = await fetchRecipes({
        page,
        limit: userRecipesPagination.limit
      });

      setUserRecipes(prev =>
        loadMore ? [...prev, ...response.data] : response.data
      );

      setUserRecipesPagination(prev => ({
        ...prev,
        page,
        hasMore: response.page < response.totalPages,
        isFetching: false
      }));
    } catch (err) {
      console.error("Failed to load user recipes:", err);
      setError((prev) => ({
        ...prev,
        user: "Failed to load your recipes. Please try again.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, user: false }));
    }
  }, [userRecipesPagination.limit]);

  const loadAllRecipes = useCallback(
    async (showLoading = true, loadMore = false) => {
      try {
        if (showLoading) {
          setLoading((prev) => ({ ...prev, all: true }));
        } else {
          setAllRecipesPagination(prev => ({ ...prev, isFetching: true }));
        }

        setError((prev) => ({ ...prev, all: null }));

        const page = loadMore ? allRecipesPagination.page + 1 : 1;
        const response = await fetchAllRecipes({
          page,
          limit: allRecipesPagination.limit,
        });

        setAllRecipes((prev) =>
          loadMore ? [...prev, ...response.data] : response.data
        );

        setAllRecipesPagination(prev => ({
          ...prev,
          page,
          hasMore: response.page < response.totalPages,
          isFetching: false,
        }));
      } catch (err) {
        console.error("Failed to load all recipes:", err);
        setError((prev) => ({
          ...prev,
          all: "Failed to load recipes. Please try again.",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, all: false }));
        setRefreshing(false);
      }
    },
    [allRecipesPagination.limit]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setUserRecipesPagination((prev) => ({ ...prev, page: 1, hasMore: true }));
    setAllRecipesPagination((prev) => ({ ...prev, page: 1, hasMore: true }));
    loadUserRecipes(false);
    loadAllRecipes(false);
  };

  const handleLoadMoreUserRecipes = useCallback(() => {
    if (!userRecipesPagination.isFetching && userRecipesPagination.hasMore) {
      loadUserRecipes(false, true);
    }
  }, [userRecipesPagination.isFetching, userRecipesPagination.hasMore, loadUserRecipes]);

  const handleLoadMoreAllRecipes = useCallback(() => {
    if (!allRecipesPagination.isFetching && allRecipesPagination.hasMore) {
      loadAllRecipes(false, true);
    }
  }, [allRecipesPagination.isFetching, allRecipesPagination.hasMore, loadAllRecipes]);

  const isCloseToBottom = ({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }: {
    layoutMeasurement: { height: number };
    contentOffset: { y: number };
    contentSize: { height: number };
  }) => {
    const paddingToBottom = 20;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>, tabIndex: number) => {
    const nativeEvent = event.nativeEvent;
    if (isCloseToBottom(nativeEvent)) {
      if (tabIndex === 0 && !userRecipesPagination.isFetching && userRecipesPagination.hasMore) {
        handleLoadMoreUserRecipes();
      } else if (tabIndex === 1 && !allRecipesPagination.isFetching && allRecipesPagination.hasMore) {
        handleLoadMoreAllRecipes();
      }
    }
  }, [handleLoadMoreUserRecipes, handleLoadMoreAllRecipes, userRecipesPagination, allRecipesPagination]);

  const handlePressRecipe = useCallback((recipe: Recipe) => {
    if (!recipe.id) {
      console.warn("Recipe has no ID, cannot navigate to detail");
      return;
    }
    navigation.navigate("RecipeDetail", { id: recipe.id });
  }, [navigation]);

  const handleAddRecipe = useCallback(() => {
    navigation.navigate("RecipeCreate");
  }, [navigation]);

  const handleSearch = useCallback(() => {
    navigation.navigate("RecipeSearch");
  }, [navigation]);

  const handleCollections = useCallback(() => {
    navigation.navigate("Collections");
  }, [navigation]);

  useEffect(() => {
    const loadData = async () => {
      await loadUserRecipes();
      await loadAllRecipes();
    };
    loadData();
  }, []);

  return (
    <Screen>
      <ScrollView
        style={dynamicStyles.container}
        onScroll={(event) => handleScroll(event, 0)}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={!userRecipesPagination.isFetching}
      >
        {/* Featured Recipe Hero */}
        {featuredRecipe && !loading.user && (
          <Animated.View entering={FadeIn.duration(500)} style={dynamicStyles.featuredSection}>
            <Text style={dynamicStyles.featuredLabel}>FEATURED</Text>
            <FeaturedRecipeCard
              recipe={featuredRecipe}
              onPress={handlePressRecipe}
              variant="hero"
            />
          </Animated.View>
        )}

        {/* Your Recipes Section */}
        {remainingRecipes.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionTitle}>Your Recipes</Text>
            </View>
            <RecipeListComponent
              recipes={remainingRecipes}
              loading={loading.user}
              error={error.user}
              onRetry={loadUserRecipes}
              onPressRecipe={handlePressRecipe}
              hasMore={userRecipesPagination.hasMore}
              isFetching={userRecipesPagination.isFetching}
              onEndReached={handleLoadMoreUserRecipes}
              horizontal
            />
          </Animated.View>
        )}

        {/* All Recipes Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Discover</Text>
          </View>
          <RecipeListComponent
            recipes={allRecipes}
            loading={loading.all}
            error={error.all}
            onRetry={loadAllRecipes}
            onPressRecipe={handlePressRecipe}
            hasMore={allRecipesPagination.hasMore}
            isFetching={allRecipesPagination.isFetching}
            onEndReached={handleLoadMoreAllRecipes}
            horizontal
          />
        </Animated.View>

        {/* Loading indicator */}
        {allRecipesPagination.hasMore && allRecipesPagination.isFetching && (
          <View style={dynamicStyles.loadingMore}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={dynamicStyles.loadingText}>Loading more...</Text>
          </View>
        )}

        {/* End of list */}
        {!allRecipesPagination.hasMore && allRecipes.length > 0 && (
          <Text style={dynamicStyles.endOfList}>You've seen all recipes</Text>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={dynamicStyles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSearch}
          style={[dynamicStyles.button, dynamicStyles.containedButton]}
          labelStyle={[dynamicStyles.buttonLabel, { color: colors.textOnPrimary }]}
          theme={{ colors: { primary: colors.primary } }}
          icon="magnify"
          compact
        >
          Search
        </Button>
        <Button
          mode="outlined"
          onPress={handleCollections}
          style={[dynamicStyles.button, dynamicStyles.outlinedButton]}
          labelStyle={[dynamicStyles.buttonLabel, { color: colors.primary }]}
          theme={{ colors: { primary: colors.primary } }}
          icon="folder-multiple"
          compact
        >
          Collections
        </Button>
        <Button
          mode="outlined"
          onPress={handleAddRecipe}
          style={[dynamicStyles.button, dynamicStyles.outlinedButton]}
          labelStyle={[dynamicStyles.buttonLabel, { color: colors.primary }]}
          theme={{ colors: { primary: colors.primary } }}
          icon="plus"
          compact
        >
          Add
        </Button>
      </Animated.View>
    </Screen>
  );
};
