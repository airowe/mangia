import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Recipe } from '../models/Recipe';
import { colors } from '../theme/colors';

interface RecipeItemProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  showMealType?: boolean;
}

export const RecipeItem = ({ recipe, onPress, showMealType = false }: RecipeItemProps) => {
  const imageUrl = recipe.image_url;
  
  return (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => onPress(recipe)}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.recipeImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>No Image</Text>
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
            {recipe.cook_time && recipe.servings && ' • '}
            {recipe.servings && `${recipe.servings} servings`}
            {showMealType && recipe.meal_type && ` • ${recipe.meal_type}`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  recipeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: '100%',
    height: 160,
  },
  placeholderImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
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