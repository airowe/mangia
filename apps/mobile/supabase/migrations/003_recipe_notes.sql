-- Recipe Notes and Ratings Schema
-- Add personal notes and star ratings to recipes

-- =====================
-- RECIPE NOTES
-- =====================
CREATE TABLE IF NOT EXISTS recipe_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  cooked_at DATE, -- Optional: when they made the recipe
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER recipe_notes_updated_at
  BEFORE UPDATE ON recipe_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- ADD RATING TO RECIPES
-- =====================
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS times_cooked INTEGER DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS last_cooked_at DATE;

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_recipe_notes_recipe_id ON recipe_notes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_notes_user_id ON recipe_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE recipe_notes ENABLE ROW LEVEL SECURITY;

-- Recipe Notes: Users can only access notes on their own recipes
CREATE POLICY "Users can CRUD own recipe notes" ON recipe_notes
  FOR ALL USING (
    recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
  );
