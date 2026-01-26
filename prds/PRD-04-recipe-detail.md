# PRD-04: Recipe Detail Screen

## Objective

Redesign the recipe detail screen with hero image, metadata pills, ingredient checkboxes, and prominent "Start Cooking" CTA.

## Reference

`/ui-redesign/screens/recipe_detail.html`

## Design Specifications

### Screen Layout

#### 1. Hero Image Area (`#hero-image_200`)
```
Height: 40% of screen
Width: full
Background: Recipe image (object-cover)

Gradient overlay:
  - from-deepBrown via-transparent to-transparent
  - opacity-80

Navigation controls (absolute, top-14, px-6):
  Left: Back button
    - 40x40, rounded-full
    - bg-white/20, backdrop-blur-md
    - White arrow icon
  Right: Save + More buttons
    - Same styling as back button
    - Bookmark and more-horizontal icons

Hero title content (absolute, bottom-8, px-6):
  - Category tag: "Italian Classic"
    - Sage background, deepBrown text
    - text-[10px], uppercase, tracking-widest
    - Rounded-sm, px-3 py-1
    - Transform: -rotate-1
  - Title: "Artisan Prosciutto & Arugula Pizza"
    - Serif, text-4xl, cream
    - Drop shadow
  - Author: "By Bon Appétit Test Kitchen"
    - Cream, opacity-80, text-sm
```

#### 2. Scrollable Content Area
```
Background: cream (#FBF9F5)
Border-radius: rounded-t-[32px]
Margin-top: -mt-6 (overlaps hero)
Shadow: [0_-10px_40px_rgba(0,0,0,0.1)]
Padding: pt-8 px-6 pb-28 (room for footer)
```

#### 3. Metadata Pills (`#metadata-row_204`)
```
Flex row, gap-3, horizontal scroll
Margin-bottom: mb-8

Each pill:
  - White background
  - Border: 1px creamDark
  - Padding: px-4 py-2
  - Border-radius: full
  - Shadow: sm

  Icon (terracotta) + text (dark, text-sm, font-bold)

Pills:
  - Clock icon + "45 min"
  - Users icon + "2 people"
  - Flame icon + "650 kcal"
```

#### 4. Ingredients Section (`#ingredients-section_205`)
```
Margin-bottom: mb-8

Header row:
  - "Ingredients" (serif, text-2xl, dark)
  - "Scale: 2x" button (terracotta, text-xs, uppercase)

Ingredient list:
  Space-y-3

  Each ingredient:
    - White background
    - Padding: p-3
    - Border-radius: xl
    - Border: transparent (hover: creamDark)

    Layout:
      - Checkbox: 20x20, rounded, border-2 sage
        - Checked: sage fill with white checkmark
      - Text: "500g" (bold, dark) + "Pizza dough (room temp)" (brown)
```

#### 5. Instructions Preview (`#instructions-preview_210`)
```
Margin-bottom: mb-6

Title: "Preparation" (serif, text-2xl, dark)

Step card:
  - Background: creamDark/30
  - Padding: p-5
  - Border-radius: 2xl
  - Border-left: 4px terracotta

  Step label: "Step 1" (terracotta, font-bold, text-xs, uppercase)
  Step text: (dark, leading-relaxed)
```

#### 6. Floating Footer CTA (`#footer-cta_211`)
```
Position: absolute bottom-0 left-0 right-0
Padding: p-6
Background: gradient from-white via-white to-transparent
Padding-top: pt-12 (fade effect)

"Start Cooking" button:
  - Width: full
  - Height: 60px
  - Background: terracotta
  - Text: white, serif, text-xl
  - Border-radius: full
  - Shadow: xl shadow-terracotta/30
  - Border: 2px terracotta

  Layout: flex between
    - Left: "Start Cooking" text (pl-8)
    - Right: White circle (44x44) with play icon (terracotta)
```

## Tasks

### 1. Rewrite RecipeDetailScreen.tsx

Complete overhaul:
- Hero image section with overlays
- Metadata pills row
- Ingredients with checkboxes
- Instructions preview
- Floating CTA

### 2. Create Components

**RecipeHero.tsx:**
- Image with gradient overlay
- Navigation buttons
- Title and author

**MetadataPills.tsx:**
- Horizontal scrolling pills
- Time, servings, calories

**IngredientList.tsx:**
- Checkable ingredients
- Scale functionality
- Checkbox animations

**StartCookingButton.tsx:**
- Pill button with embedded play icon
- Shadow and press animation

### 3. Update Navigation

- Ensure RecipeDetailScreen receives recipe data
- Navigation to CookingModeScreen on "Start Cooking"

## Files to Modify

- `screens/RecipeDetailScreen.tsx` (complete rewrite)
- Create: `components/recipe/RecipeHero.tsx`
- Create: `components/recipe/MetadataPills.tsx`
- Create: `components/recipe/IngredientList.tsx`
- Create: `components/recipe/StartCookingButton.tsx`

## Acceptance Criteria

- [ ] Hero image takes 40% of screen height
- [ ] Gradient overlay from deepBrown
- [ ] Navigation buttons have glass blur effect
- [ ] Category tag is rotated -1 degree
- [ ] Content area overlaps hero with rounded top
- [ ] Metadata pills horizontally scrollable
- [ ] Ingredients have sage checkbox borders
- [ ] Instructions preview has terracotta left border
- [ ] "Start Cooking" button has embedded play icon
- [ ] Floating footer has gradient fade
