/**
 * MiseEnPlaceView Component
 *
 * Pre-cooking overview showing all ingredients organized for prep,
 * total time estimate, and a "Ready to Cook" call-to-action.
 * "Mise en place" is a culinary term meaning "everything in its place."
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { mangiaColors } from '../../theme/tokens/colors';
import { RecipeIngredient } from '../../models/Recipe';

interface MiseEnPlaceViewProps {
  recipeName: string;
  ingredients: RecipeIngredient[];
  totalSteps: number;
  prepTime?: number;
  cookTime?: number;
  onStartCooking: () => void;
  onClose: () => void;
}

export function MiseEnPlaceView({
  recipeName,
  ingredients,
  totalSteps,
  prepTime = 0,
  cookTime = 0,
  onStartCooking,
  onClose,
}: MiseEnPlaceViewProps) {
  // Track which ingredients have been checked off
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  const toggleIngredient = useCallback((index: number) => {
    setCheckedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const totalTime = prepTime + cookTime;
  const allChecked = checkedIngredients.size === ingredients.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Feather name="x" size={24} color="rgba(255, 255, 255, 0.6)" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.subtitle}>MISE EN PLACE</Text>
          <Text style={styles.title} numberOfLines={2}>
            {recipeName}
          </Text>
        </View>
      </Animated.View>

      {/* Time & Steps Info */}
      <Animated.View
        entering={FadeIn.delay(200).duration(300)}
        style={styles.infoRow}
      >
        {totalTime > 0 && (
          <View style={styles.infoBadge}>
            <Feather name="clock" size={16} color={mangiaColors.cream} />
            <Text style={styles.infoText}>{formatTime(totalTime)}</Text>
          </View>
        )}
        <View style={styles.infoBadge}>
          <Feather name="list" size={16} color={mangiaColors.cream} />
          <Text style={styles.infoText}>{totalSteps} steps</Text>
        </View>
        <View style={styles.infoBadge}>
          <Feather name="shopping-bag" size={16} color={mangiaColors.cream} />
          <Text style={styles.infoText}>{ingredients.length} items</Text>
        </View>
      </Animated.View>

      {/* Ingredients Checklist */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text
          entering={FadeInDown.delay(300).duration(300)}
          style={styles.sectionTitle}
        >
          Gather Your Ingredients
        </Animated.Text>

        {ingredients.map((ingredient, index) => {
          const isChecked = checkedIngredients.has(index);
          return (
            <Animated.View
              key={index}
              entering={SlideInRight.delay(350 + index * 50).duration(300)}
            >
              <TouchableOpacity
                style={[
                  styles.ingredientRow,
                  isChecked && styles.ingredientRowChecked,
                ]}
                onPress={() => toggleIngredient(index)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.checkbox,
                  isChecked && styles.checkboxChecked,
                ]}>
                  {isChecked && (
                    <Feather name="check" size={14} color={mangiaColors.deepBrown} />
                  )}
                </View>
                <View style={styles.ingredientInfo}>
                  <Text style={[
                    styles.ingredientQuantity,
                    isChecked && styles.ingredientTextChecked,
                  ]}>
                    {ingredient.quantity ? `${ingredient.quantity} ` : ''}
                    {ingredient.unit ? `${ingredient.unit}` : ''}
                  </Text>
                  <Text style={[
                    styles.ingredientName,
                    isChecked && styles.ingredientTextChecked,
                  ]}>
                    {ingredient.name}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Spacer for button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Ready to Cook Button */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(400)}
        style={styles.buttonContainer}
      >
        <TouchableOpacity
          style={[
            styles.startButton,
            allChecked && styles.startButtonReady,
          ]}
          onPress={onStartCooking}
          activeOpacity={0.9}
        >
          <Text style={styles.startButtonText}>
            {allChecked ? "Let's Cook!" : 'Ready to Cook'}
          </Text>
          <Feather
            name="arrow-right"
            size={24}
            color="white"
            style={styles.buttonIcon}
          />
        </TouchableOpacity>

        {!allChecked && (
          <Text style={styles.hintText}>
            Tap ingredients to check them off
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mangiaColors.deepBrown,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    gap: 8,
  },
  subtitle: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    color: mangiaColors.sage,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 32,
    fontWeight: '400',
    color: mangiaColors.cream,
    lineHeight: 40,
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
    flexWrap: 'wrap',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  infoText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: mangiaColors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '400',
    color: mangiaColors.cream,
    marginBottom: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 16,
  },
  ingredientRowChecked: {
    backgroundColor: 'rgba(168, 188, 160, 0.15)',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: mangiaColors.sage,
    borderColor: mangiaColors.sage,
  },
  ingredientInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  ingredientQuantity: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: mangiaColors.terracotta,
  },
  ingredientName: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    color: mangiaColors.cream,
    flex: 1,
  },
  ingredientTextChecked: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  bottomSpacer: {
    height: 120,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    backgroundColor: mangiaColors.deepBrown,
    // Gradient fade effect
    shadowColor: mangiaColors.deepBrown,
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mangiaColors.terracotta,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  startButtonReady: {
    backgroundColor: mangiaColors.sage,
  },
  startButtonText: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  buttonIcon: {
    marginLeft: 4,
  },
  hintText: {
    fontFamily: 'System',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 12,
  },
});
