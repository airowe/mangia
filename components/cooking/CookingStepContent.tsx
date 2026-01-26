/**
 * CookingStepContent Component
 *
 * Main step content with large serif text and decorative background.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { mangiaColors } from '../../theme/tokens/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CookingStepContentProps {
  stepText: string;
  stepCategory?: string;
}

export function CookingStepContent({
  stepText,
  stepCategory = 'Cooking',
}: CookingStepContentProps) {
  // Parse step text to highlight ingredients and times
  const renderHighlightedText = () => {
    // Simple regex to find times (e.g., "2 minutes", "30 seconds")
    const timePattern = /(\d+\s*(?:minute|minutes|min|second|seconds|sec|hour|hours|hr)s?)/gi;

    // Split by time patterns
    const parts = stepText.split(timePattern);

    return parts.map((part, index) => {
      if (timePattern.test(part)) {
        return (
          <Text key={index} style={styles.highlightedTime}>
            {part}
          </Text>
        );
      }
      return part;
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

      {/* Large Instruction Text */}
      <View style={styles.textContainer}>
        <Animated.Text
          entering={FadeIn.delay(200).duration(400)}
          style={styles.stepText}
        >
          {renderHighlightedText()}
        </Animated.Text>
      </View>
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
  textContainer: {
    flex: 1,
    justifyContent: 'center',
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
});
