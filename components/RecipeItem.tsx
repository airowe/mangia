import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Recipe } from "../models/Recipe";
import { colors } from "../theme/colors";

interface RecipeItemProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  showMealType?: boolean;
  isSelected?: boolean;
}

export const RecipeItem: React.FC<RecipeItemProps> = ({
  recipe,
  onPress,
  showMealType = true,
  isSelected = false,
}) => {
  const imageurl = recipe.image_url;

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={() => onPress(recipe)}
      activeOpacity={0.7}
    >
      {imageurl ? (
        <Image
          source={{ uri: imageurl }}
          style={styles.recipeImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Image
            source={{ uri: "https://loremflickr.com/320/240" }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
        </View>
      )}
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
        {recipe.description && (
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}
        {(recipe.cook_time || recipe.servings) && (
          <Text style={styles.recipeMeta}>
            {recipe.cook_time && `${recipe.cook_time} min`}
            {recipe.cook_time && recipe.servings && " • "}
            {recipe.servings && `${recipe.servings} servings`}
            {showMealType && recipe.meal_type && ` • ${recipe.meal_type}`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  recipeImage: {
    width: "100%",
    height: 160,
  },
  placeholderImage: {
    width: "100%",
    height: 160,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  recipeMeta: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});
