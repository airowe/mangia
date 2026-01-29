/**
 * TabBarActionButton
 *
 * The primary action button that appears on the tab bar.
 * Elevated and visually distinct from navigation tabs.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabBarActionButtonProps {
  onPress: () => void;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function TabBarActionButton({
  onPress,
  label = 'Add',
  icon = 'add',
}: TabBarActionButtonProps) {
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, dimensions, animation } = theme;

  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, animation.spring.press);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [pressed, animation.spring.press]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, animation.spring.press);
  }, [pressed, animation.spring.press]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.95]);

    return {
      transform: [{ scale }],
    };
  });

  const shadowAnimatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(pressed.value, [0, 1], [0.25, 0.15]);
    const elevation = interpolate(pressed.value, [0, 1], [8, 4]);

    return {
      shadowOpacity,
      elevation,
    };
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          borderRadius: borderRadius.full,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minWidth: dimensions.tabBar.actionButtonSize,
        },
        animatedStyle,
        shadowAnimatedStyle,
        styles.shadow,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.content}>
        <Ionicons
          name={icon}
          size={dimensions.tabBar.actionButtonIconSize}
          color={colors.textOnPrimary}
        />
        {label && (
          <Text
            style={[
              styles.label,
              { color: colors.textOnPrimary, marginLeft: spacing.xs },
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  shadow: {
    shadowColor: '#D97742', // Editorial terracotta
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    ...Platform.select({
      android: {
        elevation: 8,
      },
    }),
  },
});
