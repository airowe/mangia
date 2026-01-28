# Data Models

## TypeScript Interfaces

### Recipe

```typescript
// models/Recipe.ts
export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  prep_time?: number;          // minutes
  cook_time?: number;          // minutes
  servings?: number;
  image_url?: string;
  source_url?: string;         // Original URL (TikTok, YouTube, blog)
  source_type?: RecipeSourceType;
  status: RecipeStatus;
  created_at: string;
  updated_at?: string;
}

export type RecipeSourceType = 'tiktok' | 'youtube' | 'instagram' | 'blog' | 'manual';

export type RecipeStatus = 'want_to_cook' | 'cooked' | 'archived';

export interface RecipeIngredient {
  id?: string;
  recipe_id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: IngredientCategory;
  display_order?: number;
}

export type IngredientCategory = 
  | 'produce' 
  | 'meat_seafood' 
  | 'dairy_eggs' 
  | 'pantry' 
  | 'frozen' 
  | 'bakery' 
  | 'canned' 
  | 'other';
```

### Pantry Item

```typescript
// models/PantryItem.ts
export interface PantryItem {
  id: string;
  user_id: string;
  title: string;               // "Chicken breast", "Eggs"
  quantity?: number;
  unit?: string;
  category?: IngredientCategory;
  expiry_date?: string;        // ISO date string
  created_at: string;
  updated_at?: string;
}
```

### Grocery List

```typescript
// models/GroceryList.ts
export interface GroceryList {
  id: string;
  user_id: string;
  name: string;                // "Shopping List", "Weekend Meals"
  created_at: string;
  completed_at?: string;
}

export interface GroceryItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  recipe_ids: string[];        // Which recipes need this ingredient
  in_pantry: boolean;          // User already has this
  pantry_quantity?: number;    // How much they have
  need_to_buy: number;         // quantity - pantry_quantity
  checked: boolean;            // Checked off while shopping
}

// Used for generating grocery list (not persisted)
export interface ConsolidatedIngredient {
  name: string;
  total_quantity: number;
  unit: string;
  category: IngredientCategory;
  from_recipes: Array<{
    recipe_id: string;
    recipe_title: string;
    quantity: number;
  }>;
  in_pantry: boolean;
  pantry_quantity: number;
  need_to_buy: number;
}
```

### Cookbook (Premium)

```typescript
// models/Cookbook.ts
export interface Cookbook {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
  isbn?: string;
  created_at: string;
}
```

### User Subscription

```typescript
// models/Subscription.ts
export interface UserSubscription {
  user_id: string;
  is_premium: boolean;
  plan_type?: 'monthly' | 'yearly';
  expires_at?: string;
  revenuecat_customer_id?: string;
  updated_at: string;
}
```

### API Response Types

```typescript
// types/api.ts
export interface ParsedRecipe {
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity: string;    // String from AI, needs parsing
    unit: string;
  }>;
  instructions: string[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  image_url?: string;
}

export interface FirecrawlRecipe {
  title?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  image?: string;
}
```

---

## Supabase Schema (SQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- RECIPES
-- =====================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT[] NOT NULL DEFAULT '{}',
  prep_time INTEGER,                    -- minutes
  cook_time INTEGER,                    -- minutes
  servings INTEGER,
  image_url TEXT,
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('tiktok', 'youtube', 'instagram', 'blog', 'manual')),
  status TEXT NOT NULL DEFAULT 'want_to_cook' CHECK (status IN ('want_to_cook', 'cooked', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- RECIPE INGREDIENTS
-- =====================
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL,
  unit TEXT,
  category TEXT CHECK (category IN ('produce', 'meat_seafood', 'dairy_eggs', 'pantry', 'frozen', 'bakery', 'canned', 'other')),
  display_order INTEGER DEFAULT 0
);

-- =====================
-- PANTRY ITEMS
-- =====================
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quantity DECIMAL DEFAULT 1,
  unit TEXT,
  category TEXT CHECK (category IN ('produce', 'meat_seafood', 'dairy_eggs', 'pantry', 'frozen', 'bakery', 'canned', 'other')),
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- GROCERY LISTS
-- =====================
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Shopping List',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================
-- GROCERY ITEMS
-- =====================
CREATE TABLE grocery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL,
  unit TEXT,
  category TEXT,
  checked BOOLEAN DEFAULT FALSE,
  recipe_ids UUID[] DEFAULT '{}'
);

-- =====================
-- COOKBOOKS (Premium)
-- =====================
CREATE TABLE cookbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  cover_image_url TEXT,
  isbn TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- USER SUBSCRIPTIONS
-- =====================
CREATE TABLE user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium BOOLEAN DEFAULT FALSE,
  plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly')),
  expires_at TIMESTAMP WITH TIME ZONE,
  revenuecat_customer_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_user_status ON recipes(user_id, status);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX idx_grocery_lists_user_id ON grocery_lists(user_id);
CREATE INDEX idx_grocery_items_list_id ON grocery_items(list_id);
CREATE INDEX idx_cookbooks_user_id ON cookbooks(user_id);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Recipes: Users can only access their own
CREATE POLICY "Users can CRUD own recipes" ON recipes
  FOR ALL USING (auth.uid() = user_id);

-- Recipe Ingredients: Users can access ingredients of their own recipes
CREATE POLICY "Users can CRUD own recipe ingredients" ON recipe_ingredients
  FOR ALL USING (
    recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
  );

-- Pantry: Users can only access their own
CREATE POLICY "Users can CRUD own pantry" ON pantry_items
  FOR ALL USING (auth.uid() = user_id);

-- Grocery Lists: Users can only access their own
CREATE POLICY "Users can CRUD own grocery lists" ON grocery_lists
  FOR ALL USING (auth.uid() = user_id);

-- Grocery Items: Users can access items in their own lists
CREATE POLICY "Users can CRUD own grocery items" ON grocery_items
  FOR ALL USING (
    list_id IN (SELECT id FROM grocery_lists WHERE user_id = auth.uid())
  );

-- Cookbooks: Users can only access their own
CREATE POLICY "Users can CRUD own cookbooks" ON cookbooks
  FOR ALL USING (auth.uid() = user_id);

-- Subscriptions: Users can only read their own
CREATE POLICY "Users can read own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Ingredient Categories

Used for organizing grocery list by store section:

| Category | Display Name | Example Items | Store Section Order |
|----------|--------------|---------------|---------------------|
| `produce` | Produce | lettuce, tomato, onion, garlic, apple, banana | 1 |
| `meat_seafood` | Meat & Seafood | chicken, beef, salmon, shrimp | 2 |
| `dairy_eggs` | Dairy & Eggs | milk, cheese, butter, eggs, yogurt | 3 |
| `bakery` | Bread & Bakery | bread, rolls, tortillas | 4 |
| `frozen` | Frozen | frozen vegetables, ice cream | 5 |
| `canned` | Canned Goods | beans, tomato sauce, broth | 6 |
| `pantry` | Pantry | flour, sugar, oil, spices, pasta, rice | 7 |
| `other` | Other | (default for unrecognized) | 8 |

---

## Category Detection Logic

```typescript
// utils/categorizeIngredient.ts
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  produce: [
    'lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'celery',
    'potato', 'broccoli', 'spinach', 'kale', 'mushroom', 'zucchini',
    'cucumber', 'avocado', 'lemon', 'lime', 'apple', 'banana', 'berry',
    'orange', 'ginger', 'cilantro', 'parsley', 'basil', 'mint', 'scallion',
    'green onion', 'cabbage', 'corn', 'squash', 'eggplant', 'asparagus'
  ],
  meat_seafood: [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'turkey',
    'bacon', 'sausage', 'steak', 'ground', 'lamb', 'ham', 'tuna',
    'crab', 'lobster', 'tilapia', 'cod', 'meatball'
  ],
  dairy_eggs: [
    'milk', 'cheese', 'butter', 'yogurt', 'cream', 'egg', 'sour cream',
    'cottage cheese', 'cream cheese', 'parmesan', 'mozzarella', 'cheddar',
    'feta', 'ricotta', 'half and half', 'whipping cream'
  ],
  bakery: [
    'bread', 'rolls', 'bagel', 'tortilla', 'pita', 'bun', 'croissant',
    'english muffin', 'naan', 'flatbread', 'ciabatta', 'baguette'
  ],
  frozen: [
    'frozen', 'ice cream'
  ],
  canned: [
    'canned', 'beans', 'tomato sauce', 'broth', 'stock', 'coconut milk',
    'diced tomatoes', 'crushed tomatoes', 'tomato paste', 'chickpeas'
  ],
  pantry: [
    'flour', 'sugar', 'oil', 'salt', 'pepper', 'spice', 'rice', 'pasta',
    'sauce', 'vinegar', 'soy sauce', 'honey', 'maple', 'olive oil',
    'vegetable oil', 'sesame oil', 'baking', 'vanilla', 'cinnamon',
    'cumin', 'paprika', 'oregano', 'thyme', 'bay leaf', 'nutmeg',
    'cornstarch', 'baking powder', 'baking soda', 'yeast', 'oats',
    'quinoa', 'couscous', 'lentils', 'peanut butter', 'jam', 'jelly'
  ],
  other: []
};

export function categorizeIngredient(name: string): IngredientCategory {
  const lowerName = name.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue;
    if (keywords.some(kw => lowerName.includes(kw))) {
      return category as IngredientCategory;
    }
  }
  
  return 'other';
}
```
