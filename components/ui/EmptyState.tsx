/**
 * EmptyState
 *
 * A reusable component for displaying empty states across the app.
 * Provides consistent styling, animations, and optional action buttons.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface EmptyStateProps {
  /** Icon to display */
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Primary action button */
  action?: {
    label: string;
    onPress: () => void;
    icon?: string;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  /** Custom style for container */
  style?: ViewStyle;
  /** Animation delay */
  animationDelay?: number;
  /** Icon size */
  iconSize?: number;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  secondaryAction,
  style,
  animationDelay = 0,
  iconSize = 80,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  return (
    <Animated.View
      entering={FadeIn.delay(animationDelay).duration(400)}
      style={[
        styles.container,
        { padding: spacing.xxxl },
        style,
      ]}
    >
      <Animated.View entering={FadeInUp.delay(animationDelay + 100).duration(400)}>
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color={colors.textTertiary}
          style={styles.icon}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(animationDelay + 200).duration(400)}>
        <Text
          style={[
            styles.title,
            typography.styles.title2,
            { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
          ]}
        >
          {title}
        </Text>
      </Animated.View>

      {subtitle && (
        <Animated.View entering={FadeInUp.delay(animationDelay + 300).duration(400)}>
          <Text
            style={[
              styles.subtitle,
              typography.styles.body,
              { color: colors.textSecondary, marginBottom: spacing.xl },
            ]}
          >
            {subtitle}
          </Text>
        </Animated.View>
      )}

      {action && (
        <Animated.View entering={FadeInUp.delay(animationDelay + 400).duration(400)}>
          <Button
            mode="contained"
            onPress={action.onPress}
            icon={action.icon}
            buttonColor={colors.primary}
            textColor={colors.textOnPrimary}
            style={{ paddingHorizontal: spacing.lg }}
          >
            {action.label}
          </Button>
        </Animated.View>
      )}

      {secondaryAction && (
        <Animated.View entering={FadeInUp.delay(animationDelay + 500).duration(400)}>
          <Button
            mode="text"
            onPress={secondaryAction.onPress}
            textColor={colors.primary}
            style={{ marginTop: spacing.md }}
          >
            {secondaryAction.label}
          </Button>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
