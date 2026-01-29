# PRD: Phase 5 - Browse Experience Redesign

## Objective
Transform HomeScreen and RecipesScreen into editorial magazine-style browsing experiences with featured content, warm aesthetics, and inviting empty states.

## Prerequisites
- Phase 1-4 complete

## Scope

### Part A: HomeScreen Redesign
**File:** `screens/HomeScreen.tsx`

#### 1. Add Featured Recipe Section
At the top of the scroll view, before pantry content:

```typescript
// Add state for featured recipe
const [featuredRecipe, setFeaturedRecipe] = useState<Recipe | null>(null);

// Fetch a featured recipe (most recent or random from want-to-cook)
useEffect(() => {
  const loadFeatured = async () => {
    try {
      const recipes = await fetchRecipes({ page: 1, limit: 1 });
      if (recipes.data.length > 0) {
        setFeaturedRecipe(recipes.data[0]);
      }
    } catch (err) {
      console.log('No featured recipe available');
    }
  };
  loadFeatured();
}, []);
```

Render in ScrollView:
```tsx
{featuredRecipe && (
  <Animated.View entering={FadeIn.duration(400)} style={styles.featuredSection}>
    <Text style={styles.featuredLabel}>TODAY'S RECIPE</Text>
    <FeaturedRecipeCard
      recipe={featuredRecipe}
      variant="hero"
      onPress={() => navigation.navigate('RecipeDetail', { id: featuredRecipe.id })}
    />
  </Animated.View>
)}
```

Styles:
```typescript
featuredSection: {
  marginBottom: spacing.xl,
},
featuredLabel: {
  ...typography.editorialStyles.byline,
  color: colors.textSecondary,
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.md,
},
```

#### 2. Update Section Headers

```typescript
sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.md,
  marginTop: spacing.xl,
},
sectionTitle: {
  ...typography.editorialStyles.sectionHeading,
  color: colors.text,
},
```

#### 3. Update Empty State

If no pantry items:
```tsx
<EmptyState
  icon="basket-outline"
  title="Your Pantry is Empty"
  subtitle="Add ingredients to see what you can make"
  action={{
    label: "Add to Pantry",
    onPress: handleAddToPantryPress,
    icon: "plus",
  }}
/>
```

#### 4. Update Bottom Buttons

```typescript
buttonRow: {
  flexDirection: 'row',
  gap: spacing.md,
},
importButton: {
  flex: 1,
  borderColor: colors.primary,
  borderRadius: borderRadius.full,  // Pill shape
},
addButton: {
  flex: 1,
  borderRadius: borderRadius.full,
},
```

Ensure `buttonColor={colors.primary}` on contained button.

---

### Part B: RecipesScreen Redesign
**File:** `screens/RecipesScreen.tsx`

#### 1. Add Featured Hero at Top

Similar to HomeScreen, add a featured recipe from user's collection:

```tsx
{userRecipes.length > 0 && (
  <Animated.View entering={FadeIn.duration(400)} style={dynamicStyles.heroSection}>
    <FeaturedRecipeCard
      recipe={userRecipes[0]}
      variant="hero"
      onPress={() => handlePressRecipe(userRecipes[0])}
    />
  </Animated.View>
)}
```

#### 2. Update RecipeListComponent Usage

The RecipeListComponent (RecipeList.tsx) should use editorial styling. Since we're keeping backwards compatibility, update the styling within RecipesScreen:

```typescript
// Section styling
sectionHeader: {
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.md,
  marginTop: spacing.xl,
},
sectionTitle: {
  ...typography.editorialStyles.sectionHeading,
  color: colors.text,
},
sectionSubtitle: {
  ...typography.editorialStyles.byline,
  color: colors.textSecondary,
  marginTop: spacing.xs,
},
```

#### 3. Update Bottom Button Bar

```typescript
buttonContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  padding: spacing.lg,
  backgroundColor: colors.background,
  borderTopWidth: 1,
  borderTopColor: colors.border,
  gap: spacing.md,
},
button: {
  flex: 1,
  height: 48,
  justifyContent: 'center',
  borderRadius: borderRadius.full,  // Pill shape
},
containedButton: {
  backgroundColor: colors.primary,
},
```

#### 4. Empty State for No Recipes

```tsx
{userRecipes.length === 0 && !loading.user && (
  <EmptyState
    icon="book-open-page-variant-outline"
    title="No Recipes Yet"
    subtitle="Import a recipe from TikTok, YouTube, or your favorite blog"
    action={{
      label: "Import Recipe",
      onPress: () => navigation.navigate('ImportRecipe'),
      icon: "link-variant",
    }}
  />
)}
```

---

### Part C: Tab Bar Refinement
**File:** `components/navigation/CustomTabBar.tsx`

#### 1. Update Colors

```typescript
// Update tab item colors
tabBarActive: colors.primary,  // Terracotta
tabBarInactive: colors.textTertiary,
```

#### 2. Update Active Indicator

```typescript
activeIndicator: {
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.primary,
  marginTop: spacing.xs,
},
```

#### 3. Warm Background

```typescript
tabBarContainer: {
  backgroundColor: colors.tabBarBackground,
  borderTopColor: colors.tabBarBorder,
  // ... existing styles
},
```

---

### Part D: EmptyState Enhancement
**File:** `components/ui/EmptyState.tsx`

#### 1. Update Typography

```typescript
<Text style={[
  styles.title,
  typography.editorialStyles.sectionHeading,  // Serif
  { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
]}>
  {title}
</Text>
```

#### 2. Update Icon Styling

```typescript
iconContainer: {
  backgroundColor: colors.primaryLight,  // Warm terracotta tint
  padding: spacing.xl,
  borderRadius: borderRadius.full,
  marginBottom: spacing.lg,
},
```

Wrap icon in styled container:
```tsx
<View style={styles.iconContainer}>
  <MaterialCommunityIcons
    name={icon}
    size={iconSize}
    color={colors.primary}  // Terracotta
  />
</View>
```

#### 3. Ensure Button Colors

Already done in earlier phase, but verify:
```tsx
<Button
  mode="contained"
  buttonColor={colors.primary}
  textColor={colors.textOnPrimary}
  // ...
>
```

---

### Part E: Update RecipeItem/RecipeList (Optional Enhancement)
**File:** `components/RecipeItem.tsx` and `components/RecipeList.tsx`

Update card styling to match editorial aesthetic:

```typescript
// RecipeItem card
cardContainer: {
  backgroundColor: colors.card,
  borderRadius: borderRadius.lg,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: isDark ? 0.3 : 0.1,
  shadowRadius: 12,
  elevation: 4,
},
cardTitle: {
  ...typography.editorialStyles.cardTitle,
  color: colors.text,
},
cardMeta: {
  ...typography.styles.caption1,
  color: colors.textSecondary,
},
```

## Acceptance Criteria
- [ ] HomeScreen shows featured recipe hero when recipes exist
- [ ] RecipesScreen shows featured hero from user's collection
- [ ] Section titles use serif typography
- [ ] Empty states have warm icon container and serif title
- [ ] All buttons use terracotta color
- [ ] Tab bar uses terracotta for active state
- [ ] Pill-shaped buttons throughout
- [ ] `npx tsc --noEmit` passes
- [ ] Smooth navigation between all screens

## Testing
1. Fresh app state - verify empty states look warm and inviting
2. Add a recipe - verify it appears in featured hero
3. Navigate through all tabs
4. Verify tab bar colors update correctly
5. Test all buttons are terracotta
6. Verify recipe cards have editorial styling
7. Pull to refresh works
8. Pagination works on recipe lists

## Out of Scope
- Recipe categories/tags filtering
- Search UI redesign
- Profile/settings screens
- Onboarding flow
