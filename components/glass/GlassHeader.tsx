/**
 * GlassHeader
 *
 * A navigation header with glass effect that can collapse on scroll.
 */

import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Platform,
  StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface GlassHeaderProps {
  /** Title text */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Left accessory (e.g., back button) */
  leftAccessory?: ReactNode;
  /** Right accessory (e.g., action buttons) */
  rightAccessory?: ReactNode;
  /** Animated scroll position for collapse effect */
  scrollY?: SharedValue<number>;
  /** Enable large title that collapses on scroll */
  largeTitle?: boolean;
  /** Custom background style */
  style?: ViewStyle;
}

const HEADER_HEIGHT = 56;
const LARGE_TITLE_HEIGHT = 52;
const COLLAPSE_THRESHOLD = 50;

export function GlassHeader({
  title,
  subtitle,
  leftAccessory,
  rightAccessory,
  scrollY,
  largeTitle = false,
  style,
}: GlassHeaderProps) {
  const { theme, isDark } = useTheme();
  const { colors, spacing, typography } = theme;
  const insets = useSafeAreaInsets();

  const supportsBlur = Platform.OS === 'ios';

  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { opacity: 1 };
    }

    const opacity = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [0.5, 1],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  const largeTitleAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY || !largeTitle) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }

    const opacity = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [0, -10],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const smallTitleAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY || !largeTitle) {
      return { opacity: largeTitle ? 0 : 1 };
    }

    const opacity = interpolate(
      scrollY.value,
      [COLLAPSE_THRESHOLD - 10, COLLAPSE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  const totalHeight =
    insets.top + HEADER_HEIGHT + (largeTitle ? LARGE_TITLE_HEIGHT : 0);

  const backgroundContent = supportsBlur ? (
    <>
      <BlurView
        intensity={60}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.glass },
          headerAnimatedStyle,
        ]}
      />
    </>
  ) : (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: isDark
            ? 'rgba(30, 30, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
        },
      ]}
    />
  );

  return (
    <View
      style={[
        styles.container,
        {
          height: totalHeight,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        style,
      ]}
    >
      {backgroundContent}

      {/* Status bar spacer */}
      <View style={{ height: insets.top }} />

      {/* Main header row */}
      <View style={styles.headerRow}>
        {/* Left accessory */}
        <View style={styles.leftAccessory}>{leftAccessory}</View>

        {/* Center title */}
        <Animated.View style={[styles.titleContainer, smallTitleAnimatedStyle]}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              typography.styles.headline,
            ]}
            numberOfLines={1}
          >
            {!largeTitle ? title : scrollY ? title : ''}
          </Text>
          {subtitle && !largeTitle && (
            <Text
              style={[
                styles.subtitle,
                { color: colors.textSecondary },
                typography.styles.caption1,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </Animated.View>

        {/* Right accessory */}
        <View style={styles.rightAccessory}>{rightAccessory}</View>
      </View>

      {/* Large title area */}
      {largeTitle && (
        <Animated.View
          style={[
            styles.largeTitleContainer,
            { paddingHorizontal: spacing.lg },
            largeTitleAnimatedStyle,
          ]}
        >
          <Text
            style={[
              styles.largeTitle,
              { color: colors.text },
              typography.styles.largeTitle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.largeSubtitle,
                { color: colors.textSecondary },
                typography.styles.subheadline,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  headerRow: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  leftAccessory: {
    minWidth: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightAccessory: {
    minWidth: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 2,
  },
  largeTitleContainer: {
    height: LARGE_TITLE_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  largeTitle: {
    // Style from typography
  },
  largeSubtitle: {
    marginTop: 4,
  },
});
