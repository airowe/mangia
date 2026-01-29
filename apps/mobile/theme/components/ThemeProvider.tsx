/**
 * ThemeProvider
 *
 * Provides theme context to the application with support for
 * light/dark mode switching and persistence.
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme } from '../variants/light';
import { darkTheme } from '../variants/dark';

// Union type for both theme variants
export type Theme = typeof lightTheme | typeof darkTheme;

const THEME_STORAGE_KEY = '@mangia/theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  /** The current theme object */
  theme: Theme;
  /** Whether dark mode is currently active */
  isDark: boolean;
  /** Current theme mode setting */
  themeMode: ThemeMode;
  /** Set the theme mode */
  setThemeMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  /** Initial theme mode (defaults to 'system') */
  initialMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  initialMode = 'system',
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemePreference();
  }, []);

  // Persist theme preference when it changes
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, []);

  // Toggle between light and dark (explicit modes, not system)
  const toggleTheme = useCallback(() => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  }, [themeMode, setThemeMode]);

  // Determine if dark mode should be active
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // Select the appropriate theme
  const theme = useMemo((): Theme => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark,
      themeMode,
      setThemeMode,
      toggleTheme,
    }),
    [theme, isDark, themeMode, setThemeMode, toggleTheme]
  );

  // Provide initial theme while loading to avoid breaking child context providers
  const initialContextValue = useMemo<ThemeContextValue>(
    () => ({
      theme: lightTheme,
      isDark: false,
      themeMode: 'system',
      setThemeMode: () => {},
      toggleTheme: () => {},
    }),
    []
  );

  return (
    <ThemeContext.Provider value={isLoaded ? contextValue : initialContextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
