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
 * Sizes match the HTML prototypes in /ui-redesign/screens/
 */
export const editorialTextStyles = {
  // "On The Menu" - 32px serif (home_screen.html)
  displayHeadline: {
    fontFamily: fontFamily.serif,
    fontSize: 32,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 36,
    letterSpacing: 0,
  },

  // Recipe detail title - 40px serif (recipe_detail.html: text-4xl)
  recipeTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 36,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 40,
    letterSpacing: -0.3,
  },

  // Featured card title - 24px serif (home_screen.html: text-2xl)
  featuredCardTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: 0,
  },

  // Greeting header - 24px serif (home_screen.html: text-2xl)
  greeting: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: 0,
  },

  // Section headings - 20px serif (home_screen.html: text-xl)
  sectionHeading: {
    fontFamily: fontFamily.serif,
    fontSize: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: 0,
  },

  // Queue item title - 18px serif (home_screen.html: text-lg)
  cardTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 22,
    letterSpacing: 0,
  },

  // Paywall headline - 28px serif (paywall_screen.html: text-[28px])
  paywallHeadline: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 34,
    letterSpacing: 0,
  },

  // Cooking mode step text - 34px serif (cooking_mode.html: text-[34px])
  cookingStep: {
    fontFamily: fontFamily.serif,
    fontSize: 34,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 44,
    letterSpacing: 0,
  },

  // Category label "PREPARING THE BASE" - 14px sans, uppercase
  cookingCategory: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 18,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },

  // "BON APPÉTIT" label - 12px, uppercase, tracking-widest
  brandLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },

  // Step indicator "STEP 3 OF 8" - 12px, uppercase, tracking-widest
  stepIndicator: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },

  // Cooking step label (alias for stepIndicator, used in CookingModeScreen)
  cookingStepLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 18,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },

  // Category tag "Italian Classic" - 10px, uppercase
  categoryTag: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 14,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },

  // Byline/attribution text - 12px uppercase
  byline: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },

  // Recipe body text
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

  // Meta text (time, servings) - 12px
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 0,
  },

  // Price text - 24px serif (paywall_screen.html: text-2xl)
  price: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: 0,
  },
} as const;

export type EditorialTextStyleKey = keyof typeof editorialTextStyles;
