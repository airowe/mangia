/**
 * IngredientList Component
 *
 * Editorial ingredient list with sage-bordered checkboxes.
 * Supports scaling display and checked state.
 * Includes integrated scale button matching the design.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { mangiaColors } from '../../theme/tokens/colors';
import { RecipeIngredient } from '../../models/Recipe';
import { getScaledIngredientDisplay } from '../../utils/recipeScaling';

interface IngredientListProps {
  ingredients: RecipeIngredient[];
  scaleFactor?: number;
  onScaleChange?: (scale: number) => void;
  originalServings?: number;
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

const SCALE_OPTIONS = [0.5, 1, 1.5, 2, 3, 4];

export function IngredientList({
  ingredients,
  scaleFactor = 1,
  onScaleChange,
  originalServings,
}: IngredientListProps) {
  const [scaleModalVisible, setScaleModalVisible] = useState(false);

  // Format scale display
  const getScaleDisplay = () => {
    if (scaleFactor === 1) return '1x';
    if (scaleFactor === 0.5) return '½x';
    if (scaleFactor === 1.5) return '1½x';
    return `${scaleFactor}x`;
  };

  const handleScaleSelect = (scale: number) => {
    onScaleChange?.(scale);
    setScaleModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {onScaleChange && (
          <TouchableOpacity
            onPress={() => setScaleModalVisible(true)}
            style={styles.scaleButtonContainer}
          >
            <Text style={styles.scaleButton}>Scale: {getScaleDisplay()}</Text>
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

      {/* Scale Selection Modal */}
      <Modal
        visible={scaleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScaleModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setScaleModalVisible(false)}
        >
          <View style={styles.scaleModal}>
            <Text style={styles.scaleModalTitle}>Scale Recipe</Text>
            {originalServings && (
              <Text style={styles.scaleModalSubtitle}>
                Original: {originalServings} servings
              </Text>
            )}
            <View style={styles.scaleOptions}>
              {SCALE_OPTIONS.map((scale) => {
                const isSelected = scaleFactor === scale;
                const servingsText = originalServings
                  ? `${Math.round(originalServings * scale)} servings`
                  : '';
                return (
                  <TouchableOpacity
                    key={scale}
                    style={[
                      styles.scaleOption,
                      isSelected && styles.scaleOptionSelected,
                    ]}
                    onPress={() => handleScaleSelect(scale)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.scaleOptionText,
                      isSelected && styles.scaleOptionTextSelected,
                    ]}>
                      {scale === 0.5 ? '½x' : scale === 1.5 ? '1½x' : `${scale}x`}
                    </Text>
                    {servingsText && (
                      <Text style={[
                        styles.scaleOptionServings,
                        isSelected && styles.scaleOptionServingsSelected,
                      ]}>
                        {servingsText}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
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
  scaleButtonContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
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

  // Scale Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scaleModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  scaleModalTitle: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '400',
    color: mangiaColors.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  scaleModalSubtitle: {
    fontFamily: 'System',
    fontSize: 14,
    color: mangiaColors.brown,
    textAlign: 'center',
    marginBottom: 20,
  },
  scaleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  scaleOption: {
    width: 80,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: mangiaColors.cream,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scaleOptionSelected: {
    borderColor: mangiaColors.terracotta,
    backgroundColor: `${mangiaColors.terracotta}15`,
  },
  scaleOptionText: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    color: mangiaColors.dark,
  },
  scaleOptionTextSelected: {
    color: mangiaColors.terracotta,
  },
  scaleOptionServings: {
    fontFamily: 'System',
    fontSize: 11,
    color: mangiaColors.taupe,
    marginTop: 4,
  },
  scaleOptionServingsSelected: {
    color: mangiaColors.terracotta,
  },
});
