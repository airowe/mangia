/**
 * MetadataPills Component
 *
 * Horizontal scrolling metadata pills for recipe detail.
 * Shows time, servings, and calories in pill-shaped badges.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { mangiaColors } from '../../theme/tokens/colors';

interface MetadataPillsProps {
  cookTime?: number | null;
  servings?: number | null;
  calories?: number | null;
}

interface PillProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  delay: number;
}

function Pill({ icon, label, delay }: PillProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(300)}
      style={styles.pill}
    >
      <Feather name={icon} size={16} color={mangiaColors.terracotta} />
      <Text style={styles.pillText}>{label}</Text>
    </Animated.View>
  );
}

export function MetadataPills({ cookTime, servings, calories }: MetadataPillsProps) {
  const pills: { icon: keyof typeof Feather.glyphMap; label: string }[] = [];

  if (cookTime && cookTime > 0) {
    pills.push({ icon: 'clock', label: `${cookTime} min` });
  }

  if (servings && servings > 0) {
    pills.push({ icon: 'users', label: `${servings} people` });
  }

  if (calories && calories > 0) {
    pills.push({ icon: 'zap', label: `${calories} kcal` });
  }

  if (pills.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {pills.map((pill, index) => (
        <Pill
          key={pill.icon}
          icon={pill.icon}
          label={pill.label}
          delay={100 + index * 50}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: mangiaColors.creamDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: mangiaColors.dark,
  },
});
