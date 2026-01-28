# Feature Requirements

## Priority Levels

- **P0** — Must have for submission (core MVP)
- **P1** — Should have (strong differentiator)
- **P2** — Nice to have (premium features)
- **P3** — Future roadmap (post-competition)

---

## P0: Core MVP Features

### F1: Recipe URL Import

**User Story:** As a user, I want to paste a recipe URL and have the app automatically extract the recipe details and ingredients.

**Acceptance Criteria:**
- [ ] Text input field to paste URL
- [ ] Support for blog URLs (via Firecrawl)
- [ ] Support for TikTok video URLs
- [ ] Support for YouTube video URLs
- [ ] Support for Instagram Reel URLs
- [ ] Loading state while processing
- [ ] Error handling for invalid/unsupported URLs
- [ ] Preview extracted recipe before saving
- [ ] Edit extracted ingredients before saving

**Eitan Quote:** *"Give the app a link to a video you saw... and it will actually write a food list for you"*

**Technical Notes:**
- Blog URLs → Firecrawl API (already implemented in grosheries)
- Video URLs → Extract transcript → Claude API → structured recipe
- See `04-SERVICES-AND-APIs.md` for implementation details

---

### F2: Want to Cook Queue

**User Story:** As a user, I want to save recipes I plan to cook and see them in a queue.

**Acceptance Criteria:**
- [ ] Home screen shows "Want to Cook" list
- [ ] Each recipe card shows: title, image, source icon (TikTok/YouTube/blog)
- [ ] Tap recipe to view details
- [ ] Swipe to mark as "Cooked" or "Archive"
- [ ] Recipe count badge
- [ ] Empty state with prompt to add first recipe

**Eitan Quote:** *"recipes that they want to make"*

**Technical Notes:**
- Recipe status enum: `want_to_cook`, `cooked`, `archived`
- Filter home screen by `status = 'want_to_cook'`
- Adapt existing `RecipesScreen` from grosheries

---

### F3: Pantry Tracking ("What I Have")

**User Story:** As a user, I want to track what ingredients I already have at home.

**Acceptance Criteria:**
- [ ] List view of pantry items
- [ ] Add item manually (name, quantity, unit)
- [ ] Quick add from common items
- [ ] Edit quantity
- [ ] Delete item (swipe)
- [ ] Search/filter pantry
- [ ] Category grouping (produce, dairy, meat, pantry, etc.)

**Eitan Quote:** *"I have chicken, broccoli... in the fridge... this is what I have in the kitchen"*

**Technical Notes:**
- Reuse `lib/pantry.ts` from grosheries (already implemented)
- Reuse `PantryItem` model from grosheries

---

### F4: Grocery List Generation

**User Story:** As a user, I want to generate a grocery list from my queued recipes, excluding items I already have.

**Acceptance Criteria:**
- [ ] "Generate List" button on home screen
- [ ] Consolidate ingredients from all "Want to Cook" recipes
- [ ] Check each ingredient against pantry
- [ ] Show items to buy (not in pantry)
- [ ] Optionally show "Already have" section (collapsed)
- [ ] Group by store section (Produce, Dairy, Meat, etc.)
- [ ] Check off items while shopping
- [ ] Show which recipes need each ingredient
- [ ] Clear completed items

**Eitan Quote:** *"it will actually write a food list for you that you can go grocery shopping with"*

**Technical Notes:**
- Implement `generateGroceryList()` in `lib/groceryList.ts`
- Normalize ingredient names for matching
- Categorize ingredients for store layout

---

### F5: Recipe Detail View

**User Story:** As a user, I want to view a saved recipe's full details.

**Acceptance Criteria:**
- [ ] Recipe title and image
- [ ] Source URL (tappable link)
- [ ] Prep time, cook time, servings
- [ ] Full ingredient list with quantities
- [ ] Step-by-step instructions
- [ ] "Add to Grocery List" button
- [ ] "Mark as Cooked" button
- [ ] Share recipe link
- [ ] Delete recipe

**Technical Notes:**
- Adapt existing `RecipeDetailScreen` from grosheries

---

### F6: User Authentication

**User Story:** As a user, I want to create an account and log in to sync my data.

**Acceptance Criteria:**
- [ ] Email/password sign up
- [ ] Email/password login
- [ ] Password reset flow
- [ ] Social login (Apple, Google) — nice to have
- [ ] Persist session across app restarts
- [ ] Logout functionality

**Technical Notes:**
- Reuse `lib/supabase.ts` and `lib/auth.ts` from grosheries
- Reuse `AuthScreen` from grosheries

---

## P1: Strong Differentiators

### F7: Multi-Recipe Grocery List

**User Story:** As a user, I want to combine ingredients from multiple recipes into one consolidated grocery list.

**Acceptance Criteria:**
- [ ] Select multiple recipes to include in list
- [ ] Combine duplicate ingredients (e.g., 2 recipes need eggs → show total)
- [ ] Handle unit conversions where possible
- [ ] Show recipe source for each ingredient

**Eitan Quote:** *"different videos you've seen on the Internet"*

**Technical Notes:**
- Extend `generateGroceryList()` to accept recipe array
- Implement ingredient quantity merging logic

---

### F8: iOS Share Extension

**User Story:** As a user, I want to share a recipe URL directly from Safari/TikTok/Instagram to the app.

**Acceptance Criteria:**
- [ ] Share extension appears in iOS share sheet
- [ ] Accepts URLs from supported platforms
- [ ] Opens app with URL pre-filled
- [ ] Quick save flow without opening full app

**Technical Notes:**
- Expo share extension implementation
- May be complex — evaluate time vs. benefit

---

### F9: Manual Recipe Entry

**User Story:** As a user, I want to manually add a recipe when URL import doesn't work.

**Acceptance Criteria:**
- [ ] Form for recipe title
- [ ] Add ingredients (name, quantity, unit)
- [ ] Add instructions (step-by-step)
- [ ] Optional: prep time, cook time, servings
- [ ] Optional: add photo from camera/library
- [ ] Save to "Want to Cook" queue

**Technical Notes:**
- Adapt existing `RecipeCreateScreen` from grosheries

---

## P2: Premium Features

### F10: "What Can I Make?" (Premium)

**User Story:** As a premium user, I want to see which of my saved recipes I can make with what's in my pantry.

**Acceptance Criteria:**
- [ ] Button on Pantry screen: "What Can I Make?"
- [ ] Scan saved recipes against current pantry
- [ ] Show recipes where user has 80%+ of ingredients
- [ ] Show missing ingredients for each match
- [ ] Filter by "complete match" vs "almost complete"

**Eitan Quote:** *"are there any recipes in my cookbooks that have that in it?"*

**Technical Notes:**
- Query recipes, compare ingredients to pantry
- Calculate match percentage
- Premium feature — gate behind paywall

---

### F11: Cookbook Collection (Premium)

**User Story:** As a premium user, I want to track which cookbooks I own.

**Acceptance Criteria:**
- [ ] Add cookbook (title, author, optional cover image)
- [ ] View cookbook library
- [ ] Search/filter cookbooks
- [ ] Delete cookbook
- [ ] Future: link recipes to cookbooks

**Eitan Quote:** *"tell some app all the cookbooks I have in my collection"*

**Technical Notes:**
- New `cookbooks` table in Supabase
- Premium feature — gate behind paywall
- Foundation for future cookbook-recipe integration

---

### F12: Serving Size Scaling (Premium)

**User Story:** As a premium user, I want to adjust the serving size and have ingredient quantities update automatically.

**Acceptance Criteria:**
- [ ] Serving size selector on recipe detail
- [ ] Recalculate all ingredient quantities
- [ ] Update grocery list with scaled amounts

**Technical Notes:**
- Store original servings, calculate multiplier
- Premium feature

---

### F13: Grocery List Export/Share (Premium)

**User Story:** As a premium user, I want to share my grocery list with others.

**Acceptance Criteria:**
- [ ] "Share" button on grocery list
- [ ] Export as plain text
- [ ] Share via iOS share sheet (Messages, Notes, etc.)
- [ ] Copy to clipboard

---

## P3: Future Roadmap

### F14: Cookbook Recipe Database

**Description:** Partner with cookbook publishers to enable searching cookbook recipes within the app.

**Eitan's Note:** *"that might be hard with copyright"*

**Status:** Post-competition, requires publisher partnerships

---

### F15: Meal Planning Calendar

**Description:** Weekly calendar view to plan meals ahead.

**Technical Notes:**
- grosheries has `MealPlannerScreen` infrastructure
- Defer to post-competition

---

### F16: Pantry Expiry Tracking

**Description:** Track expiration dates and suggest recipes for items expiring soon.

**Technical Notes:**
- `PantryItem` already has `expiryDate` field
- Defer to post-competition

---

### F17: Store-Specific List Organization

**Description:** Organize grocery list by specific store layouts (Walmart, Kroger, etc.)

---

## Feature-to-Screen Mapping

| Feature | Primary Screen |
|---------|----------------|
| F1: URL Import | `ImportRecipeScreen` |
| F2: Want to Cook Queue | `HomeScreen` |
| F3: Pantry Tracking | `PantryScreen` |
| F4: Grocery List | `GroceryListScreen` |
| F5: Recipe Detail | `RecipeDetailScreen` |
| F6: Authentication | `AuthScreen` |
| F7: Multi-Recipe List | `GroceryListScreen` |
| F8: Share Extension | iOS Extension |
| F9: Manual Entry | `ManualEntryScreen` |
| F10: What Can I Make | `WhatCanIMakeScreen` |
| F11: Cookbook Collection | `CookbooksScreen` |
| F12: Serving Scaling | `RecipeDetailScreen` |
| F13: List Export | `GroceryListScreen` |
