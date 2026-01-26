# PRD-02: Tab Bar & Navigation Redesign

## Objective

Replace the current tab bar with the editorial glass tab bar design featuring a floating center FAB. Change "Planner" tab to "Shopping" tab.

## Reference

`/ui-redesign/screens/home_screen.html` - Tab bar section (`#tab-bar_110`)

## Design Specifications

### Tab Bar Container
```
Position: absolute bottom-8 left-6 right-6
Height: 72px
Background: white/80 with backdrop-blur-xl
Border: 1px solid white/50
Border-radius: full (pill shape)
Shadow: 0 8px 30px rgba(0,0,0,0.12)
```

### Tabs Layout
4 tabs with center FAB:
1. **Home** - `lucide:home` / `lucide:home-outline`
2. **Pantry** - `lucide:box` / `lucide:box-outline`
3. **[FAB]** - Center floating action button
4. **Shopping** - `lucide:shopping-cart` / `lucide:shopping-cart-outline` (REPLACES Planner)
5. **Recipes** - `lucide:book-open` / `lucide:book-open-outline`

### Tab Item Styles
```
Active: terracotta (#D97742)
  - Icon wrapped in bg-terracotta/10 rounded-full p-2
Inactive: brown (#7A716A)
  - Plain icon, no background
```

### Center FAB
```
Width/Height: 56px
Background: terracotta (#D97742)
Border: 4px solid white
Border-radius: full
Transform: -translate-y-6 (floats above bar)
Icon: lucide:plus (28px, white)
Shadow: lg
```

## Tasks

### 1. Update TabNavigator.tsx

Change tab configuration:
- Rename "MealPlanner" to "Shopping"
- Update component reference to ShoppingStack

### 2. Rewrite CustomTabBar.tsx

Complete rewrite to match design:

```tsx
// Key structure:
<View style={styles.container}>
  {/* Glass background */}
  <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
  <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.8)' }]} />

  {/* Tab items */}
  <View style={styles.tabsRow}>
    <TabItem name="Home" icon="home" />
    <TabItem name="Pantry" icon="box" />
    <FABButton onPress={handleQuickAdd} />
    <TabItem name="Shopping" icon="shopping-cart" />
    <TabItem name="Recipes" icon="book-open" />
  </View>
</View>
```

### 3. Update TabBarActionButton.tsx

Restyle the FAB:
- 56x56px
- Terracotta background
- 4px white border
- Negative margin to float above tab bar
- Plus icon 28px

### 4. Create ShoppingStack.tsx

New navigation stack replacing MealPlanningStack:
- ShoppingListScreen (main)
- Add item flows

### 5. Remove Header from Stack Navigators

For the editorial design, remove `CustomHeader` from:
- HomeStack.tsx
- PantryStack.tsx
- RecipeLibraryStack.tsx
- ShoppingStack.tsx

Screens will handle their own headers internally.

## Files to Modify

- `navigation/TabNavigator.tsx`
- `components/navigation/CustomTabBar.tsx`
- `components/navigation/TabBarActionButton.tsx`
- `navigation/HomeStack.tsx`
- `navigation/PantryStack.tsx`
- `navigation/RecipeLibraryStack.tsx`
- Create: `navigation/ShoppingStack.tsx`
- Delete or deprecate: `navigation/MealPlanningStack.tsx`

## Files to Delete/Deprecate

- `components/CustomHeader.tsx` (old header)
- `components/AnimatedHeader.tsx` (old header)

## Acceptance Criteria

- [ ] Tab bar has glass blur effect
- [ ] Tab bar is pill-shaped with rounded-full
- [ ] Tab bar positioned absolute bottom-8 with horizontal margins
- [ ] FAB floats above tab bar with terracotta background
- [ ] "Shopping" tab replaces "Planner"
- [ ] Icons use Lucide icon set
- [ ] Active tab has terracotta color with background highlight
- [ ] Inactive tabs are brown
- [ ] No old header visible on any screen
- [ ] Haptic feedback on tab press
