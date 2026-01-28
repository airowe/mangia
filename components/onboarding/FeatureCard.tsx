/**
 * FeatureCard Component
 *
 * Feature benefit card with asymmetric corner radius ("Italian Market" style).
 * Matches prototype: rounded-[24px] with one corner at rounded-[8px].
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { mangiaColors } from '../../theme/tokens/colors';

type CornerVariant = 'tl' | 'tr' | 'bl' | 'br';

interface FeatureCardProps {
  icon: keyof typeof Feather.glyphMap;
  iconBackground: string;
  iconColor: string;
  iconBorderColor?: string;
  title: string;
  description: string;
  smallCorner?: CornerVariant;
}

export function FeatureCard({
  icon,
  iconBackground,
  iconColor,
  iconBorderColor,
  title,
  description,
  smallCorner = 'tl',
}: FeatureCardProps) {
  const cornerStyles: Record<CornerVariant, ViewStyle> = {
    tl: { borderTopLeftRadius: 8 },
    tr: { borderTopRightRadius: 8 },
    bl: { borderBottomLeftRadius: 8 },
    br: { borderBottomRightRadius: 8 },
  };

  return (
    <View style={[styles.container, cornerStyles[smallCorner]]}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: iconBackground,
            borderColor: iconBorderColor || 'transparent',
          },
        ]}
      >
        <Feather name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: mangiaColors.creamDark,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: mangiaColors.dark,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: mangiaColors.brown,
    lineHeight: 20,
  },
});
