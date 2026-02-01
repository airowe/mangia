/**
 * InstructionsPreview Component
 *
 * Editorial instructions list with terracotta left border.
 * Shows all recipe steps on the detail screen.
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

export const InstructionsPreview = React.memo<InstructionsPreviewProps>(function InstructionsPreview({ instructions }) {
  if (!instructions || instructions.length === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(300)}
      style={styles.container}
    >
      <Text style={styles.sectionTitle}>Preparation</Text>

      {instructions.map((step, index) => (
        <View key={index} style={styles.stepCard}>
          <Text style={styles.stepLabel}>Step {index + 1}</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </Animated.View>
  );
});

InstructionsPreview.displayName = 'InstructionsPreview';

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
    marginBottom: 12,
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
