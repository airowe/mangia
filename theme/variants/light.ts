/**
 * Light Theme Variant
 *
 * Full theme configuration for light mode.
 * Warm & Editorial design with terracotta, sage, and cream palette.
 */

import { lightColors } from '../tokens/colors';
import { spacing, borderRadius, dimensions } from '../tokens/spacing';
import { textStyles, fontSize, fontWeight, fontFamily, editorialTextStyles } from '../tokens/typography';
import { duration, easing, spring, animationPresets, stagger } from '../tokens/animation';

export const lightTheme = {
  mode: 'light',

  colors: lightColors,

  spacing,
  borderRadius,
  dimensions,

  typography: {
    styles: textStyles,
    editorialStyles: editorialTextStyles,
    fontSize,
    fontWeight,
    fontFamily,
  },

  animation: {
    duration,
    easing,
    spring,
    presets: animationPresets,
    stagger,
  },
} as const;
