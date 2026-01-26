/**
 * EditorialText
 *
 * Semantic typography components for the Warm & Editorial design.
 * Uses serif fonts for headlines and generous line heights.
 */

import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../../theme';

interface EditorialTextProps extends TextProps {
  children: React.ReactNode;
}

/**
 * Large display headline for featured content and heroes
 */
export function DisplayHeadline({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.displayHeadline,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Recipe title for detail screens
 */
export function RecipeTitle({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.recipeTitle,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Section heading for content sections
 */
export function SectionHeading({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.sectionHeading,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Card title for recipe cards
 */
export function CardTitle({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.cardTitle,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Byline text for attribution and labels (uppercase, letter-spaced)
 */
export function Byline({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.byline,
        { color: colors.textSecondary },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Recipe body text with generous line height
 */
export function RecipeBody({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.recipeBody,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Ingredient text for recipe ingredients
 */
export function IngredientText({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.ingredient,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Cooking step text for cooking mode (large, readable)
 */
export function CookingStepText({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.cookingStep,
        { color: colors.cookingText },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Cooking step label "STEP 1 OF 8" format
 */
export function CookingStepLabel({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.cookingStepLabel,
        { color: colors.cookingAccent },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
