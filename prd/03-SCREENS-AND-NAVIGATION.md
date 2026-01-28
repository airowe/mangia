# Screens and Navigation

## Navigation Structure

```
App
├── AuthStack (unauthenticated)
│   ├── LoginScreen
│   └── SignUpScreen
│
└── MainTabs (authenticated)
    ├── HomeTab
    │   ├── HomeScreen (Want to Cook queue)
    │   └── ImportRecipeScreen (modal)
    │
    ├── GroceryTab
    │   └── GroceryListScreen
    │
    ├── PantryTab
    │   ├── PantryScreen
    │   └── WhatCanIMakeScreen (premium, modal)
    │
    ├── RecipesTab
    │   └── MyRecipesScreen
    │
    └── AccountTab
        ├── AccountScreen
        ├── SubscriptionScreen (modal)
        └── CookbooksScreen (premium)

Shared Screens (accessible from multiple tabs):
├── RecipeDetailScreen
└── ManualEntryScreen
```

---

## Screen Specifications

### AuthScreen

**Purpose:** User authentication (login/signup)

**Grosheries Source:** `screens/AuthScreen.tsx` (direct reuse)

**UI Elements:**
- App logo
- Tab toggle: Login / Sign Up
- Email input
- Password input
- Submit button
- "Forgot Password?" link
- Social login buttons (Apple, Google) — optional

**Behavior:**
- On successful auth → navigate to HomeScreen
- Persist session via Supabase + AsyncStorage
- Show inline validation errors

---

### HomeScreen

**Purpose:** "Want to Cook" queue — recipes user plans to make

**Grosheries Source:** Adapt `screens/HomeScreen.tsx`

**UI Elements:**
- Header: "What's Cooking?" or "Want to Cook"
- FAB or header button: "+ Add Recipe"
- Recipe list (vertical scroll)
  - Recipe card: image, title, source icon, time estimate
  - Swipe actions: Mark Cooked, Archive, Delete
- Empty state: illustration + "Add your first recipe" CTA
- "Generate Grocery List" button (bottom, prominent)

**Behavior:**
- Fetch recipes where `status = 'want_to_cook'`
- Tap recipe → RecipeDetailScreen
- Tap "+" → ImportRecipeScreen (modal)
- Tap "Generate Grocery List" → GroceryListScreen
- Pull to refresh

**Mock:**
```
┌─────────────────────────────┐
│  Want to Cook          [+]  │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🖼️ [Image]              │ │
│ │ Garlic Butter Shrimp    │ │
│ │ 🎵 TikTok • 25 min      │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🖼️ [Image]              │ │
│ │ Crispy Chicken Tacos    │ │
│ │ 📺 YouTube • 35 min     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🖼️ [Image]              │ │
│ │ Lemon Pasta             │ │
│ │ 🌐 Blog • 20 min        │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│  [ 🛒 Generate Grocery List ]│
└─────────────────────────────┘
```

---

### ImportRecipeScreen

**Purpose:** Import recipe from URL

**Grosheries Source:** Adapt `screens/RecipeSearchScreen.tsx`

**UI Elements:**
- Header: "Add Recipe"
- URL input field with paste button
- Supported platforms hint: "TikTok, YouTube, Instagram, or any recipe blog"
- "Import" button
- Loading state with progress indicator
- Preview section (after extraction):
  - Recipe title (editable)
  - Image preview
  - Ingredients list (editable)
  - Instructions preview
- "Save to Queue" button
- "Enter Manually" link → ManualEntryScreen

**Behavior:**
1. User pastes URL
2. Tap "Import"
3. Detect URL type (TikTok, YouTube, Instagram, blog)
4. Call appropriate extraction service
5. Display preview for review/edit
6. User saves → recipe added with `status = 'want_to_cook'`

**Error States:**
- Invalid URL format
- Unsupported platform
- Extraction failed
- Network error

**Mock:**
```
┌─────────────────────────────┐
│  ← Add Recipe               │
├─────────────────────────────┤
│                             │
│  Paste recipe URL           │
│  ┌─────────────────────[📋]│
│  │ https://tiktok.com/...  ││
│  └─────────────────────────┘│
│                             │
│  Works with TikTok, YouTube,│
│  Instagram, and recipe blogs│
│                             │
│  [      Import Recipe      ]│
│                             │
│  ─────── or ───────        │
│                             │
│  [ Enter Recipe Manually ]  │
│                             │
└─────────────────────────────┘
```

---

### RecipeDetailScreen

**Purpose:** View full recipe details

**Grosheries Source:** `screens/RecipeDetailScreen.tsx` (adapt)

**UI Elements:**
- Header image (full width, parallax optional)
- Recipe title
- Source badge with link (🎵 TikTok, 📺 YouTube, etc.)
- Metadata: prep time, cook time, servings
- Serving adjuster (premium)
- Ingredients section
  - Checkable list
  - Quantity + unit + name
- Instructions section
  - Numbered steps
  - Optional "Cook Mode" for step-by-step
- Action buttons:
  - "Add to Grocery List"
  - "Mark as Cooked"
  - Share
  - Delete

**Behavior:**
- Tap source link → open in browser
- Check ingredient → visual feedback (not persisted)
- "Add to Grocery List" → add ingredients, navigate to GroceryListScreen
- "Mark as Cooked" → update status, show celebration, return to Home

---

### GroceryListScreen

**Purpose:** Shopping list generated from queued recipes

**Grosheries Source:** New screen (use patterns from `MealPlannerScreen.tsx`)

**UI Elements:**
- Header: "Grocery List"
- Recipe source pills (filter by recipe)
- Sections by category (Produce, Meat, Dairy, etc.)
- Each item:
  - Checkbox
  - Ingredient name
  - Quantity + unit
  - Recipe source indicator (which recipes need this)
- "Already Have" collapsed section (items in pantry)
- Clear completed button
- Share/Export button (premium)

**Behavior:**
- On mount: call `generateGroceryList()` with all `want_to_cook` recipes
- Check against pantry, separate into "Need" and "Have"
- Tap checkbox → mark checked (persisted locally)
- Long press → see which recipes need this ingredient
- Pull to refresh/regenerate

**Mock:**
```
┌─────────────────────────────┐
│  ← Grocery List      [Share]│
├─────────────────────────────┤
│  From: Shrimp • Tacos • Pasta│
├─────────────────────────────┤
│  🥬 PRODUCE                 │
│  ☐ Garlic (6 cloves)        │
│  ☐ Lemon (2)                │
│  ☐ Cilantro (1 bunch)       │
│  ☐ Lime (3)                 │
├─────────────────────────────┤
│  🥩 MEAT & SEAFOOD          │
│  ☐ Shrimp (1 lb)            │
│  ☐ Chicken thighs (2 lbs)   │
├─────────────────────────────┤
│  🧀 DAIRY                   │
│  ☐ Butter (4 tbsp)          │
│  ☐ Parmesan (½ cup)         │
├─────────────────────────────┤
│  ▼ Already Have (3 items)   │
│    ✓ Olive oil              │
│    ✓ Salt                   │
│    ✓ Pasta                  │
└─────────────────────────────┘
```

---

### PantryScreen

**Purpose:** Track ingredients user has at home

**Grosheries Source:** Adapt existing pantry UI components

**UI Elements:**
- Header: "My Pantry" or "What I Have"
- Search/filter bar
- Add item FAB or button
- Items grouped by category
- Each item:
  - Name
  - Quantity + unit
  - Swipe to delete
- "What Can I Make?" button (premium)
- Empty state

**Behavior:**
- CRUD operations via `lib/pantry.ts`
- Tap item → edit quantity
- Swipe → delete with confirmation
- Add item → bottom sheet or inline form

---

### WhatCanIMakeScreen (Premium)

**Purpose:** Show recipes user can make with current pantry

**Grosheries Source:** New screen

**UI Elements:**
- Header: "What Can I Make?"
- Premium badge/gate if not subscribed
- Filter: "Complete matches" / "Almost complete"
- Recipe cards showing:
  - Recipe title + image
  - Match percentage (e.g., "Have 8 of 10 ingredients")
  - Missing ingredients list
- Empty state if no matches

**Behavior:**
- Scan all saved recipes
- Compare ingredients to pantry
- Calculate match percentage
- Sort by match % descending
- Tap recipe → RecipeDetailScreen

---

### MyRecipesScreen

**Purpose:** Library of all saved recipes (all statuses)

**Grosheries Source:** Adapt `screens/RecipesScreen.tsx`

**UI Elements:**
- Header: "My Recipes"
- Filter tabs: All, Want to Cook, Cooked, Archived
- Search bar
- Recipe grid or list
- Empty state per filter

**Behavior:**
- Fetch all user recipes
- Filter by status
- Search by title
- Tap recipe → RecipeDetailScreen

---

### AccountScreen

**Purpose:** User settings and profile

**Grosheries Source:** `screens/AccountScreen.tsx` (adapt)

**UI Elements:**
- User info (email)
- Subscription status + "Upgrade" CTA
- Settings:
  - Notifications (future)
  - Default servings
  - Theme (future)
- "My Cookbooks" link (premium)
- Sign out button
- App version

---

### SubscriptionScreen

**Purpose:** RevenueCat paywall and subscription management

**Grosheries Source:** New screen

**UI Elements:**
- Premium features list
- Pricing: Monthly ($4.99) / Yearly ($29.99)
- Purchase buttons
- Restore purchases link
- Terms of service link

**Behavior:**
- Fetch offerings from RevenueCat
- Handle purchase flow
- Update local subscription state on success

---

### ManualEntryScreen

**Purpose:** Manually create a recipe when URL import fails

**Grosheries Source:** `screens/RecipeCreateScreen.tsx` (adapt)

**UI Elements:**
- Recipe title input
- Ingredients section:
  - Add ingredient button
  - Each: name, quantity, unit (with picker)
  - Remove ingredient
- Instructions section:
  - Add step button
  - Numbered text inputs
  - Remove step
- Optional fields: prep time, cook time, servings
- Add photo button
- Save button

---

### CookbooksScreen (Premium)

**Purpose:** Track cookbook collection

**Grosheries Source:** New screen

**UI Elements:**
- Header: "My Cookbooks"
- Add cookbook FAB
- Cookbook grid:
  - Cover image (or placeholder)
  - Title
  - Author
- Empty state

**Behavior:**
- CRUD for cookbooks
- Tap → view/edit details
- Future: link recipes to cookbooks

---

## Navigation Implementation

```typescript
// navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarIcon: /* home icon */ }}
      />
      <Tab.Screen 
        name="Grocery" 
        component={GroceryListScreen}
        options={{ tabBarIcon: /* cart icon */ }}
      />
      <Tab.Screen 
        name="Pantry" 
        component={PantryScreen}
        options={{ tabBarIcon: /* fridge icon */ }}
      />
      <Tab.Screen 
        name="Recipes" 
        component={MyRecipesScreen}
        options={{ tabBarIcon: /* book icon */ }}
      />
      <Tab.Screen 
        name="Account" 
        component={AccountScreen}
        options={{ tabBarIcon: /* person icon */ }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ImportRecipe" 
              component={ImportRecipeScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="RecipeDetail" 
              component={RecipeDetailScreen}
            />
            <Stack.Screen 
              name="ManualEntry" 
              component={ManualEntryScreen}
            />
            <Stack.Screen 
              name="Subscription" 
              component={SubscriptionScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="WhatCanIMake" 
              component={WhatCanIMakeScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="Cookbooks" 
              component={CookbooksScreen}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Tab Bar Icons

| Tab | Icon (Expo Vector Icons) |
|-----|--------------------------|
| Home | `Ionicons: home` |
| Grocery | `Ionicons: cart` |
| Pantry | `MaterialCommunityIcons: fridge` |
| Recipes | `Ionicons: book` |
| Account | `Ionicons: person` |
