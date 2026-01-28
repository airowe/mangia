# Mangia Screen Implementation PRD

## Overview
Implement new screens from the `/ui-redesign/stitch_recipe_library/` design files. Each screen has a `code.html` design reference and `screen.png` visual reference.

## Design System Reference
- **Primary Color (Terracotta):** #D97742
- **Sage (Secondary):** #A8BCA0
- **Cream Background:** #FBF9F5
- **Dark Text:** #3A322C
- **Deep Brown:** #2A1F18
- **Typography:** Georgia (serif headlines), System (body)

## Implementation Checklist

### Phase 1: Recipe Import Flow
- [x] **ImportRecipeScreen** - Update to match `import_recipe_via_url_1` and `import_recipe_via_url_2` designs
  - Centered headline "Import a Recipe"
  - URL input with paste button
  - Recently added recipes horizontal scroll
  - Design path: `import_recipe_via_url_1/code.html`, `import_recipe_via_url_2/code.html`

- [x] **RecipeImportProgressScreen** - New screen matching `recipe_import_progress` design
  - "Importing..." headline with serif italic
  - Animated progress bar with percentage
  - Status text "Extracting ingredients..."
  - Cancel button
  - Design path: `recipe_import_progress/code.html`

### Phase 2: Recipe Library
- [x] **RecipesScreen** - Update to match `recipe_library_1`, `recipe_library_2`, `recipe_library_3` designs
  - "Your Library" headline
  - Search bar with filters (All, Favorites, Quick & Easy, etc.)
  - 2-column grid with asymmetric rounded corner cards
  - Recipe cards with image, title, cook time, difficulty
  - Collections view variant
  - Design path: `recipe_library_1/code.html`, `recipe_library_2/code.html`, `recipe_library_3/code.html`

### Phase 3: Pantry Management
- [x] **PantryScreen** - Update to match `pantry_inventory_1`, `pantry_inventory_2` designs
  - "The Pantry" headline with italic accent
  - Search bar with filter
  - Category pills (All, Dry Goods, Spices, Refrigerated, Produce)
  - Item cards with quantity controls (+/-)
  - Stock level indicators
  - 2-column grid for spices
  - Design path: `pantry_inventory_1/code.html`, `pantry_inventory_2/code.html`

- [x] **EmptyPantryState** - Component for `empty_pantry_state` design
  - Illustration of floating shelves
  - "Your Pantry is Quiet" headline
  - Scan Your Pantry button
  - Add items manually link
  - Design path: `empty_pantry_state/code.html`

- [x] **ManualItemEntryScreen** - New screen for `manual_item_entry` design
  - "New Pantry Item" header
  - Item name input
  - Category pills (Spices, Dairy, Produce, Baking)
  - Quantity + Unit fields
  - Expiration date picker
  - Essential item toggle
  - Design path: `manual_item_entry/code.html`

### Phase 4: AI Scanner
- [x] **AIPantryScannerScreen** - New screen for `ai_pantry_scanner_1`, `ai_pantry_scanner_2` designs
  - Full-screen camera with viewfinder overlay
  - Corner marker reticle
  - "AI Vision Active" status pill with pulsing dot
  - Floating ingredient detection tags
  - Shutter button, flash toggle, recent scan thumbnail
  - Design path: `ai_pantry_scanner_1/code.html`, `ai_pantry_scanner_2/code.html`

- [x] **ConfirmScannedItemsScreen** - New screen for `confirm_scanned_items` designs
  - Hero image with "Original Scan" badge
  - "Review Scan" headline with item count
  - Item cards with checkbox, thumbnail, name, category, quantity
  - States: confirmed, needs review (orange), excluded
  - "Add Item Manually" button
  - "Confirm & Add Items" footer button
  - Design path: `confirm_scanned_items/code.html`, `confirm_scanned_items_with_expiry/code.html`

### Phase 5: Alerts & Notifications
- [x] **KitchenAlertsScreen** - New screen for `expired_items_alerts` design
  - "Kitchen Alerts" header
  - Category filter pills
  - Expired Items section (terracotta accent)
  - Expiring Soon section (sage accent)
  - Item cards with delete/action buttons
  - Design path: `expired_items_alerts/code.html`

- [x] **ExpiringNotificationComponent** - Component for `expiring_items_notification` design
  - Lock screen style notification card
  - App icon, timestamp, thumbnail
  - Action buttons: View Recipes, Add to Shopping List
  - Design path: `expiring_items_notification/code.html`

### Phase 6: Grocery List
- [x] **GroceryListScreen** - Update to match `grocery_shopping_list_1`, `grocery_shopping_list_2`, `grocery_shopping_list_3` designs
  - "Shopping List" header
  - "Your Weekly Market Haul" headline
  - Categorized lists (Produce, Dairy, Pantry) OR Recipe-based organization
  - Custom checkbox items with strikethrough on checked
  - "Shop Ingredients" footer button
  - Design path: `grocery_shopping_list_1/code.html`, `grocery_shopping_list_2/code.html`, `grocery_shopping_list_3/code.html`

### Phase 7: What Can I Make
- [x] **WhatCanIMakeScreen** - Update to match `what_can_i_make?_1`, `what_can_i_make?_2` designs
  - "What can I make?" headline (serif italic)
  - Search input for ingredients
  - Active ingredient pills (sage, removable)
  - "Matching Recipes" section with count
  - Recipe cards with match badges (Perfect Match, Missing X)
  - Design path: `what_can_i_make?_1/code.html`, `what_can_i_make?_2/code.html`

### Phase 8: Account Settings
- [x] **AccountScreen** - Update to match `user_account_settings_1`, `user_account_settings_2` designs
  - Large circular avatar with Pro badge
  - User name (serif italic)
  - Member since text
  - Settings menu: Profile, Dietary Preferences, Subscription, Help
  - Log Out button
  - App version
  - Design path: `user_account_settings_1/code.html`, `user_account_settings_2/code.html`

## Implementation Guidelines

1. **Read the HTML design file** before implementing each screen
2. **Match the exact styling** - colors, spacing, typography, border-radius
3. **Use existing components** from `/components/` where possible
4. **Create new components** in appropriate folders when needed
5. **Follow the design system** from `/theme/tokens/colors.ts`
6. **Use Reanimated** for animations (FadeIn, etc.)
7. **Test TypeScript compilation** after each screen

## File Organization
- Screens go in `/screens/`
- Reusable components go in `/components/[feature]/`
- Update navigation in `/navigation/` as needed

## Completion Criteria
- All screens match their HTML design references
- TypeScript compiles without errors
- Screens are properly navigable
- Animations match design intent
