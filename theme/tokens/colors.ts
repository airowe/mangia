/**
 * Color Tokens
 *
 * Primitive color values and semantic color mappings for Mangia.
 * Editorial design: Warm & Magazine-style with terracotta, sage, and cream.
 */

/**
 * Mangia Brand Colors
 * Direct hex values matching the HTML prototypes in /ui-redesign/screens/
 * Use these for pixel-perfect replication of the design system.
 */
export const mangiaColors = {
  terracotta: '#D97742',    // Primary accent
  sage: '#A8BCA0',          // Secondary accent
  cream: '#FBF9F5',         // Background
  creamDark: '#F5E3C1',     // Card backgrounds, accents
  dark: '#3A322C',          // Primary text
  brown: '#7A716A',         // Secondary text
  deepBrown: '#2A1F18',     // Cooking mode background
  taupe: '#A9A29A',         // Tertiary text
  white: '#FFFFFF',
  balsamicGlaze: '#2C1810', // Deep reddish-brown like real balsamic
} as const;

// Editorial color palette - warm, earthy tones for magazine aesthetic
export const editorialPalette = {
  terracotta: {
    50: '#FDF5F0',
    100: '#FAEAE0',
    200: '#F5D5C1',
    300: '#E8B799',
    400: '#D97742',  // Primary editorial accent
    500: '#C4652E',
    600: '#A85423',
    700: '#8C4319',
    800: '#703210',
    900: '#542108',
  },
  sage: {
    50: '#F5F8F5',
    100: '#EBF2EB',
    200: '#D6E5D6',
    300: '#A8BCA0',  // Primary sage
    400: '#8BA882',
    500: '#6E9464',
    600: '#587A4F',
    700: '#42603A',
    800: '#2C4625',
    900: '#162C10',
  },
  cream: {
    50: '#FDFCFA',
    100: '#FBF9F5',  // Primary background
    200: '#F5E3C1',  // Accent cream
    300: '#EFD8AA',
    400: '#E5C78B',
    500: '#D4B06A',
    600: '#B8944F',
    700: '#9C7838',
    800: '#805C21',
    900: '#64400A',
  },
  editorialDark: {
    50: '#F5F4F3',
    100: '#E8E6E3',
    200: '#D1CDC8',
    300: '#A9A29A',
    400: '#7A716A',
    500: '#4B433C',
    600: '#3A322C',  // Primary text
    700: '#2A231E',
    800: '#1A1410',
    900: '#0A0502',
  },
} as const;

// Legacy primitive color palette - kept for backwards compatibility
export const palette = {
  // Brand colors
  burntOrange: {
    50: '#FFF3E6',
    100: '#FFE4CC',
    200: '#FFDDB5',
    300: '#FFB980',
    400: '#FF914D',
    500: '#CC5500', // Primary brand color
    600: '#B34A00',
    700: '#993F00',
    800: '#803300',
    900: '#662900',
  },

  // Warm neutrals (cream-based)
  warmNeutral: {
    50: '#FDFBF9',
    100: '#FAF7F5',  // New background - warmer off-white
    200: '#F5F0EC',
    300: '#E8E2DC',
    400: '#D4CBC2',
    500: '#B8ADA3',
    600: '#9A8F85',
    700: '#7A6F65',
    800: '#5A5048',
    900: '#3A322C',
  },

  // Cool neutrals (for dark mode)
  coolNeutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#0A0A0A', // True dark background
  },

  // Accent colors
  accent: {
    amber: '#FFB74D',
    teal: '#5D9EC7',
    sage: '#8FBC8F',
  },

  // Status colors
  status: {
    error: '#D32F2F',
    errorLight: '#FFEBEE',
    success: '#388E3C',
    successLight: '#E8F5E9',
    warning: '#F57C00',
    warningLight: '#FFF3E0',
    info: '#1976D2',
    infoLight: '#E3F2FD',
  },

  // Common
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Semantic color tokens - what colors are used for
export interface SemanticColors {
  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;

  // Backgrounds
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceElevated: string;
  card: string;

  // Glass effects
  glass: string;
  glassBorder: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textOnPrimary: string;

  // Borders & Dividers
  border: string;
  borderLight: string;
  divider: string;

  // Interactive states
  pressedOverlay: string;
  disabledBackground: string;
  disabledText: string;

  // Status
  error: string;
  errorBackground: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  info: string;
  infoBackground: string;

  // Tab bar
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Cooking mode (warm ambient)
  cookingBackground: string;
  cookingBackgroundSecondary: string;
  cookingAccent: string;
  cookingText: string;
  cookingTextSecondary: string;
}

export const lightColors: SemanticColors = {
  // Brand - Editorial terracotta palette
  primary: editorialPalette.terracotta[400],  // #D97742
  primaryLight: editorialPalette.terracotta[100],
  primaryDark: editorialPalette.terracotta[600],
  secondary: editorialPalette.sage[300],  // #A8BCA0
  accent: editorialPalette.cream[200],  // #F5E3C1

  // Backgrounds - Warm cream base
  background: editorialPalette.cream[100],  // #FBF9F5
  backgroundElevated: palette.white,
  surface: palette.white,
  surfaceElevated: palette.white,
  card: palette.white,

  // Glass effects
  glass: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',

  // Text - Warmer editorial blacks
  text: editorialPalette.editorialDark[600],  // #3A322C
  textSecondary: editorialPalette.editorialDark[400],  // #7A716A
  textTertiary: editorialPalette.editorialDark[300],  // #A9A29A
  textInverse: palette.white,
  textOnPrimary: palette.white,

  // Borders & Dividers
  border: editorialPalette.cream[300],
  borderLight: editorialPalette.cream[200],
  divider: editorialPalette.cream[200],

  // Interactive states
  pressedOverlay: 'rgba(0, 0, 0, 0.08)',
  disabledBackground: editorialPalette.cream[200],
  disabledText: editorialPalette.editorialDark[300],

  // Status
  error: palette.status.error,
  errorBackground: palette.status.errorLight,
  success: palette.status.success,
  successBackground: palette.status.successLight,
  warning: palette.status.warning,
  warningBackground: palette.status.warningLight,
  info: palette.status.info,
  infoBackground: palette.status.infoLight,

  // Tab bar
  tabBarBackground: 'rgba(255, 255, 255, 0.72)',
  tabBarBorder: 'rgba(0, 0, 0, 0.08)',
  tabBarActive: editorialPalette.terracotta[400],
  tabBarInactive: editorialPalette.editorialDark[400],

  // Cooking mode - Warm ambient environment
  cookingBackground: '#2A1F18',  // Warm dark brown
  cookingBackgroundSecondary: '#3A2A20',
  cookingAccent: editorialPalette.terracotta[300],
  cookingText: editorialPalette.cream[100],
  cookingTextSecondary: 'rgba(251, 249, 245, 0.7)',
};


export const darkColors: SemanticColors = {
  // Brand - Lighter terracotta for visibility on dark
  primary: editorialPalette.terracotta[300],  // #E8B799
  primaryLight: editorialPalette.terracotta[200],
  primaryDark: editorialPalette.terracotta[400],
  secondary: editorialPalette.sage[200],  // Lighter sage for dark mode
  accent: editorialPalette.cream[300],

  // Backgrounds
  background: palette.coolNeutral[950],
  backgroundElevated: palette.coolNeutral[900],
  surface: palette.coolNeutral[800],
  surfaceElevated: palette.coolNeutral[700],
  card: palette.coolNeutral[800],

  // Glass effects
  glass: 'rgba(44, 44, 46, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  // Text
  text: palette.white,
  textSecondary: '#EBEBF5',
  textTertiary: '#EBEBF599',
  textInverse: palette.coolNeutral[900],
  textOnPrimary: editorialPalette.editorialDark[800],  // Dark text on light terracotta

  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.08)',

  // Interactive states
  pressedOverlay: 'rgba(255, 255, 255, 0.08)',
  disabledBackground: palette.coolNeutral[700],
  disabledText: palette.coolNeutral[500],

  // Status
  error: '#FF6B6B',
  errorBackground: 'rgba(211, 47, 47, 0.2)',
  success: '#69DB7C',
  successBackground: 'rgba(56, 142, 60, 0.2)',
  warning: '#FFB84D',
  warningBackground: 'rgba(245, 124, 0, 0.2)',
  info: '#74C0FC',
  infoBackground: 'rgba(25, 118, 210, 0.2)',

  // Tab bar
  tabBarBackground: 'rgba(44, 44, 46, 0.72)',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',
  tabBarActive: editorialPalette.terracotta[300],
  tabBarInactive: '#EBEBF599',

  // Cooking mode - Same warm ambient (always dark for cooking)
  cookingBackground: '#2A1F18',
  cookingBackgroundSecondary: '#3A2A20',
  cookingAccent: editorialPalette.terracotta[300],
  cookingText: editorialPalette.cream[100],
  cookingTextSecondary: 'rgba(251, 249, 245, 0.7)',
};
