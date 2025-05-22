export const theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  colors: {
    // Brand colors
    primary: '#CC5500', // burnt orange
    secondary: '#004E7C', // warm blue
    accent: '#FFB74D',
    primaryLight: '#FFDDB5',
    
    // UI colors
    background: '#FDF6F0',
    card: '#FFFFFF',
    border: '#DDD',
    surface: '#FFFFFF',
    
    // Text colors
    text: '#333',
    textSecondary: '#666',
    textTertiary: '#999',
    muted: '#999',
    
    // Status colors
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    info: '#1976D2',
    
    // Common colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    
    // Additional colors
    lightGray: '#F5F5F5',
    mediumGray: '#E0E0E0',
    darkGray: '#757575',
  },
  text: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
} as const;
