import React, { useEffect, useState, useCallback } from "react";
import { Button } from "react-native-paper";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FAB } from "react-native-paper";
import { fetchRecipes, recipeApi } from "../lib/recipes";
import { Recipe } from "../models/Recipe";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import { RecipeList } from "../components/RecipeList";
import { RecipeLibraryStackParamList } from "../navigation/RecipeLibraryStack";
import { getCurrentUser } from "../lib/auth";

interface RecipeSectionProps {
  title: string;
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPressRecipe: (recipe: Recipe) => void;
}

const RecipeSection: React.FC<RecipeSectionProps> = ({
  title,
  recipes,
  loading,
  error,
  onRetry,
  onPressRecipe,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {loading && recipes.length === 0 ? (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    ) : error ? (
      <View style={styles.emptyContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    ) : recipes.length === 0 ? (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No recipes found</Text>
      </View>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {recipes.map((recipe) => (
          <View key={recipe.id} style={styles.recipeCard}>
            <RecipeList
              recipes={[recipe]}
              onPressRecipe={onPressRecipe}
              numColumns={1}
              style={styles.recipeList}
            />
          </View>
        ))}
      </ScrollView>
    )}
  </View>
);

type RecipesScreenNavigationProp = NativeStackNavigationProp<RecipeLibraryStackParamList, 'RecipesScreen'>;

export const RecipesScreen = () => {
  const user = getCurrentUser();
  const navigation = useNavigation<RecipesScreenNavigationProp>();

  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState({
    user: true,
    all: true,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState({
    user: null as string | null,
    all: null as string | null,
  });

  const loadUserRecipes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading((prev) => ({ ...prev, user: true }));
      setError((prev) => ({ ...prev, user: null }));
      const data = await recipeApi.getUserRecipes();
      setUserRecipes(data);
    } catch (err) {
      console.error("Failed to load user recipes:", err);
      setError((prev) => ({
        ...prev,
        user: "Failed to load your recipes. Please try again.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, user: false }));
    }
  }, []);

  const loadAllRecipes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading((prev) => ({ ...prev, all: true }));
      setError((prev) => ({ ...prev, all: null }));
      const data = await fetchRecipes();
      setAllRecipes(data);
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
  }, [fetchRecipes]); // Add fetchRecipes to dependencies if it's defined outside the component

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserRecipes(false);
    loadAllRecipes(false);
  };

  const handlePressRecipe = (recipe: Recipe) => {
    if (!recipe.id) {
      console.warn("Recipe has no ID, cannot navigate to detail");
      return;
    }
    navigation.navigate("RecipeDetail", { id: recipe.id });
  };

  const handleAddRecipe = useCallback(() => {
    navigation.navigate("RecipeCreate");
  }, [navigation]);

  const handleBrowseCatalog = useCallback(() => {
    navigation.navigate("RecipeCatalog");
  }, [navigation]);

  useEffect(() => {
    loadUserRecipes();
    loadAllRecipes();
  }, [loadUserRecipes, loadAllRecipes]); // These are now stable due to useCallback

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <RecipeSection
          title="Your Recipes"
          recipes={userRecipes}
          loading={loading.user}
          error={error.user}
          onRetry={loadUserRecipes}
          onPressRecipe={handlePressRecipe}
        />

        <RecipeSection
          title="All Recipes"
          recipes={allRecipes}
          loading={loading.all}
          error={error.all}
          onRetry={loadAllRecipes}
          onPressRecipe={handlePressRecipe}
        />
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleBrowseCatalog}
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
    position: "relative",
    paddingBottom: 80, // Add padding to account for FABs
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 16,
    color: colors.text,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  recipeCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeList: {
    padding: 0,
    margin: 0,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    height: 48,
    justifyContent: 'center',
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
