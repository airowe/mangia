/**
 * ErrorState
 *
 * A reusable component for displaying error states across the app.
 * Provides consistent styling and optional retry action.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface ErrorStateProps {
  /** Error message to display */
  message: string;
  /** Title for the error */
  title?: string;
  /** Retry action */
  onRetry?: () => void;
  /** Custom retry button label */
  retryLabel?: string;
  /** Custom style for container */
  style?: ViewStyle;
  /** Fill entire screen */
  fullScreen?: boolean;
  /** Icon to display */
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const ErrorState = React.memo<ErrorStateProps>(function ErrorState({
  message,
  title = 'Something went wrong',
  onRetry,
  retryLabel = 'Try Again',
  style,
  fullScreen = true,
  icon = 'alert-circle-outline',
}) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { padding: spacing.xxxl },
        style,
      ]}
    >
      <Animated.View entering={FadeInUp.delay(100).duration(400)}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${colors.error}15`,
              borderRadius: borderRadius.full,
              padding: spacing.lg,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={48}
            color={colors.error}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(400)}>
        <Text
          style={[
            styles.title,
            typography.styles.title3,
            { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
          ]}
        >
          {title}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(400)}>
        <Text
          style={[
            styles.message,
            typography.styles.body,
            { color: colors.textSecondary, marginBottom: spacing.xl },
          ]}
        >
          {message}
        </Text>
      </Animated.View>

      {onRetry && (
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <Button
            mode="contained"
            onPress={onRetry}
            icon="refresh"
            buttonColor={colors.primary}
            textColor={colors.textOnPrimary}
            style={[
              styles.retryButton,
              { borderRadius: borderRadius.md },
            ]}
          >
            {retryLabel}
          </Button>
        </Animated.View>
      )}
    </Animated.View>
  );
});

ErrorState.displayName = 'ErrorState';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
  },
  iconContainer: {
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  retryButton: {
    paddingHorizontal: 16,
  },
});
