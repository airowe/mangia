-- Meal Plans Schema
-- Add meal planning functionality

-- =====================
-- MEAL PLANS
-- =====================
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  title TEXT, -- For custom meals without a linked recipe
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, meal_type, recipe_id) -- Prevent duplicate entries
);

CREATE TRIGGER meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_recipe_id ON meal_plans(recipe_id);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Meal Plans: Users can only access their own
CREATE POLICY "Users can CRUD own meal plans" ON meal_plans
  FOR ALL USING (auth.uid() = user_id);
