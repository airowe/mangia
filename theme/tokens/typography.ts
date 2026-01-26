/**
 * Typography Tokens
 *
 * System font stack with SF Pro on iOS and Roboto on Android.
 * Type scale follows iOS Human Interface Guidelines.
 */

import { Platform, TextStyle } from 'react-native';

// Font families - using system fonts for best native feel
export const fontFamily = {
  // System fonts - automatically uses SF Pro on iOS, Roboto on Android
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium', // Android doesn't have semibold
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
  // Editorial serif fonts for magazine-style headlines
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  serifBold: Platform.select({
    ios: 'Georgia-Bold',
    android: 'serif',
    default: 'serif',
  }),
} as const;

// Font weights
export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

// Font sizes (in logical pixels)
export const fontSize = {
  /** 11px - Caption small */
  xs: 11,
  /** 13px - Caption */
  sm: 13,
  /** 15px - Body small / Subheadline */
  md: 15,
  /** 17px - Body / Default */
  lg: 17,
  /** 20px - Title 3 */
  xl: 20,
  /** 22px - Title 2 */
  xxl: 22,
  /** 28px - Title 1 */
  xxxl: 28,
  /** 34px - Large Title */
  display: 34,
} as const;

// Line heights (multiplier of font size, for proper spacing)
export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

// Letter spacing
export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// Predefined text styles
export const textStyles = {
  // Large titles for screens
  largeTitle: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.display * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Primary headings
  title1: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xxxl * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  title2: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xxl * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  title3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Subheadings
  headline: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  subheadline: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Body text
  body: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.lg * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },

  bodySmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },

  // Callouts
  callout: {
    fontSize: fontSize.lg - 1, // 16px
    fontWeight: fontWeight.regular,
    lineHeight: (fontSize.lg - 1) * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Footnotes and captions
  footnote: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  caption1: {
    fontSize: fontSize.sm - 1, // 12px
    fontWeight: fontWeight.regular,
    lineHeight: (fontSize.sm - 1) * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  caption2: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },

  // Buttons
  button: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.lg * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },

  buttonSmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.md * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },

  // Labels
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.md * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },

  labelSmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  },

  // Tab bar
  tabBarLabel: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    lineHeight: 10 * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },
} as const;

export type TextStyleKey = keyof typeof textStyles;
export type FontSizeKey = keyof typeof fontSize;

/**
 * Editorial Text Styles
 *
 * Magazine-style typography for the Warm & Editorial design.
 * Uses serif fonts for headlines and generous line heights.
 */
export const editorialTextStyles = {
  // Large display headline (home hero, featured recipes)
  displayHeadline: {
    fontFamily: fontFamily.serifBold,
    fontSize: 36,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 42,
    letterSpacing: -0.5,
  },

  // Recipe title on detail screen
  recipeTitle: {
    fontFamily: fontFamily.serifBold,
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 34,
    letterSpacing: -0.3,
  },

  // Section headings
  sectionHeading: {
    fontFamily: fontFamily.serif,
    fontSize: 22,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: -0.2,
  },

  // Card titles
  cardTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: -0.1,
  },

  // Cooking mode step text - LARGE for hands-free readability
  cookingStep: {
    fontFamily: fontFamily.serif,
    fontSize: 32,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 44,
    letterSpacing: 0,
  },

  // Step label "STEP 1 OF 8"
  cookingStepLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },

  // Byline/attribution text
  byline: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },

  // Recipe body text with generous line height
  recipeBody: {
    fontFamily: fontFamily.regular,
    fontSize: 17,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: 0,
  },

  // Ingredient list items
  ingredient: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 26,
    letterSpacing: 0,
  },
} as const;

export type EditorialTextStyleKey = keyof typeof editorialTextStyles;
