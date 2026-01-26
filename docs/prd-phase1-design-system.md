# PRD: Phase 1 - Editorial Design System Foundation

## Objective
Update the Mangia theme system to establish a "Warm & Editorial" design foundation with earthy colors, serif typography, and magazine-style aesthetics.

## Background
The current UI uses burnt orange (#CC5500) with a generic look. We're transforming to an editorial magazine style inspired by Bon Appétit and NYT Cooking, optimized for a cooking assistant experience.

## Scope

### 1. Update Color Tokens
**File:** `theme/tokens/colors.ts`

Add new editorial palette alongside existing (don't delete old palette yet for backwards compatibility):

```typescript
// Add after existing palette definition
export const editorialPalette = {
  terracotta: {
    50: '#FDF5F0',
    100: '#FAEAE0',
    200: '#F5D5C1',
    300: '#E8B799',
    400: '#D97742',  // Primary
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
    300: '#A8BCA0',  // Primary
    400: '#8BA882',
    500: '#6E9464',
    600: '#587A4F',
    700: '#42603A',
    800: '#2C4625',
    900: '#162C10',
  },
  cream: {
    50: '#FDFCFA',
    100: '#FBF9F5',  // Background
    200: '#F5E3C1',  // Accent
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
```

Update `lightColors` semantic mappings:
- `primary`: Change from `palette.burntOrange[500]` to `editorialPalette.terracotta[400]` (#D97742)
- `primaryLight`: `editorialPalette.terracotta[100]`
- `primaryDark`: `editorialPalette.terracotta[600]`
- `secondary`: `editorialPalette.sage[300]` (#A8BCA0)
- `accent`: `editorialPalette.cream[200]` (#F5E3C1)
- `background`: `editorialPalette.cream[100]` (#FBF9F5)
- `text`: `editorialPalette.editorialDark[600]` (#3A322C)
- `textSecondary`: `editorialPalette.editorialDark[400]`
- `textTertiary`: `editorialPalette.editorialDark[300]`

Add new semantic colors:
```typescript
// Add to SemanticColors interface and both light/dark implementations
cookingBackground: string;
cookingBackgroundSecondary: string;
cookingAccent: string;
cookingText: string;
cookingTextSecondary: string;
```

Light mode cooking colors:
- `cookingBackground`: `'#2A1F18'` (warm dark brown)
- `cookingBackgroundSecondary`: `'#3A2A20'`
- `cookingAccent`: `editorialPalette.terracotta[300]`
- `cookingText`: `editorialPalette.cream[100]`
- `cookingTextSecondary`: `'rgba(251, 249, 245, 0.7)'`

Update `darkColors` similarly with appropriate dark mode values.

### 2. Update Typography Tokens
**File:** `theme/tokens/typography.ts`

Add serif font family:
```typescript
// Update fontFamily object
export const fontFamily = {
  // Existing sans-serif
  regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  medium: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }),
  semibold: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),

  // New serif for editorial headlines
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  serifBold: Platform.select({ ios: 'Georgia-Bold', android: 'serif', default: 'serif' }),
} as const;
```

Add editorial text styles after existing `textStyles`:
```typescript
export const editorialTextStyles = {
  // Large display headline (home hero, featured recipes)
  displayHeadline: {
    fontFamily: fontFamily.serifBold,
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  // Recipe title on detail screen
  recipeTitle: {
    fontFamily: fontFamily.serifBold,
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  // Section headings
  sectionHeading: {
    fontFamily: fontFamily.serif,
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  // Card titles
  cardTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  // Cooking mode step text - LARGE for hands-free
  cookingStep: {
    fontFamily: fontFamily.serif,
    fontSize: 32,
    fontWeight: '400' as const,
    lineHeight: 44,
    letterSpacing: 0,
  },
  // Step label "STEP 1 OF 8"
  cookingStepLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  // Byline/attribution text
  byline: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  // Recipe body text with generous line height
  recipeBody: {
    fontFamily: fontFamily.regular,
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  // Ingredient list items
  ingredient: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 26,
    letterSpacing: 0,
  },
} as const;
```

### 3. Update Theme Variants
**Files:** `theme/variants/light.ts` and `theme/variants/dark.ts`

Ensure both variants include the new `editorialTextStyles` in the exported theme object:
```typescript
export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  borderRadius,
  typography: {
    ...typography,
    editorialStyles: editorialTextStyles,  // Add this
  },
  animation,
};
```

### 4. Update Theme Type Definition
**File:** `theme/hooks/useTheme.ts` (or wherever Theme type is defined)

Update the Theme interface to include editorial typography:
```typescript
interface Theme {
  colors: SemanticColors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: {
    fontFamily: typeof fontFamily;
    fontSize: typeof fontSize;
    fontWeight: typeof fontWeight;
    lineHeight: typeof lineHeight;
    letterSpacing: typeof letterSpacing;
    styles: typeof textStyles;
    editorialStyles: typeof editorialTextStyles;  // Add this
  };
  animation: typeof animation;
}
```

## Acceptance Criteria
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] New colors are accessible via `const { colors } = useTheme()` with `colors.primary` returning `#D97742`
- [ ] Editorial typography accessible via `theme.typography.editorialStyles.cookingStep`
- [ ] Existing screens continue to work (backwards compatible)
- [ ] Both light and dark themes include new tokens

## Out of Scope
- Updating individual screens (Phase 3-5)
- Creating new components (Phase 2)
- Font file installation (using system fonts)
