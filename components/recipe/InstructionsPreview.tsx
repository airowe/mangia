/**
 * InstructionsPreview Component
 *
 * Editorial instructions preview with terracotta left border.
 * Shows first step of the recipe.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { mangiaColors } from '../../theme/tokens/colors';

interface InstructionsPreviewProps {
  instructions: string[];
}

export function InstructionsPreview({ instructions }: InstructionsPreviewProps) {
  if (!instructions || instructions.length === 0) {
    return null;
  }

  const firstStep = instructions[0];
  // Truncate if too long
  const previewText = firstStep.length > 150
    ? firstStep.slice(0, 150) + '...'
    : firstStep;

  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(300)}
      style={styles.container}
    >
      <Text style={styles.sectionTitle}>Preparation</Text>

      <View style={styles.stepCard}>
        <Text style={styles.stepLabel}>Step 1</Text>
        <Text style={styles.stepText}>{previewText}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '400',
    color: mangiaColors.dark,
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: `${mangiaColors.creamDark}4D`, // 30% opacity
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: mangiaColors.terracotta,
  },
  stepLabel: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    color: mangiaColors.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    color: mangiaColors.dark,
    lineHeight: 24,
  },
});
