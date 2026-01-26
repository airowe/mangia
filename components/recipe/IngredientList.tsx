/**
 * IngredientList Component
 *
 * Editorial ingredient list with sage-bordered checkboxes.
 * Supports scaling display and checked state.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { mangiaColors } from '../../theme/tokens/colors';
import { RecipeIngredient } from '../../models/Recipe';
import { getScaledIngredientDisplay } from '../../utils/recipeScaling';

interface IngredientListProps {
  ingredients: RecipeIngredient[];
  scaleFactor?: number;
  onScalePress?: () => void;
}

interface IngredientItemProps {
  ingredient: RecipeIngredient;
  scaleFactor: number;
  index: number;
}

function IngredientItem({ ingredient, scaleFactor, index }: IngredientItemProps) {
  const [isChecked, setIsChecked] = useState(false);
  const displayText = getScaledIngredientDisplay(ingredient, scaleFactor);

  // Parse quantity and name from display text
  // Format: "500g Pizza dough (room temp)" -> "500g" and "Pizza dough (room temp)"
  const parts = displayText.match(/^([\d./]+\s*\w*)\s+(.*)$/);
  const quantity = parts?.[1] || '';
  const name = parts?.[2] || displayText;

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 30).duration(300)}
    >
      <TouchableOpacity
        style={[styles.ingredientItem, isChecked && styles.ingredientItemChecked]}
        onPress={() => setIsChecked(!isChecked)}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
          {isChecked && (
            <Feather name="check" size={14} color="white" />
          )}
        </View>

        {/* Text */}
        <Text style={[styles.ingredientText, isChecked && styles.ingredientTextChecked]}>
          <Text style={styles.quantity}>{quantity} </Text>
          <Text style={styles.name}>{name}</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function IngredientList({
  ingredients,
  scaleFactor = 1,
  onScalePress,
}: IngredientListProps) {
  const scaleDisplay = scaleFactor !== 1 ? `${scaleFactor}x` : '1x';

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {onScalePress && (
          <TouchableOpacity onPress={onScalePress}>
            <Text style={styles.scaleButton}>Scale: {scaleDisplay}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Ingredient List */}
      <View style={styles.list}>
        {ingredients.length > 0 ? (
          ingredients.map((ing, idx) => (
            <IngredientItem
              key={ing.id || idx}
              ingredient={ing}
              scaleFactor={scaleFactor}
              index={idx}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No ingredients listed</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '400',
    color: mangiaColors.dark,
  },
  scaleButton: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    color: mangiaColors.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ingredientItemChecked: {
    opacity: 0.6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: mangiaColors.sage,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: mangiaColors.sage,
    borderColor: mangiaColors.sage,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  ingredientTextChecked: {
    textDecorationLine: 'line-through',
  },
  quantity: {
    fontFamily: 'System',
    fontWeight: '700',
    color: mangiaColors.dark,
  },
  name: {
    fontFamily: 'System',
    fontWeight: '400',
    color: mangiaColors.brown,
  },
  emptyText: {
    fontFamily: 'System',
    fontSize: 14,
    fontStyle: 'italic',
    color: mangiaColors.taupe,
    padding: 12,
  },
});
