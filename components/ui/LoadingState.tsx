/**
 * LoadingState
 *
 * A reusable component for displaying loading states across the app.
 * Provides consistent styling and optional loading text.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface LoadingStateProps {
  /** Loading text to display below spinner */
  text?: string;
  /** Size of the spinner */
  size?: 'small' | 'large';
  /** Custom style for container */
  style?: ViewStyle;
  /** Fill entire screen */
  fullScreen?: boolean;
}

export function LoadingState({
  text,
  size = 'large',
  style,
  fullScreen = true,
}: LoadingStateProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        style,
      ]}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      {text && (
        <Text
          style={[
            styles.text,
            typography.styles.body,
            { color: colors.textSecondary, marginTop: spacing.lg },
          ]}
        >
          {text}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
  },
  text: {
    textAlign: 'center',
  },
});
