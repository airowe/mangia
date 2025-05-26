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
  const imageUrl = recipe.image_url || recipe.image;
  
  return (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={() => onPress(recipe)}
    >
      <View style={styles.recipeImageContainer}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.recipeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.recipeImage, styles.recipeImagePlaceholder]}>
            <Text style={styles.recipeImagePlaceholderText}>
              {(recipe.name ?? recipe.title).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={1}>
          {recipe.name ?? recipe.title}
        </Text>
        {showMealType && recipe.meal_type && (
          <Text style={styles.mealType}>
            {recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1)}
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
  recipeImageContainer: {
    aspectRatio: 1,
    backgroundColor: colors.background,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeImagePlaceholder: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeImagePlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  mealType: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
});