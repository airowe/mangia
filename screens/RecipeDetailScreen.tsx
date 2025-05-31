import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { fetchRecipeById } from "../lib/recipes";
import { Recipe } from "../models/Recipe";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

type RecipeDetailScreenRouteProp = RouteProp<
  { params: { id: string } },
  "params"
>;

export default function RecipeDetailScreen() {
  const route = useRoute<RecipeDetailScreenRouteProp>();
  const { id } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecipe = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchRecipeById(id);
      setRecipe(data);
    } catch (err) {
      console.error("Failed to load recipe:", err);
      setError("Failed to load recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this recipe: ${recipe?.title}\n\n${recipe?.description}`,
        title: recipe?.title,
      });
    } catch (error) {
      console.error("Error sharing recipe:", error);
    }
  };

  const openSourceLink = () => {
    if (recipe?.source) {
      Linking.openURL(recipe.source);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !recipe) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Recipe not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRecipe}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen noPadding>
      <ScrollView style={styles.container}>
        <Image
          source={{ uri: recipe.image_url }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Ionicons
                name="share-social-outline"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          <View style={styles.metaContainer}>
            {(recipe.cook_time || 0) > 0 && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>{recipe.cook_time} min</Text>
              </View>
            )}
            {(recipe.servings || 0) > 0 && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            )}
          </View>

          {recipe.source && (
            <TouchableOpacity
              onPress={openSourceLink}
              style={styles.sourceButton}
            >
              <Text style={styles.sourceText}>View Original Recipe</Text>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.ingredientText}>
                  {ing.quantity ? `${ing.quantity} ${ing.unit || ""} ` : ""}
                  {ing.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.instructionsContainer}>
            {recipe.instructions ? (
              <Text style={styles.instructionsText}>{recipe.instructions}</Text>
            ) : (
              <Text style={styles.noInstructions}>
                No instructions provided.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  image: {
    width: "100%",
    height: 250,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  shareButton: {
    padding: 8,
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 8,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
  },
  sourceText: {
    color: colors.primary,
    fontSize: 14,
    marginRight: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  ingredientsList: {
    marginLeft: 4,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  instructionsContainer: {
    marginLeft: 4,
  },
  instructionsText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  noInstructions: {
    fontStyle: "italic",
    color: colors.textSecondary,
  },
  footer: {
    height: 40,
  },
});
