/**
 * Dark Theme Variant
 *
 * Full theme configuration for dark mode.
 * Warm & Editorial design with terracotta, sage, and cream palette.
 */

import { darkColors } from '../tokens/colors';
import { spacing, borderRadius, dimensions } from '../tokens/spacing';
import { textStyles, fontSize, fontWeight, fontFamily, editorialTextStyles } from '../tokens/typography';
import { duration, easing, spring, animationPresets, stagger } from '../tokens/animation';

export const darkTheme = {
  mode: 'dark',

  colors: darkColors,

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
