# PRD-10: Recipes Library Screen

## Objective

Update the Recipes screen with editorial card layouts, collections access, and improved browse experience.

## Reference

Design based on documented editorial style and home_screen.html patterns

## Design Specifications

### Screen Layout

#### 1. Header
```
Padding: pt-14 px-6 pb-4
Background: cream

Title: "Recipes" (serif, 32px, dark)

Actions (right):
  - Search button
  - Filter button
```

#### 2. Quick Access Bar
```
Horizontal scroll
Padding: py-4

Quick links:
  - Collections (folder icon)
  - Cookbooks (book icon)
  - Favorites (heart icon)
  - Recently Cooked

Card style:
  - White bg
  - Border: 1px creamDark
  - Border-radius: 2xl
  - Icon + label
  - Padding: p-4
  - Min-width: 100px
```

#### 3. Featured Section
```
"Featured" label (terracotta, uppercase, tracking-widest)

Featured recipe card:
  - Large format (similar to home hero)
  - Aspect: 4:5 or 16:9
  - Border-radius: 32px
  - Border: 2px dark
  - Image with gradient overlay
  - Title at bottom
```

#### 4. Recipe Grid
```
"All Recipes" section header
  - Serif, text-xl
  - "View All" link (terracotta)

2-column grid:
  - Recipe cards
  - Aspect: 1:1 or 4:5
  - Border-radius: 2xl
  - Image
  - Title below image
  - Time + category meta
  - Gap: 16px
```

#### 5. Infinite Scroll
```
Load more on scroll
Loading indicator at bottom
"You've seen all recipes" end state
```

## Tasks

### 1. Update RecipesScreen.tsx

- New editorial header
- Quick access bar
- Featured section
- Recipe grid layout
- Remove old tab-based design

### 2. Update Components

**RecipeCard.tsx:**
- New grid card design
- Image with rounded corners
- Title and metadata

**FeaturedRecipeCard.tsx:**
- Large hero card format
- Gradient overlay
- Sticker badge option

**QuickAccessBar.tsx:**
- Horizontal scroll
- Icon + label cards

### 3. Navigation

Ensure proper navigation to:
- RecipeDetailScreen
- CollectionsScreen
- CookbooksScreen
- RecipeSearchScreen

## Files to Modify

- `screens/RecipesScreen.tsx`
- `components/RecipeItem.tsx`
- `components/RecipeList.tsx`
- Create: `components/recipes/QuickAccessBar.tsx`
- Reuse: `components/editorial/FeaturedRecipeCard.tsx`

## Acceptance Criteria

- [ ] Header uses serif title
- [ ] Quick access bar scrolls horizontally
- [ ] Featured recipe has large card format
- [ ] Grid is 2 columns
- [ ] Recipe cards have rounded corners
- [ ] Infinite scroll works
- [ ] Navigation to detail screen works
- [ ] Matches editorial design language
