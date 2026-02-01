/**
 * GroceryTeaser
 *
 * Teaser card for missing grocery items.
 * Matches /ui-redesign/screens/home_screen.html (#grocery-teaser_109)
 *
 * Design specs:
 * - Sage background (#A8BCA0)
 * - Border-radius: 2xl (16px)
 * - Decorative white circle (top-right)
 * - "View List" button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { mangiaColors } from '../../theme/tokens/colors';
import { fontFamily } from '../../theme/tokens/typography';

interface GroceryTeaserProps {
  missingItemsCount: number;
  onPress: () => void;
}

export function GroceryTeaser({ missingItemsCount, onPress }: GroceryTeaserProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (missingItemsCount === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(300)}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={styles.container}
      >
        {/* Decorative Circle */}
        <View style={styles.decorativeCircle} />

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>
            Missing {missingItemsCount} item{missingItemsCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.subtitle}>For this week's plan</Text>
        </View>

        {/* Button */}
        <View style={styles.button}>
          <Text style={styles.buttonText}>View List</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: mangiaColors.sage,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: mangiaColors.white,
    opacity: 0.2,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: 20,
    fontWeight: '700',
    color: mangiaColors.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
    color: mangiaColors.dark,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: mangiaColors.dark,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    zIndex: 1,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: mangiaColors.white,
  },
});
