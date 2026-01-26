/**
 * CookingControls Component
 *
 * Bottom navigation controls with asymmetric buttons and voice indicator.
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

interface CookingControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  onComplete?: () => void;
}

export function CookingControls({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  isLastStep,
  onComplete,
}: CookingControlsProps) {
  return (
    <View style={styles.container}>
      {/* Previous Button */}
      <TouchableOpacity
        style={[styles.prevButton, !canGoPrevious && styles.buttonDisabled]}
        onPress={onPrevious}
        disabled={!canGoPrevious}
        activeOpacity={0.7}
      >
        <Feather
          name="arrow-left"
          size={28}
          color={canGoPrevious ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'}
        />
      </TouchableOpacity>

      {/* Voice Control Indicator */}
      <View style={styles.voiceIndicator}>
        <Feather name="mic" size={24} color={mangiaColors.cream} />
        <Text style={styles.voiceText}>Listening</Text>
      </View>

      {/* Next Button (larger) */}
      {isLastStep ? (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={onComplete}
          activeOpacity={0.9}
        >
          <Feather name="check" size={32} color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.nextButton, !canGoNext && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!canGoNext}
          activeOpacity={0.9}
        >
          <Feather name="arrow-right" size={32} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
  },
  prevButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  voiceIndicator: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    opacity: 0.5,
  },
  voiceText: {
    fontFamily: 'System',
    fontSize: 10,
    color: mangiaColors.cream,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  nextButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: mangiaColors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: mangiaColors.deepBrown,
    // Ring effect
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  completeButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: mangiaColors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: mangiaColors.deepBrown,
    shadowColor: mangiaColors.sage,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 8,
  },
});
