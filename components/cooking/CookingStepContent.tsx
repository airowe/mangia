/**
 * CookingStepContent Component
 *
 * Main step content with large serif text, decorative background,
 * inline ingredient highlighting, and vertical scrolling for long steps.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { mangiaColors } from '../../theme/tokens/colors';
import { RecipeIngredient } from '../../models/Recipe';
import {
  parseInstructionWithIngredients,
  formatIngredientQuantity,
  ParsedSegment,
} from '../../utils/parseInstructionIngredients';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CookingStepContentProps {
  stepText: string;
  stepCategory?: string;
  ingredients?: RecipeIngredient[];
}

export function CookingStepContent({
  stepText,
  stepCategory = 'Cooking',
  ingredients = [],
}: CookingStepContentProps) {
  // Parse the instruction to find ingredient references
  const parsedSegments = useMemo(() => {
    return parseInstructionWithIngredients(stepText, ingredients);
  }, [stepText, ingredients]);

  // Render parsed text with highlighted ingredients
  const renderParsedText = () => {
    return parsedSegments.map((segment, index) => {
      if (segment.type === 'ingredient' && segment.ingredient) {
        const quantityText = formatIngredientQuantity(
          segment.ingredient.quantity,
          segment.ingredient.unit
        );
        return (
          <Text key={index} style={styles.ingredientHighlight}>
            {quantityText} {segment.content}
          </Text>
        );
      }

      // Check for time patterns in text segments
      const timePattern = /(\d+\s*(?:minute|minutes|min|second|seconds|sec|hour|hours|hr)s?)/gi;
      const parts = segment.content.split(timePattern);

      return parts.map((part, partIndex) => {
        if (timePattern.test(part)) {
          // Reset regex lastIndex after test
          timePattern.lastIndex = 0;
          return (
            <Text key={`${index}-${partIndex}`} style={styles.highlightedTime}>
              {part}
            </Text>
          );
        }
        return <Text key={`${index}-${partIndex}`}>{part}</Text>;
      });
    });
  };

  return (
    <View style={styles.container}>
      {/* Decorative Background Circle */}
      <View style={styles.decorativeCircle} />

      {/* Step Category */}
      <Animated.Text
        entering={FadeInDown.delay(100).duration(300)}
        style={styles.stepCategory}
      >
        {stepCategory}
      </Animated.Text>

      {/* Scrollable Instruction Text */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      >
        <Animated.Text
          entering={FadeIn.delay(200).duration(400)}
          style={styles.stepText}
        >
          {renderParsedText()}
        </Animated.Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    top: 0,
    right: -50,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: mangiaColors.terracotta,
    opacity: 0.2,
    // Blur effect - using shadow as a workaround
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
  },
  stepCategory: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: mangiaColors.sage,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  stepText: {
    fontFamily: 'Georgia',
    fontSize: 34,
    fontWeight: '400',
    color: mangiaColors.cream,
    lineHeight: 44,
  },
  highlightedTime: {
    color: mangiaColors.terracotta,
    fontWeight: '700',
  },
  ingredientHighlight: {
    color: mangiaColors.sage,
    fontWeight: '700',
    backgroundColor: 'rgba(168, 188, 160, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
});
