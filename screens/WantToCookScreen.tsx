// screens/WantToCookScreen.tsx
// Home screen showing the "Want to Cook" recipe queue

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Button, FAB } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { Screen } from "../components/Screen";
import { RecipeQueueCard } from "../components/RecipeQueueCard";
import { useTheme } from "../theme";
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
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
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
      marginTop: spacing.lg,
      color: colors.textSecondary,
      ...typography.styles.body,
    },
    listContent: {
      paddingTop: spacing.sm,
      paddingBottom: 140,
    },
    emptyList: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      padding: spacing.xxxl,
    },
    emptyTitle: {
      ...typography.styles.title2,
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    emptySubtitle: {
      ...typography.styles.body,
      color: colors.textSecondary,
      textAlign: "center" as const,
      marginBottom: spacing.xl,
      lineHeight: 22,
    },
    emptyButton: {
      paddingHorizontal: spacing.lg,
    },
    bottomButtonContainer: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.lg,
      backgroundColor: isDark
        ? 'rgba(26, 26, 26, 0.95)'
        : 'rgba(253, 246, 240, 0.95)',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    groceryButton: {
      borderRadius: borderRadius.md,
    },
    groceryButtonContent: {
      paddingVertical: spacing.sm,
    },
    fab: {
      position: "absolute" as const,
      right: spacing.lg,
      bottom: 90,
      backgroundColor: colors.primary,
    },
  }), [colors, spacing, borderRadius, typography, isDark]);

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
  const renderEmptyState = useCallback(() => (
    <Animated.View entering={FadeIn.duration(400)} style={dynamicStyles.emptyContainer}>
      <MaterialCommunityIcons
        name="chef-hat"
        size={80}
        color={colors.textTertiary}
      />
      <Text style={dynamicStyles.emptyTitle}>No recipes yet</Text>
      <Text style={dynamicStyles.emptySubtitle}>
        Import a recipe from TikTok, YouTube, or your favorite blog
      </Text>
      <Button
        mode="contained"
        onPress={handleAddRecipe}
        style={dynamicStyles.emptyButton}
        icon="plus"
      >
        Add Your First Recipe
      </Button>
    </Animated.View>
  ), [dynamicStyles, colors.textTertiary, handleAddRecipe]);

  // Render list item with animation
  const renderItem = useCallback(({ item, index }: { item: RecipeWithIngredients; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(300)}>
      <RecipeQueueCard
        recipe={item}
        onPress={handleRecipePress}
        onMarkCooked={handleMarkCooked}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
    </Animated.View>
  ), [handleRecipePress, handleMarkCooked, handleArchive, handleDelete]);

  // Render loading state
  if (isLoading) {
    return (
      <Screen style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>Loading recipes...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={dynamicStyles.container}>
      {/* Recipe List */}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          dynamicStyles.listContent,
          recipes.length === 0 && dynamicStyles.emptyList,
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
        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={dynamicStyles.bottomButtonContainer}>
          <Button
            mode="contained"
            onPress={handleGenerateGroceryList}
            style={dynamicStyles.groceryButton}
            contentStyle={dynamicStyles.groceryButtonContent}
            icon="cart"
          >
            Generate Grocery List ({recipes.length} recipe
            {recipes.length !== 1 ? "s" : ""})
          </Button>
        </Animated.View>
      )}

      {/* FAB for adding recipes */}
      {recipes.length > 0 && (
        <FAB
          icon="plus"
          style={dynamicStyles.fab}
          onPress={handleAddRecipe}
          color={colors.textOnPrimary}
        />
      )}
    </Screen>
  );
};

export default WantToCookScreen;
