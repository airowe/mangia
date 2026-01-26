/**
 * useTheme Hook
 *
 * Provides access to the current theme and theme utilities.
 */

import { useContext } from 'react';
import { ThemeContext, ThemeContextValue, Theme } from '../components/ThemeProvider';

/**
 * Hook to access the current theme and theme controls.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, isDark, toggleTheme } = useTheme();
 *
 *   return (
 *     <View style={{ backgroundColor: theme.colors.background }}>
 *       <Text style={{ color: theme.colors.text }}>Hello</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
        'Make sure to wrap your app with <ThemeProvider>.'
    );
  }

  return context;
}

/**
 * Hook to access just the theme object.
 * Useful when you only need theme values, not controls.
 */
export function useThemeColors(): Theme['colors'] {
  const { theme } = useTheme();
  return theme.colors;
}

/**
 * Hook to access spacing values.
 */
export function useSpacing(): Theme['spacing'] {
  const { theme } = useTheme();
  return theme.spacing;
}

/**
 * Hook to access typography styles.
 */
export function useTypography(): Theme['typography'] {
  const { theme } = useTheme();
  return theme.typography;
}

/**
 * Hook to access animation presets.
 */
export function useAnimation(): Theme['animation'] {
  const { theme } = useTheme();
  return theme.animation;
}

/**
 * Hook to check if dark mode is active.
 */
export function useIsDark(): boolean {
  const { isDark } = useTheme();
  return isDark;
}
