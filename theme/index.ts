/**
 * Theme Module
 *
 * Centralized exports for the Mangia design system.
 */

// Tokens
export * from './tokens/colors';
export * from './tokens/spacing';
export * from './tokens/typography';
export * from './tokens/animation';

// Theme variants
export * from './variants/light';
export * from './variants/dark';

// Hooks
export * from './hooks/useTheme';

// Components
export * from './components/ThemeProvider';

// Legacy compatibility - re-export colors as they were before
// This allows gradual migration from old colors import
import { lightColors, palette } from './tokens/colors';

/**
 * @deprecated Use `useTheme()` hook or import from theme tokens instead.
 * This export is maintained for backward compatibility during migration.
 */
export const colors = {
  // Brand colors
  primary: lightColors.primary,
  secondary: lightColors.secondary,
  accent: lightColors.accent,
  primaryLight: lightColors.primaryLight,

  // UI colors
  background: lightColors.background,
  card: lightColors.card,
  border: palette.warmNeutral[300],
  surface: lightColors.surface,

  // Text colors
  text: lightColors.text,
  textSecondary: lightColors.textSecondary,
  textTertiary: lightColors.textTertiary,
  muted: lightColors.textTertiary,

  // Status colors
  error: lightColors.error,
  success: lightColors.success,
  warning: lightColors.warning,
  info: lightColors.info,

  // Common colors
  white: palette.white,
  black: palette.black,
  buttonText: palette.white,
  transparent: palette.transparent,

  // Additional colors
  lightGray: palette.warmNeutral[200],
  mediumGray: palette.warmNeutral[300],
  darkGray: palette.warmNeutral[600],
} as const;
