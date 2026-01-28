/**
 * CookingControls Component
 *
 * Bottom navigation controls with asymmetric buttons and voice status indicator.
 */

import React, { useEffect } from 'react';
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
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { mangiaColors } from '../../theme/tokens/colors';

interface CookingControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  onComplete?: () => void;
  isVoiceEnabled?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
}

export function CookingControls({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  isLastStep,
  onComplete,
  isVoiceEnabled = false,
  isListening = false,
  isSpeaking = false,
}: CookingControlsProps) {
  // Pulsing animation for voice indicator
  const pulseValue = useSharedValue(1);
  const speakingValue = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseValue.value = withTiming(1, { duration: 200 });
    }
  }, [isListening, pulseValue]);

  useEffect(() => {
    if (isSpeaking) {
      speakingValue.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        true
      );
    } else {
      speakingValue.value = withTiming(1, { duration: 200 });
    }
  }, [isSpeaking, speakingValue]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
    opacity: isListening ? 1 : 0.5,
  }));

  const speakingStyle = useAnimatedStyle(() => ({
    opacity: speakingValue.value,
  }));

  // Determine voice status text
  const getVoiceStatus = () => {
    if (!isVoiceEnabled) return null;
    if (isSpeaking) return 'Speaking';
    if (isListening) return 'Listening';
    return 'Voice On';
  };

  const voiceStatus = getVoiceStatus();

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
        {isVoiceEnabled ? (
          <>
            <Animated.View style={[styles.micContainer, isListening && pulseStyle]}>
              <Feather
                name="mic"
                size={24}
                color={isListening ? mangiaColors.terracotta : mangiaColors.cream}
              />
              {isListening && <View style={styles.listeningRing} />}
            </Animated.View>
            {voiceStatus && (
              <Animated.Text
                style={[
                  styles.voiceText,
                  isSpeaking && speakingStyle,
                  isListening && styles.voiceTextActive,
                ]}
              >
                {voiceStatus}
              </Animated.Text>
            )}
          </>
        ) : (
          <>
            <Feather name="mic-off" size={24} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.voiceTextOff}>Voice Off</Text>
          </>
        )}
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
    minWidth: 80,
  },
  micContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: mangiaColors.terracotta,
    opacity: 0.3,
  },
  voiceText: {
    fontFamily: 'System',
    fontSize: 10,
    color: mangiaColors.cream,
    textTransform: 'uppercase',
    letterSpacing: 3,
    opacity: 0.7,
  },
  voiceTextActive: {
    color: mangiaColors.terracotta,
    opacity: 1,
  },
  voiceTextOff: {
    fontFamily: 'System',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
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
