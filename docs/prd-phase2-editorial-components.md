# PRD: Phase 2 - Editorial UI Components

## Objective
Create reusable editorial-style UI components for the Warm & Editorial design system.

## Prerequisites
- Phase 1 complete (design tokens updated)

## Scope

### 1. EditorialText Component
**New File:** `components/editorial/EditorialText.tsx`

Create semantic typography components using the new editorial styles:

```typescript
import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

interface EditorialTextProps extends TextProps {
  children: React.ReactNode;
}

// Display headline for featured content
export function DisplayHeadline({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.displayHeadline,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Recipe title
export function RecipeTitle({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.recipeTitle,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Section heading
export function SectionHeading({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.sectionHeading,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Card title
export function CardTitle({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.cardTitle,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Byline (uppercase, letter-spaced)
export function Byline({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.byline,
        { color: colors.textSecondary },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Recipe body text
export function RecipeBody({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.recipeBody,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Ingredient text
export function IngredientText({ children, style, ...props }: EditorialTextProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Text
      style={[
        typography.editorialStyles.ingredient,
        { color: colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
```

### 2. EditorialCard Component
**New File:** `components/editorial/EditorialCard.tsx`

Create card variants for editorial layouts:

```typescript
import React from 'react';
import { View, TouchableOpacity, Image, ViewStyle, ImageStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { CardTitle, Byline } from './EditorialText';

interface EditorialCardProps {
  variant: 'featured' | 'standard' | 'compact';
  imageUrl?: string;
  title: string;
  subtitle?: string;
  category?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function EditorialCard({
  variant,
  imageUrl,
  title,
  subtitle,
  category,
  onPress,
  style,
}: EditorialCardProps) {
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const cardStyles = getCardStyles(variant, colors, spacing, borderRadius, isDark);

  const content = (
    <Animated.View entering={FadeIn.duration(300)} style={[cardStyles.container, style]}>
      {imageUrl && (
        <View style={cardStyles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={cardStyles.image} resizeMode="cover" />
          {variant === 'featured' && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={cardStyles.gradient}
            />
          )}
        </View>
      )}

      <View style={cardStyles.content}>
        {category && <Byline style={cardStyles.category}>{category}</Byline>}
        <CardTitle style={cardStyles.title} numberOfLines={variant === 'compact' ? 1 : 2}>
          {title}
        </CardTitle>
        {subtitle && variant !== 'compact' && (
          <Byline style={cardStyles.subtitle}>{subtitle}</Byline>
        )}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

function getCardStyles(
  variant: 'featured' | 'standard' | 'compact',
  colors: any,
  spacing: any,
  borderRadius: any,
  isDark: boolean
) {
  const base = {
    container: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    imageContainer: {
      position: 'relative' as const,
    },
    image: {} as ImageStyle,
    gradient: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
    },
    content: {
      padding: spacing.lg,
    },
    category: {
      marginBottom: spacing.xs,
      color: colors.primary,
    },
    title: {},
    subtitle: {
      marginTop: spacing.xs,
    },
  };

  switch (variant) {
    case 'featured':
      return {
        ...base,
        container: { ...base.container, minHeight: 280 },
        image: { width: '100%' as const, height: 200 },
        content: {
          ...base.content,
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
        },
        title: { color: '#FFFFFF' },
        category: { color: colors.accent },
        subtitle: { color: 'rgba(255,255,255,0.8)' },
      };
    case 'standard':
      return {
        ...base,
        container: { ...base.container, width: 200 },
        image: { width: '100%' as const, height: 140 },
      };
    case 'compact':
      return {
        ...base,
        container: {
          ...base.container,
          flexDirection: 'row' as const,
          height: 80,
        },
        imageContainer: { width: 80, height: 80 },
        image: { width: 80, height: 80 },
        content: { flex: 1, justifyContent: 'center' as const, padding: spacing.md },
      };
    default:
      return base;
  }
}
```

### 3. FeaturedRecipeCard Component
**New File:** `components/editorial/FeaturedRecipeCard.tsx`

Specialized card for recipe display:

```typescript
import React, { useMemo } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Recipe } from '../../models/Recipe';
import { DisplayHeadline, CardTitle, Byline } from './EditorialText';

interface FeaturedRecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  variant?: 'hero' | 'large' | 'standard';
}

export function FeaturedRecipeCard({
  recipe,
  onPress,
  variant = 'standard',
}: FeaturedRecipeCardProps) {
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const imageUrl = recipe.image_url || recipe.imageUrl ||
    `https://source.unsplash.com/featured/?${encodeURIComponent(recipe.title)},food`;

  const styles = useMemo(() => ({
    container: {
      borderRadius: borderRadius.lg,
      overflow: 'hidden' as const,
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 16,
      elevation: 6,
      ...(variant === 'hero' && { marginHorizontal: spacing.lg }),
    },
    imageContainer: {
      position: 'relative' as const,
      height: variant === 'hero' ? 280 : variant === 'large' ? 200 : 160,
    },
    image: {
      width: '100%' as const,
      height: '100%' as const,
    },
    gradient: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: variant === 'hero' ? 180 : 120,
    },
    content: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.lg,
    },
    category: {
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    title: {
      color: '#FFFFFF',
    },
    metaRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: spacing.sm,
      gap: spacing.md,
    },
    metaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    metaText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 13,
    },
  }), [colors, spacing, borderRadius, isDark, variant]);

  const TitleComponent = variant === 'hero' ? DisplayHeadline : CardTitle;

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={() => onPress(recipe)}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
        </View>

        <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.content}>
          {recipe.meal_type && (
            <Byline style={styles.category}>
              {recipe.meal_type.toUpperCase()}
            </Byline>
          )}

          <TitleComponent style={styles.title} numberOfLines={2}>
            {recipe.title}
          </TitleComponent>

          <View style={styles.metaRow}>
            {recipe.total_time && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Byline style={styles.metaText}>{recipe.total_time}</Byline>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="account-group-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Byline style={styles.metaText}>{recipe.servings} servings</Byline>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}
```

### 4. Update EmptyState Component
**File:** `components/ui/EmptyState.tsx`

Update to use editorial typography and warmer styling:

- Change title to use serif font (editorialStyles.sectionHeading)
- Update icon color to use `colors.primary` (terracotta)
- Ensure button uses `buttonColor={colors.primary}`
- Add warmer icon container background

### 5. Create Index Export
**New File:** `components/editorial/index.ts`

```typescript
export * from './EditorialText';
export * from './EditorialCard';
export * from './FeaturedRecipeCard';
```

### 6. Update Main Components Index
**File:** `components/index.ts`

Add export for editorial components:
```typescript
export * from './editorial';
```

## Acceptance Criteria
- [ ] `npx tsc --noEmit` passes
- [ ] EditorialText components render with correct serif fonts
- [ ] EditorialCard has 3 working variants (featured, standard, compact)
- [ ] FeaturedRecipeCard displays recipe with gradient overlay
- [ ] EmptyState uses terracotta colors and editorial typography
- [ ] All components use `useTheme()` for colors (support dark mode)

## Out of Scope
- Updating screens to use these components (Phase 3-5)
- Animation refinements beyond basic fade-in
