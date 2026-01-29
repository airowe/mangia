/**
 * Legacy Colors Export
 *
 * @deprecated Use `useTheme()` hook instead of importing colors directly.
 * This file is maintained for backward compatibility during migration.
 *
 * All values now reference the editorial palette from tokens/colors.ts
 */

import { editorialPalette, palette } from './tokens/colors';

export const colors = {
  // Brand colors - Editorial terracotta palette
  primary: editorialPalette.terracotta[400], // #D97742
  secondary: editorialPalette.sage[300], // #A8BCA0
  accent: editorialPalette.cream[200], // #F5E3C1
  primaryLight: editorialPalette.terracotta[100],

  // UI colors - Warm cream base
  background: editorialPalette.cream[100], // #FBF9F5
  card: palette.white,
  border: editorialPalette.cream[300],
  surface: palette.white,

  // Text colors - Warmer editorial blacks
  text: editorialPalette.editorialDark[600], // #3A322C
  textSecondary: editorialPalette.editorialDark[400], // #7A716A
  textTertiary: editorialPalette.editorialDark[300], // #A9A29A
  muted: editorialPalette.editorialDark[300],

  // Status colors
  error: palette.status.error,
  success: palette.status.success,
  warning: palette.status.warning,
  info: palette.status.info,

  // Common colors
  white: palette.white,
  black: palette.black,
  buttonText: palette.white,
  transparent: palette.transparent,

  // Additional colors
  lightGray: editorialPalette.cream[200],
  mediumGray: editorialPalette.cream[300],
  darkGray: editorialPalette.editorialDark[500],
};
