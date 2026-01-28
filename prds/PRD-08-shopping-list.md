# PRD-08: Shopping List Screen

## Objective

Create a new Shopping List screen to replace the Meal Planner tab, with categorized items, checkboxes, and grocery service integration.

## Reference

Mentioned in PROJECT_DOCUMENTATION.md as `shopping_list.html` (not included in prototype files - design based on documented specs)

## Design Specifications

### Screen Layout

#### 1. Header
```
Padding: pt-14 px-6 pb-4
Background: cream

Title section:
  - "Shopping" (serif, 32px, dark)
  - Recipe count badge: "From 3 recipes" (dark bg, cream text, rounded-full)

Action buttons (right):
  - Share button (40x40, rounded-full, border creamDark)
  - Clear completed button
```

#### 2. Category Sections
```
Each category:
  - Header: Category name (serif, text-xl, dark)
  - Horizontal line divider
  - Items list

Categories:
  - Produce
  - Dairy & Eggs
  - Meat & Seafood
  - Pantry Staples
  - Frozen
  - Other
```

#### 3. Shopping Item
```
Flex row, items-center
Padding: p-4
Background: white
Border-radius: xl
Border: 1px creamDark
Margin-bottom: mb-2

Checkbox:
  - 24x24, rounded
  - Border: 2px sage
  - Checked: sage fill, white checkmark
  - Strikethrough text when checked

Item text:
  - Quantity: font-bold, dark (e.g., "500g")
  - Name: brown (e.g., "Cherry tomatoes")

Source indicator:
  - Small recipe thumbnail or recipe name
  - text-xs, opacity-60

Swipe action:
  - Delete item
```

#### 4. Grocery Service Integration
```
Position: sticky bottom
Background: white with top shadow

"Order Groceries" section:
  - Service logos: Instacart, Amazon Fresh, Walmart
  - Tap to open respective app/link

OR simple CTA:
  - "Send to Instacart" button
  - Terracotta, rounded-full
```

#### 5. Empty State
```
Centered content:
  - Shopping cart illustration
  - "Nothing to buy" (serif, text-2xl)
  - "Add recipes to your queue to generate a shopping list"
  - CTA: "Browse Recipes" (terracotta, rounded-full)
```

## Tasks

### 1. Create ShoppingListScreen.tsx

Main screen with:
- Header with title and actions
- Categorized item list
- Empty state
- Grocery integration footer

### 2. Create ShoppingStack.tsx

Navigation stack:
- ShoppingListScreen (main)
- AddItemScreen (manual add)

### 3. Create Components

**ShoppingHeader.tsx:**
- Title, recipe count, actions

**ShoppingCategory.tsx:**
- Category header with divider
- Items list

**ShoppingItem.tsx:**
- Checkbox, quantity, name
- Swipe to delete
- Source indicator

**GroceryServiceBar.tsx:**
- Service logos/buttons
- Deep link handling

### 4. Data Integration

Connect to existing grocery list data:
- Aggregate ingredients from queued recipes
- Group by category
- Track checked state
- Persist completed items

### 5. Update TabNavigator

Replace MealPlanner with Shopping:
```tsx
<Tab.Screen
  name="Shopping"
  component={ShoppingStack}
  options={{ title: 'Shopping' }}
/>
```

## Files to Create

- `screens/ShoppingListScreen.tsx`
- `navigation/ShoppingStack.tsx`
- `components/shopping/ShoppingHeader.tsx`
- `components/shopping/ShoppingCategory.tsx`
- `components/shopping/ShoppingItem.tsx`
- `components/shopping/GroceryServiceBar.tsx`

## Files to Modify

- `navigation/TabNavigator.tsx` - Replace MealPlanner with Shopping
- Potentially reuse/adapt `screens/GroceryListScreen.tsx`

## Files to Deprecate

- `navigation/MealPlanningStack.tsx`
- `screens/MealPlannerScreen.tsx` (or keep for future)

## Acceptance Criteria

- [ ] Shopping tab appears in tab bar (replaces Planner)
- [ ] Items grouped by category
- [ ] Checkboxes use sage color
- [ ] Checked items show strikethrough
- [ ] Swipe to delete works
- [ ] Empty state shows when no items
- [ ] Recipe source shown per item
- [ ] Grocery service integration present
- [ ] Matches editorial design language
