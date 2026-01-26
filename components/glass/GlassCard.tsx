/**
 * GlassCard
 *
 * A card component with liquid glass effect for iOS 26+ and
 * graceful fallback for older versions and Android.
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
  StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Blur intensity (0-100), defaults to 50 */
  intensity?: number;
  /** Whether to show the card border */
  bordered?: boolean;
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Override border radius */
  borderRadius?: number;
  /** Shadow elevation (0-3) */
  elevation?: 0 | 1 | 2 | 3;
}

export function GlassCard({
  children,
  style,
  intensity = 50,
  bordered = true,
  padding = 'md',
  borderRadius: customBorderRadius,
  elevation = 1,
}: GlassCardProps) {
  const { theme, isDark } = useTheme();
  const { spacing, borderRadius, colors } = theme;

  const paddingValue = {
    none: 0,
    sm: spacing.sm,
    md: spacing.lg,
    lg: spacing.xl,
  }[padding];

  const resolvedBorderRadius = customBorderRadius ?? borderRadius.md;

  const shadowStyles = getShadowStyle(elevation, isDark);

  // Use BlurView for glass effect on iOS
  // On Android, fall back to semi-transparent background
  const supportsBlur = Platform.OS === 'ios';

  const containerStyle: ViewStyle = {
    borderRadius: resolvedBorderRadius,
    overflow: 'hidden',
    ...(bordered && {
      borderWidth: 1,
      borderColor: colors.glassBorder,
    }),
    ...shadowStyles,
  };

  const contentStyle: ViewStyle = {
    padding: paddingValue,
  };

  if (supportsBlur) {
    return (
      <View style={[containerStyle, style]}>
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.glassOverlay,
            { backgroundColor: colors.glass },
          ]}
        />
        <View style={contentStyle}>{children}</View>
      </View>
    );
  }

  // Fallback for Android - solid background with slight transparency
  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: isDark
            ? 'rgba(30, 30, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
        },
        style,
      ]}
    >
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

function getShadowStyle(elevation: 0 | 1 | 2 | 3, isDark: boolean): ViewStyle {
  if (elevation === 0) return {};

  const shadowColor = isDark ? '#000' : '#000';

  const shadows: Record<1 | 2 | 3, ViewStyle> = {
    1: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    2: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.4 : 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    3: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.16,
      shadowRadius: 8,
      elevation: 8,
    },
  };

  return shadows[elevation];
}

const styles = StyleSheet.create({
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
