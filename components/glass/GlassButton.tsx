/**
 * GlassButton
 *
 * A button component with glass effect and press animations.
 */

import React, { ReactNode, useCallback } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassButtonProps {
  children?: ReactNode;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  /** Visual variant */
  variant?: 'filled' | 'glass' | 'outline';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  /** Enable haptic feedback */
  haptic?: boolean;
}

export function GlassButton({
  children,
  label,
  icon,
  onPress,
  disabled = false,
  variant = 'filled',
  size = 'md',
  fullWidth = false,
  style,
  labelStyle,
  haptic = true,
}: GlassButtonProps) {
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius, animation } = theme;

  const pressed = useSharedValue(0);

  const sizeStyles = getSizeStyles(size, spacing);
  const supportsBlur = Platform.OS === 'ios';

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, animation.spring.press);
    if (haptic && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [pressed, animation.spring.press, haptic, disabled]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, animation.spring.press);
  }, [pressed, animation.spring.press]);

  const handlePress = useCallback(() => {
    if (!disabled && onPress) {
      onPress();
    }
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.97]);
    const opacity = interpolate(pressed.value, [0, 1], [1, 0.9]);

    return {
      transform: [{ scale }],
      opacity: disabled ? 0.5 : opacity,
    };
  });

  const getVariantStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    iconColor: string;
  } => {
    switch (variant) {
      case 'filled':
        return {
          container: {
            backgroundColor: colors.primary,
          },
          text: {
            color: colors.textOnPrimary,
          },
          iconColor: colors.textOnPrimary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary,
          },
          text: {
            color: colors.primary,
          },
          iconColor: colors.primary,
        };
      case 'glass':
      default:
        return {
          container: {
            backgroundColor: supportsBlur ? 'transparent' : colors.glass,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          },
          text: {
            color: colors.text,
          },
          iconColor: colors.text,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const content = (
    <>
      {icon && (
        <Ionicons
          name={icon}
          size={sizeStyles.iconSize}
          color={variantStyles.iconColor}
          style={label ? { marginRight: spacing.sm } : undefined}
        />
      )}
      {label && (
        <Text
          style={[
            styles.label,
            sizeStyles.text,
            variantStyles.text,
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
      {children}
    </>
  );

  const containerStyles: ViewStyle[] = [
    styles.container,
    sizeStyles.container,
    variantStyles.container,
    { borderRadius: borderRadius.md },
    fullWidth && styles.fullWidth,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (variant === 'glass' && supportsBlur) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[animatedStyle, { borderRadius: borderRadius.md, overflow: 'hidden' }]}
      >
        <View style={containerStyles}>
          <BlurView
            intensity={40}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]} />
          <View style={styles.contentRow}>{content}</View>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[containerStyles, animatedStyle]}
    >
      <View style={styles.contentRow}>{content}</View>
    </AnimatedPressable>
  );
}

function getSizeStyles(
  size: 'sm' | 'md' | 'lg',
  spacing: { sm: number; md: number; lg: number; xl: number }
): {
  container: ViewStyle;
  text: TextStyle;
  iconSize: number;
} {
  switch (size) {
    case 'sm':
      return {
        container: {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          minHeight: 36,
        },
        text: {
          fontSize: 14,
          fontWeight: '600',
        },
        iconSize: 18,
      };
    case 'lg':
      return {
        container: {
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          minHeight: 56,
        },
        text: {
          fontSize: 17,
          fontWeight: '600',
        },
        iconSize: 24,
      };
    case 'md':
    default:
      return {
        container: {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          minHeight: 48,
        },
        text: {
          fontSize: 16,
          fontWeight: '600',
        },
        iconSize: 20,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
});
