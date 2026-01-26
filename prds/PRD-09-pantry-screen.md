# PRD-09: Pantry Screen Refresh

## Objective

Update the Pantry screen to match the editorial design language while preserving existing functionality.

## Reference

Design based on documented editorial style guidelines (no specific prototype)

## Design Specifications

### Screen Layout

#### 1. Header
```
Padding: pt-14 px-6 pb-4
Background: cream

Title section:
  - Greeting or "My Pantry" (serif, 28px, dark)
  - Item count badge

Search bar:
  - White background
  - Border: 1px creamDark
  - Border-radius: full
  - Placeholder: "Search pantry..."
  - Search icon (brown)
```

#### 2. Category Filters
```
Horizontal scroll
Padding: py-4

Filter pills:
  - Active: terracotta bg, white text
  - Inactive: white bg, border creamDark, dark text
  - Rounded-full
  - Padding: px-4 py-2

Categories:
  - All
  - Produce
  - Dairy
  - Proteins
  - Grains
  - Spices
  - Other
```

#### 3. Pantry Items Grid/List
```
Two layout options (toggle):
  - Grid: 2 columns
  - List: full width rows

Item card:
  - White background
  - Border-radius: 2xl
  - Border: 1px creamDark
  - Shadow: sm
  - Padding: p-4

  Content:
    - Item image or icon placeholder
    - Name (font-bold, dark)
    - Quantity (brown)
    - Expiration indicator:
      - Green: fresh
      - Yellow: use soon
      - Red: expired

Swipe actions:
  - Edit quantity
  - Delete
```

#### 4. Add Item FAB
```
Position: absolute bottom-24 right-6
(Above tab bar)

56x56, rounded-full
Background: terracotta
Icon: plus (white)
Shadow: lg
```

#### 5. Empty State
```
Centered:
  - Box/pantry illustration
  - "Your pantry is empty" (serif)
  - "Add items to track what you have"
  - CTA: "Add First Item"
```

## Tasks

### 1. Update PantryScreen.tsx

- Remove old header
- Add new editorial header
- Add category filters
- Update item card design
- Add grid/list toggle

### 2. Update Components

**PantryHeader.tsx:**
- Search bar
- Title

**PantryFilters.tsx:**
- Horizontal pill filters

**PantryItemCard.tsx:**
- New card design
- Expiration indicator
- Quantity display

### 3. Maintain Existing Functionality

- Add to pantry flow
- Edit quantity
- Remove items
- Search functionality

## Files to Modify

- `screens/PantryScreen.tsx`
- `components/PantryList.tsx`
- `components/PantryItemComponent.tsx`
- Create: `components/pantry/PantryHeader.tsx`
- Create: `components/pantry/PantryFilters.tsx`
- Create: `components/pantry/PantryItemCard.tsx`

## Acceptance Criteria

- [ ] No old CustomHeader visible
- [ ] Search bar has pill shape
- [ ] Category filters horizontally scrollable
- [ ] Active filter uses terracotta
- [ ] Item cards match editorial style
- [ ] Expiration indicators present
- [ ] Swipe actions work
- [ ] FAB positioned above tab bar
- [ ] Empty state styled correctly
