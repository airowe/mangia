/**
 * StartCookingButton Component
 *
 * Floating CTA button with embedded play icon.
 * Full-width pill button with terracotta background.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { mangiaColors } from '../../theme/tokens/colors';

interface StartCookingButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function StartCookingButton({ onPress, disabled }: StartCookingButtonProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(400).duration(300)}
      style={styles.container}
    >
      {/* Gradient fade background */}
      <LinearGradient
        colors={['transparent', 'white', 'white']}
        locations={[0, 0.3, 1]}
        style={styles.gradient}
      />

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
      >
        <Text style={styles.buttonText}>Start Cooking</Text>

        {/* Play Icon Circle */}
        <View style={styles.playCircle}>
          <Feather name="play" size={20} color={mangiaColors.terracotta} style={styles.playIcon} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: mangiaColors.terracotta,
    marginHorizontal: 24,
    marginBottom: 24,
    height: 60,
    borderRadius: 30,
    paddingLeft: 32,
    paddingRight: 8,
    borderWidth: 2,
    borderColor: mangiaColors.terracotta,
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '400',
    color: 'white',
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2, // Visual centering for play icon
  },
});
