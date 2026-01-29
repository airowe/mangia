# PRD-01: Design System Foundation

## Objective

Establish the foundational design tokens and theme system that all screens will use. This must be completed first as all other PRDs depend on it.

## Reference

Design system extracted from all HTML prototypes in `/ui-redesign/screens/`

## Tasks

### 1. Update Color Tokens (`theme/tokens/colors.ts`)

Replace existing palette with exact values from prototypes:

```typescript
export const mangiaColors = {
  terracotta: '#D97742',
  sage: '#A8BCA0',
  cream: '#FBF9F5',
  creamDark: '#F5E3C1',
  dark: '#3A322C',
  brown: '#7A716A',
  deepBrown: '#2A1F18',
  taupe: '#A9A29A',
};
```

### 2. Update Typography (`theme/tokens/typography.ts`)

Add serif font family and editorial text styles:

```typescript
export const fontFamilies = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif', // Or Noto Serif if available
  }),
  sans: Platform.select({
    ios: 'System',
    android: 'Roboto',
  }),
};

export const editorialStyles = {
  // Large display - "On The Menu"
  displayLarge: {
    fontFamily: fontFamilies.serif,
    fontSize: 32,
    lineHeight: 36,
    color: mangiaColors.dark,
  },
  // Section headers
  sectionTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 24,
    color: mangiaColors.dark,
  },
  // Recipe titles on cards
  cardTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 24,
    color: mangiaColors.cream,
  },
  // Uppercase labels
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  // Body text
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    lineHeight: 24,
    color: mangiaColors.brown,
  },
  // Cooking mode large text
  cookingStep: {
    fontFamily: fontFamilies.serif,
    fontSize: 34,
    lineHeight: 44,
    color: mangiaColors.cream,
  },
};
```

### 3. Update Spacing Tokens (`theme/tokens/spacing.ts`)

Ensure consistent spacing scale:

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};
```

### 4. Update Border Radius (`theme/tokens/borderRadius.ts`)

```typescript
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
  // Special shapes from design
  card: 24,
  featuredCard: 32,
  button: 9999, // pill shape
  tabBar: 9999,
};
```

### 5. Update Theme Variants

**Light Theme (`theme/variants/light.ts`):**
- background: cream (#FBF9F5)
- card: white
- text: dark (#3A322C)
- textSecondary: brown (#7A716A)
- primary: terracotta (#D97742)
- secondary: sage (#A8BCA0)
- tabBarBackground: white/80 (semi-transparent)
- tabBarActive: terracotta
- tabBarInactive: brown

**Dark Theme (`theme/variants/dark.ts`):**
- background: deepBrown (#2A1F18)
- card: #3E342F
- text: cream (#FBF9F5)
- Other values adjusted accordingly

### 6. Update PaperProvider Theme (App.tsx)

Ensure react-native-paper components use Mangia colors:

```typescript
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: mangiaColors.terracotta,
    onPrimary: '#FFFFFF',
    secondary: mangiaColors.sage,
    background: mangiaColors.cream,
    surface: '#FFFFFF',
    onSurface: mangiaColors.dark,
  },
};
```

## Files to Modify

- `theme/tokens/colors.ts`
- `theme/tokens/typography.ts`
- `theme/tokens/spacing.ts`
- `theme/tokens/borderRadius.ts` (create if doesn't exist)
- `theme/variants/light.ts`
- `theme/variants/dark.ts`
- `theme/hooks/useTheme.ts`
- `App.tsx`

## Acceptance Criteria

- [ ] All color values match exact hex from prototypes
- [ ] Serif font (Georgia) available for headlines
- [ ] useTheme() hook returns all new tokens
- [ ] PaperProvider uses Mangia terracotta as primary
- [ ] TypeScript compiles without errors
- [ ] No purple (#6750A4) anywhere in codebase
