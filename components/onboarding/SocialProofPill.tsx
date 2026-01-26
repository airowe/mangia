/**
 * SocialProofPill Component
 *
 * "Join 50,000+ Cooks" pill badge positioned above bottom sheet.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { mangiaColors } from '../../theme/tokens/colors';

interface SocialProofPillProps {
  text?: string;
}

export function SocialProofPill({ text = 'Join 50,000+ Cooks' }: SocialProofPillProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: mangiaColors.sage,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: mangiaColors.cream,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    color: mangiaColors.dark,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
