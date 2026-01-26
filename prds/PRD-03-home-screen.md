# PRD-03: Home Screen (Want to Cook Queue)

## Objective

Complete redesign of the home screen to match the editorial "On The Menu" design with featured hero card, queue list, and grocery teaser.

## Reference

`/ui-redesign/screens/home_screen.html`

## Design Specifications

### Screen Layout (top to bottom)

#### 1. Header Section (`#header_100`)
```
Padding: pt-14 (safe area) px-6 pb-4
Background: cream (#FBF9F5)

Left side:
  - Label: "Bon Appétit" (terracotta, uppercase, tracking-widest, text-xs, font-bold)
  - Greeting: "Good Evening, {Name}" (serif, text-2xl, dark)

Right side:
  - Avatar: 40x40 rounded-full
    - If has image: show image
    - Else: sage background with initials
    - Border: 2px dark
```

#### 2. Hero Section (`#hero-section_102`)
```
Padding: px-6 mb-8

Title row:
  - "On The\nMenu" (serif, 32px, line-height: none)
  - Badge: "3 Recipes" (dark bg, cream text, rounded-full, text-xs)

Featured Card (#featured-card_104):
  - Aspect ratio: 4:5
  - Border-radius: 32px
  - Border: 2px solid dark
  - Shadow: xl
  - Overflow: hidden

  Inside card:
    - Full-bleed recipe image
    - Sticker tag (top-right):
      - Terracotta circle (64x64)
      - Rotated 12deg
      - "35 MIN" text (white, bold)
      - White border
    - Gradient overlay (bottom):
      - from-deepBrown/90 via-deepBrown/50 to-transparent
      - pt-20 for fade
    - Recipe title (serif, 24px, cream)
    - Tags: "French", "Vegetarian" (white/20 bg, backdrop-blur, rounded-md)
```

#### 3. Queue Section (`#queue-section_106`)
```
Padding: px-6 mb-8

Header:
  - "Up Next" (serif, text-xl, dark)
  - Horizontal line divider (h-[1px], dark, opacity-20)

Queue Items:
  - White background
  - Padding: p-3
  - Border-radius: 2xl
  - Border: 1px creamDark
  - Shadow: sm
  - Margin-bottom: mb-4

  Item layout (flex row):
    - Thumbnail: 80x80, rounded-xl, border creamDark
    - Info (flex-1):
      - Title: serif, text-lg, dark
      - Meta: clock icon + "45 min" + dot + "Italian" (brown, text-xs)
    - Action button: 40x40, rounded-full, border creamDark
      - Chef hat icon (terracotta)
      - On press: terracotta bg, white icon
```

#### 4. Grocery Teaser (`#grocery-teaser_109`)
```
Padding: px-6

Container:
  - Background: sage (#A8BCA0)
  - Border-radius: 2xl
  - Padding: p-5
  - Flex row, justify-between, items-center

Decorative circle:
  - Position: absolute -right-6 -top-6
  - 96x96
  - White, opacity-20, rounded-full

Content (left):
  - Title: "Missing 4 items" (serif, text-xl, font-bold, dark)
  - Subtitle: "For this week's plan" (text-xs, opacity-80, uppercase, tracking-wide)

Button (right):
  - "View List"
  - Dark background, white text
  - Rounded-full
  - px-5 py-2.5
```

### Empty State

When no recipes in queue:
- Chef hat illustration (or similar warm icon)
- Serif headline: "Your cooking queue is empty"
- Body text explaining the feature
- CTA: "Import Your First Recipe" (terracotta, pill button)

## Tasks

### 1. Create New WantToCookScreen.tsx

Complete rewrite:
- Remove old CustomHeader usage
- Implement new header with greeting and avatar
- Hero section with featured recipe card
- Queue list with new card design
- Grocery teaser section
- New empty state design

### 2. Create Supporting Components

**FeaturedRecipeCard.tsx:**
- 4:5 aspect ratio card
- Sticker time badge
- Gradient title overlay
- Tags display

**QueueRecipeItem.tsx:**
- Horizontal card layout
- Thumbnail, title, meta, action button
- Swipe actions (archive, delete, mark cooked)

**GroceryTeaser.tsx:**
- Sage background card
- Missing items count
- "View List" button

**ScreenHeader.tsx:**
- Reusable header with greeting pattern
- Avatar component
- Flexible left/right accessories

### 3. Update useUser Hook

Ensure it provides:
- User's first name for greeting
- Avatar image URL (if available)
- User initials fallback

## Files to Create/Modify

- `screens/WantToCookScreen.tsx` (rewrite)
- Create: `components/editorial/FeaturedRecipeCard.tsx`
- Create: `components/editorial/QueueRecipeItem.tsx`
- Create: `components/editorial/GroceryTeaser.tsx`
- Create: `components/editorial/ScreenHeader.tsx`

## Acceptance Criteria

- [ ] Header shows greeting with time of day
- [ ] Avatar displays user image or initials
- [ ] "On The Menu" title uses serif font at 32px
- [ ] Featured card has 4:5 aspect ratio with 32px border radius
- [ ] Sticker badge rotated 12 degrees in terracotta
- [ ] Queue items have horizontal layout with thumbnails
- [ ] Grocery teaser has sage background
- [ ] Empty state has serif headline
- [ ] All buttons are pill-shaped
- [ ] Proper safe area handling (pt-14)
