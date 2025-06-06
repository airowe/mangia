import React, { useEffect, useState, useCallback } from "react";
import { Button } from "react-native-paper";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { FAB } from "react-native-paper";
import { fetchAllRecipes, fetchRecipes } from "../lib/recipes";
import { PaginatedResponse } from "../lib/api/client";
import { Recipe } from "../models/Recipe";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import { RecipeItem } from "../components/RecipeItem";
import { RecipeList } from "../components/RecipeList";
import { RecipeLibraryStackParamList } from "../navigation/RecipeLibraryStack";
import { getCurrentUser } from "../lib/auth";

interface RecipeSectionProps {
  title: string;
  recipes: Recipe[];
  loading?: boolean;
  error: string | null;
  onRetry: () => void;
  onPressRecipe: (recipe: Recipe) => void;
  hasMore?: boolean;
  isFetching?: boolean;
  onLoadMore?: () => void;
}

const RecipeSection: React.FC<RecipeSectionProps> = ({
  title,
  recipes,
  loading = false,
  error,
  onRetry,
  onPressRecipe,
  hasMore = false,
  isFetching = false,
  onLoadMore,
}) => {
  // If no recipes and not loading, don't render anything
  if (recipes.length === 0 && !loading) {
    return null;
  }

  // If error, show error message with retry button
  if (error) {
    return (
      <View style={styles.section}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!hasMore && recipes.length > 0 && (
          <Text style={styles.endOfList}>End of list</Text>
        )}
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recipesContainer}
        onScrollEndDrag={({ nativeEvent }) => {
          if (onLoadMore && !isFetching && hasMore) {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToEnd =
              layoutMeasurement.width + contentOffset.x >=
              contentSize.width - 50; // 50px from the end
            
            if (isCloseToEnd) {
              onLoadMore();
            }
          }
        }}
        scrollEventThrottle={400}
      >
        {recipes.map((recipe) => (
          <View key={recipe.id} style={styles.recipeCard}>
            <RecipeItem 
              recipe={recipe}
              onPress={onPressRecipe}
              showMealType={true}
            />
          </View>
        ))}
        {isFetching && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading more...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

type RecipesScreenNavigationProp = NativeStackNavigationProp<
  RecipeLibraryStackParamList,
  "RecipesScreen"
>;



export const RecipesScreen = () => {
  const user = getCurrentUser();
  const navigation = useNavigation<RecipesScreenNavigationProp>();

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
    [fetchAllRecipes, allRecipesPagination.limit]
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

  useEffect(() => {
    const loadData = async () => {
      await loadUserRecipes();
      await loadAllRecipes();
    };
    loadData();
  }, []); // These are now stable due to useCallback

  return (
    <Screen>
      <ScrollView
        style={styles.container}
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
        <RecipeSection
          title="Your Recipes"
          recipes={userRecipes}
          loading={loading.user}
          error={error.user}
          onRetry={loadUserRecipes}
          onPressRecipe={handlePressRecipe}
          hasMore={userRecipesPagination.hasMore}
          isFetching={userRecipesPagination.isFetching}
          onLoadMore={handleLoadMoreUserRecipes}
        />
      </ScrollView>
      <ScrollView
        style={styles.container}
        onScroll={(event) => handleScroll(event, 1)}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={!allRecipesPagination.isFetching}
      >
        <RecipeSection
          title="All Recipes"
          recipes={allRecipes}
          loading={loading.all}
          error={error.all}
          onRetry={loadAllRecipes}
          onPressRecipe={handlePressRecipe}
          hasMore={allRecipesPagination.hasMore}
          isFetching={allRecipesPagination.isFetching}
          onLoadMore={handleLoadMoreAllRecipes}
        />
        {allRecipesPagination.hasMore && allRecipesPagination.isFetching && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        {!allRecipesPagination.hasMore && (
          <Text style={styles.endOfList}>End of list</Text>
        )}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSearch}
          style={[styles.button, styles.containedButton]}
          labelStyle={[styles.buttonLabel, { color: "white" }]}
          theme={{ colors: { primary: colors.primary } }}
          icon="book-search"
        >
          Browse Catalog
        </Button>
        <Button
          mode="outlined"
          onPress={handleAddRecipe}
          style={[styles.button, styles.outlinedButton]}
          labelStyle={[styles.buttonLabel, { color: colors.primary }]}
          theme={{ colors: { primary: colors.primary } }}
          icon="plus"
        >
          Add Recipe
        </Button>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  recipesContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    minHeight: 200, // Ensure there's enough space for the loading indicator
  },
  recipeCard: {
    width: 200,
    marginHorizontal: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  recipeList: {
    padding: 0,
    margin: 0,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingMore: {
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  loadMoreButton: {
    display: 'none', // Hide load more button since we're using infinite scroll
  },
  loadMoreText: {
    color: colors.primary,
    fontWeight: "500",
  },
  loadingText: {
    color: colors.textSecondary,
  },
  endOfList: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  retryButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    height: 48,
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 0,
    paddingVertical: 0,
    height: 20,
    lineHeight: 20,
  },
  containedButton: {
    backgroundColor: colors.primary,
    elevation: 0,
  },
  outlinedButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
