/**
 * CookingHeader Component
 *
 * Progress header for cooking mode with close button, step indicator, and ingredients toggle.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { mangiaColors } from '../../theme/tokens/colors';

interface CookingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onClose: () => void;
  onToggleIngredients: () => void;
}

export function CookingHeader({
  currentStep,
  totalSteps,
  onClose,
  onToggleIngredients,
}: CookingHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <Feather name="x" size={24} color="rgba(255, 255, 255, 0.6)" />
      </TouchableOpacity>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </View>

      {/* Ingredients Toggle */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onToggleIngredients}
        activeOpacity={0.7}
      >
        <Feather name="list" size={24} color="rgba(255, 255, 255, 0.6)" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    backgroundColor: mangiaColors.terracotta,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
