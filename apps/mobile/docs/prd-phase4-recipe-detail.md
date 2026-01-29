# PRD: Phase 4 - RecipeDetailScreen Redesign

## Objective
Transform RecipeDetailScreen into an editorial magazine-style recipe page with hero imagery, narrative flow, and an inviting "Start Cooking" experience.

## Prerequisites
- Phase 1 complete (design tokens)
- Phase 2 complete (editorial typography components)
- Phase 3 complete (CookingModeScreen)

## Current State
**File:** `screens/RecipeDetailScreen.tsx`

- 250px fixed height image
- Linear section-based layout with borders
- Basic numbered step badges
- Standard button styling
- Utilitarian "textbook" feel

## Target State
- 320px hero image with gradient overlay and title
- Editorial typography throughout
- Generous whitespace between sections
- Prominent "Start Cooking" CTA
- Magazine-style narrative flow

## Detailed Changes

### 1. Hero Image Section

Replace current image with editorial hero:

```typescript
// New hero section styles
heroContainer: {
  position: 'relative',
  height: 320,
  marginBottom: spacing.lg,
},
heroImage: {
  width: '100%',
  height: '100%',
},
heroGradient: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 200,
},
heroContent: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: spacing.xl,
},
heroCategory: {
  ...typography.editorialStyles.byline,
  color: colors.accent,  // Cream
  marginBottom: spacing.xs,
},
heroTitle: {
  ...typography.editorialStyles.recipeTitle,
  color: '#FFFFFF',
  marginBottom: spacing.sm,
},
heroMeta: {
  flexDirection: 'row',
  gap: spacing.md,
},
heroMetaItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
},
heroMetaText: {
  color: 'rgba(255,255,255,0.9)',
  fontSize: 13,
},
```

Render hero:
```tsx
<View style={styles.heroContainer}>
  <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
  <LinearGradient
    colors={['transparent', 'rgba(0,0,0,0.8)']}
    style={styles.heroGradient}
  />
  <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.heroContent}>
    {recipe.meal_type && (
      <Text style={styles.heroCategory}>{recipe.meal_type.toUpperCase()}</Text>
    )}
    <Text style={styles.heroTitle}>{recipe.title}</Text>
    <View style={styles.heroMeta}>
      {recipe.total_time && (
        <View style={styles.heroMetaItem}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroMetaText}>{recipe.total_time}</Text>
        </View>
      )}
      {recipe.servings && (
        <View style={styles.heroMetaItem}>
          <MaterialCommunityIcons name="account-group-outline" size={14} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroMetaText}>{recipe.servings} servings</Text>
        </View>
      )}
    </View>
  </Animated.View>
</View>
```

### 2. Quick Info Pills

Add horizontal pill row below hero:

```typescript
quickInfoRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.sm,
  paddingHorizontal: spacing.xl,
  marginBottom: spacing.xl,
},
infoPill: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  backgroundColor: colors.primaryLight,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: borderRadius.full,
},
infoPillText: {
  ...typography.styles.caption1,
  color: colors.primary,
  fontWeight: '600',
},
```

### 3. Section Styling

Remove hard borders, use generous spacing:

```typescript
section: {
  paddingHorizontal: spacing.xl,
  marginBottom: spacing.xxxl,  // 48px between sections
},
sectionTitle: {
  ...typography.editorialStyles.sectionHeading,
  color: colors.text,
  marginBottom: spacing.lg,
},
```

### 4. Serving Adjuster Redesign

Make it more elegant:

```typescript
servingAdjuster: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.surface,
  borderRadius: borderRadius.lg,
  padding: spacing.md,
  gap: spacing.lg,
  marginBottom: spacing.xl,
  borderWidth: 1,
  borderColor: colors.border,
},
servingButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.primaryLight,
  alignItems: 'center',
  justifyContent: 'center',
},
servingButtonDisabled: {
  backgroundColor: colors.disabledBackground,
},
servingCount: {
  ...typography.editorialStyles.sectionHeading,
  color: colors.text,
  minWidth: 100,
  textAlign: 'center',
},
```

### 5. Ingredients List Redesign

More editorial, less bullet-list:

```typescript
ingredientItem: {
  flexDirection: 'row',
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.divider,
},
ingredientQuantity: {
  ...typography.editorialStyles.ingredient,
  color: colors.primary,
  fontWeight: '600',
  minWidth: 80,
},
ingredientName: {
  ...typography.editorialStyles.ingredient,
  color: colors.text,
  flex: 1,
},
```

Render:
```tsx
<View style={styles.ingredientItem}>
  <Text style={styles.ingredientQuantity}>
    {ing.quantity} {ing.unit}
  </Text>
  <Text style={styles.ingredientName}>{ing.name}</Text>
</View>
```

### 6. Instructions Redesign

More narrative, less numbered list:

```typescript
instructionItem: {
  marginBottom: spacing.xl,
},
instructionNumber: {
  ...typography.editorialStyles.byline,
  color: colors.primary,
  marginBottom: spacing.sm,
},
instructionText: {
  ...typography.editorialStyles.recipeBody,
  color: colors.text,
},
```

Render:
```tsx
<View style={styles.instructionItem}>
  <Text style={styles.instructionNumber}>STEP {index + 1}</Text>
  <Text style={styles.instructionText}>{step}</Text>
</View>
```

### 7. Start Cooking CTA

Prominent, inviting button:

```typescript
startCookingContainer: {
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.xl,
  backgroundColor: colors.background,
},
startCookingButton: {
  backgroundColor: colors.primary,
  paddingVertical: spacing.lg,
  borderRadius: borderRadius.full,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.md,
  // Subtle shadow
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 6,
},
startCookingText: {
  ...typography.styles.headline,
  color: colors.textOnPrimary,
  fontWeight: '600',
},
```

Add subtle pulse animation:
```typescript
// Optional: Animated scale that pulses gently
const pulseAnim = useSharedValue(1);

useEffect(() => {
  pulseAnim.value = withRepeat(
    withSequence(
      withTiming(1.02, { duration: 1500 }),
      withTiming(1, { duration: 1500 })
    ),
    -1,
    true
  );
}, []);

const startCookingAnimStyle = useAnimatedStyle(() => ({
  transform: [{ scale: pulseAnim.value }],
}));
```

### 8. Notes & Rating Section

Editorial card style:

```typescript
notesCard: {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.lg,
  padding: spacing.xl,
  marginHorizontal: spacing.xl,
  marginBottom: spacing.xl,
},
notesTitle: {
  ...typography.editorialStyles.cardTitle,
  color: colors.text,
  marginBottom: spacing.md,
},
```

### 9. Action Buttons

Update share, archive, delete buttons to use terracotta:

```typescript
actionButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  paddingVertical: spacing.md,
},
actionButtonText: {
  ...typography.styles.body,
  color: colors.primary,
},
```

### 10. Source Badge

Show recipe source elegantly:

```typescript
sourceBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  backgroundColor: colors.primaryLight,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: borderRadius.full,
  alignSelf: 'flex-start',
},
sourceText: {
  ...typography.styles.caption1,
  color: colors.primary,
  fontWeight: '500',
},
```

## Animation Enhancements

Add staggered entrance animations:
```typescript
// Hero fades in
<Animated.View entering={FadeIn.duration(400)}>

// Content sections stagger
<Animated.View entering={FadeInUp.delay(100).duration(400)}>
<Animated.View entering={FadeInUp.delay(200).duration(400)}>
<Animated.View entering={FadeInUp.delay(300).duration(400)}>
```

## Acceptance Criteria
- [ ] Hero image is 320px with gradient overlay and title on image
- [ ] Section titles use serif font
- [ ] Generous spacing (48px) between sections
- [ ] Ingredients show quantity/unit prominently
- [ ] Instructions have "STEP N" labels, not circular badges
- [ ] "Start Cooking" button is prominent with terracotta color
- [ ] All existing functionality preserved (share, scale, cook, archive, etc.)
- [ ] `npx tsc --noEmit` passes
- [ ] Screen scrolls smoothly with animations

## Testing
1. Navigate to any recipe detail
2. Verify hero image with overlay
3. Verify serif typography on headings
4. Test serving adjuster scaling
5. Scroll through entire recipe
6. Tap "Start Cooking" - verify navigation to CookingModeScreen
7. Test share functionality
8. Test collection modal
9. Verify on both light mode (and dark if applicable)

## Out of Scope
- Parallax scrolling effects
- Ingredient shopping links
- Step-by-step images
