// screens/WantToCookScreen.tsx
// Home screen showing the "Want to Cook" recipe queue

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Button, FAB } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { RecipeQueueCard } from "../components/RecipeQueueCard";
import { colors } from "../theme/colors";
import { Recipe } from "../models/Recipe";
import {
  fetchRecipesByStatus,
  markAsCooked,
  archiveRecipe,
  deleteRecipe,
  RecipeWithIngredients,
} from "../lib/recipeService";

type RootStackParamList = {
  ImportRecipeScreen: undefined;
  RecipeDetailScreen: { recipeId: string };
  GroceryListScreen: { recipeIds: string[] };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const WantToCookScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load recipes with status = 'want_to_cook'
  const loadRecipes = useCallback(async () => {
    try {
      const data = await fetchRecipesByStatus("want_to_cook");
      setRecipes(data);
    } catch (error) {
      console.error("Error loading recipes:", error);
      Alert.alert("Error", "Failed to load recipes");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Handle pull to refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadRecipes();
  }, [loadRecipes]);

  // Navigate to recipe detail
  const handleRecipePress = useCallback(
    (recipe: Recipe) => {
      navigation.navigate("RecipeDetailScreen", { recipeId: recipe.id });
    },
    [navigation],
  );

  // Mark recipe as cooked
  const handleMarkCooked = useCallback(async (recipe: Recipe) => {
    Alert.alert("Mark as Cooked", `Did you make "${recipe.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, I made it!",
        onPress: async () => {
          try {
            await markAsCooked(recipe.id);
            setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
            // TODO: Show celebration animation
          } catch (error) {
            Alert.alert("Error", "Failed to update recipe");
          }
        },
      },
    ]);
  }, []);

  // Archive recipe
  const handleArchive = useCallback(async (recipe: Recipe) => {
    try {
      await archiveRecipe(recipe.id);
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    } catch (error) {
      Alert.alert("Error", "Failed to archive recipe");
    }
  }, []);

  // Delete recipe
  const handleDelete = useCallback((recipe: Recipe) => {
    Alert.alert(
      "Delete Recipe",
      `Are you sure you want to delete "${recipe.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecipe(recipe.id);
              setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
            } catch (error) {
              Alert.alert("Error", "Failed to delete recipe");
            }
          },
        },
      ],
    );
  }, []);

  // Navigate to add recipe
  const handleAddRecipe = useCallback(() => {
    navigation.navigate("ImportRecipeScreen");
  }, [navigation]);

  // Generate grocery list from queued recipes
  const handleGenerateGroceryList = useCallback(() => {
    if (recipes.length === 0) {
      Alert.alert("No Recipes", "Add some recipes to your queue first!");
      return;
    }

    const recipeIds = recipes.map((r) => r.id);
    navigation.navigate("GroceryListScreen", { recipeIds });
  }, [recipes, navigation]);

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="chef-hat"
        size={80}
        color={colors.textTertiary}
      />
      <Text style={styles.emptyTitle}>No recipes yet</Text>
      <Text style={styles.emptySubtitle}>
        Import a recipe from TikTok, YouTube, or your favorite blog
      </Text>
      <Button
        mode="contained"
        onPress={handleAddRecipe}
        style={styles.emptyButton}
        icon="plus"
      >
        Add Your First Recipe
      </Button>
    </View>
  );

  // Render loading state
  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {/* Recipe List */}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeQueueCard
            recipe={item}
            onPress={handleRecipePress}
            onMarkCooked={handleMarkCooked}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          recipes.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Generate Grocery List Button */}
      {recipes.length > 0 && (
        <View style={styles.bottomButtonContainer}>
          <Button
            mode="contained"
            onPress={handleGenerateGroceryList}
            style={styles.groceryButton}
            contentStyle={styles.groceryButtonContent}
            icon="cart"
          >
            Generate Grocery List ({recipes.length} recipe
            {recipes.length !== 1 ? "s" : ""})
          </Button>
        </View>
      )}

      {/* FAB for adding recipes */}
      {recipes.length > 0 && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddRecipe}
          color={colors.white}
        />
      )}
    </Screen>
  );
};

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
  listContent: {
    paddingTop: 8,
    paddingBottom: 140, // Space for bottom button + FAB
  },
  emptyList: {
    flex: 1,
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
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 16,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(253, 246, 240, 0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  groceryButton: {
    borderRadius: 8,
  },
  groceryButtonContent: {
    paddingVertical: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 90, // Above the grocery button
    backgroundColor: colors.primary,
  },
});

export default WantToCookScreen;
