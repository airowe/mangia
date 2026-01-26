/**
 * Spacing Tokens
 *
 * Consistent spacing scale based on 4px grid system.
 * Used for margins, padding, gaps, and layout spacing.
 */

export const spacing = {
  /** 4px - Minimal spacing for tight layouts */
  xs: 4,
  /** 8px - Small spacing for compact elements */
  sm: 8,
  /** 12px - Medium-small for form elements */
  md: 12,
  /** 16px - Standard spacing for most components */
  lg: 16,
  /** 24px - Large spacing for section separation */
  xl: 24,
  /** 32px - Extra large for major sections */
  xxl: 32,
  /** 48px - Huge spacing for screen-level layouts */
  xxxl: 48,
} as const;

export const borderRadius = {
  /** 4px - Subtle rounding */
  xs: 4,
  /** 8px - Standard card rounding */
  sm: 8,
  /** 12px - Prominent rounding for buttons, inputs */
  md: 12,
  /** 16px - Large rounding for sheets, modals */
  lg: 16,
  /** 20px - Extra large for special elements */
  xl: 20,
  /** 24px - Maximum rounding for pills */
  xxl: 24,
  /** Full circle/pill */
  full: 9999,
} as const;

// Common component dimensions
export const dimensions = {
  // Touch targets (minimum 44px for iOS, 48px for Android)
  touchTarget: {
    min: 44,
    standard: 48,
    large: 56,
  },

  // Tab bar
  tabBar: {
    height: 60,
    iconSize: 24,
    actionButtonSize: 48,
    actionButtonIconSize: 28,
  },

  // Headers
  header: {
    height: 56,
    largeHeight: 96,
  },

  // Cards
  card: {
    minHeight: 80,
    imageAspectRatio: 16 / 9,
  },

  // Bottom sheets
  sheet: {
    handleWidth: 36,
    handleHeight: 4,
    handleTopMargin: 8,
  },
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
