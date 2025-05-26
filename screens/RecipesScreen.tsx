import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FAB } from "react-native-paper";
import { fetchRecipes } from "../lib/recipes";
import { Recipe } from "../models/Recipe";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import { RecipeList } from "../components/RecipeList";
import { RecipeLibraryStackParamList } from "../navigation/RecipeLibraryStack";

export const RecipesScreen = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RecipeLibraryStackParamList, "RecipesScreen">
    >();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecipes = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await fetchRecipes();
      setRecipes(data);
    } catch (err) {
      console.error("Failed to load recipes:", err);
      setError("Failed to load recipes. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecipes(false);
  };

  const handlePressRecipe = (recipe: Recipe) => {
    if (!recipe.id) {
      console.warn('Recipe has no ID, cannot navigate to detail');
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
    loadRecipes();
  }, []);

  return (
    <Screen>
      <View style={styles.container}>
        <RecipeList
          recipes={recipes}
          loading={loading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onPressRecipe={handlePressRecipe}
          numColumns={2}
          showMealType={true}
          ListEmptyComponent={
            error ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => loadRecipes()}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recipes found</Text>
                <Text style={styles.emptySubtext}>
                  Add a new recipe to get started
                </Text>
              </View>
            )
          }
        />
        <View style={styles.fabContainer}>
          <FAB
            icon="book-search"
            style={[styles.fab, styles.fabLeft]}
            onPress={handleBrowseCatalog}
            color={colors.white}
          />
          <FAB
            icon="plus"
            style={[styles.fab, styles.fabRight]}
            onPress={handleAddRecipe}
            color={colors.white}
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  fabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    zIndex: 1,
  },
  fab: {
    backgroundColor: colors.primary,
  },
  fabLeft: {
    alignSelf: 'flex-start',
  },
  fabRight: {
    alignSelf: 'flex-end',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: colors.error,
    marginBottom: 10,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
