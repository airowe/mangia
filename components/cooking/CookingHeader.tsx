/**
 * CookingHeader Component
 *
 * Progress header for cooking mode with close button, step indicator,
 * voice control toggle, and ingredients toggle.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { mangiaColors } from '../../theme/tokens/colors';
import { useEffect } from 'react';

interface CookingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onClose: () => void;
  onToggleIngredients: () => void;
  onToggleVoice?: () => void;
  isVoiceEnabled?: boolean;
  isListening?: boolean;
  showMiseEnPlace?: boolean;
}

export function CookingHeader({
  currentStep,
  totalSteps,
  onClose,
  onToggleIngredients,
  onToggleVoice,
  isVoiceEnabled = false,
  isListening = false,
  showMiseEnPlace = false,
}: CookingHeaderProps) {
  // Pulsing animation for voice indicator
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseValue.value = withTiming(1, { duration: 200 });
    }
  }, [isListening, pulseValue]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

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
      {!showMiseEnPlace && (
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
        </View>
      )}

      {/* Right side buttons */}
      <View style={styles.rightButtons}>
        {/* Voice Control Toggle */}
        {onToggleVoice && (
          <TouchableOpacity
            style={[
              styles.iconButton,
              isVoiceEnabled && styles.iconButtonActive,
            ]}
            onPress={onToggleVoice}
            activeOpacity={0.7}
          >
            {isListening ? (
              <Animated.View style={pulseStyle}>
                <View style={styles.listeningDot} />
              </Animated.View>
            ) : (
              <Feather
                name={isVoiceEnabled ? 'mic' : 'mic-off'}
                size={20}
                color={isVoiceEnabled ? mangiaColors.terracotta : 'rgba(255, 255, 255, 0.6)'}
              />
            )}
          </TouchableOpacity>
        )}

        {/* Ingredients Toggle */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onToggleIngredients}
          activeOpacity={0.7}
        >
          <Feather name="list" size={24} color="rgba(255, 255, 255, 0.6)" />
        </TouchableOpacity>
      </View>
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
  iconButtonActive: {
    borderColor: mangiaColors.terracotta,
    backgroundColor: 'rgba(217, 119, 66, 0.15)',
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
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  listeningDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: mangiaColors.terracotta,
  },
});
