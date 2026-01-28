-- Mangia Initial Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- RECIPES
-- =====================
CREATE TABLE IF NOT EXISTS recipes (
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
CREATE TABLE IF NOT EXISTS recipe_ingredients (
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
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quantity DECIMAL DEFAULT 1,
  unit TEXT,
  category TEXT CHECK (category IN ('produce', 'meat_seafood', 'dairy_eggs', 'pantry', 'frozen', 'bakery', 'canned', 'other')),
  expiry_date DATE,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- GROCERY LISTS
-- =====================
CREATE TABLE IF NOT EXISTS grocery_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Shopping List',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================
-- GROCERY ITEMS
-- =====================
CREATE TABLE IF NOT EXISTS grocery_items (
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
CREATE TABLE IF NOT EXISTS cookbooks (
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
CREATE TABLE IF NOT EXISTS user_subscriptions (
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
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status);
CREATE INDEX IF NOT EXISTS idx_recipes_user_status ON recipes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON grocery_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON grocery_items(list_id);
CREATE INDEX IF NOT EXISTS idx_cookbooks_user_id ON cookbooks(user_id);

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
