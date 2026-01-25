-- Recipe Collections Migration
-- Allows users to organize recipes into custom collections/folders

-- =====================
-- RECIPE COLLECTIONS
-- =====================
CREATE TABLE IF NOT EXISTS recipe_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',           -- Icon name for display
  color TEXT DEFAULT '#CC5500',         -- Brand color by default
  is_default BOOLEAN DEFAULT FALSE,     -- Mark system-created collections
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER recipe_collections_updated_at
  BEFORE UPDATE ON recipe_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for user lookups
CREATE INDEX idx_recipe_collections_user ON recipe_collections(user_id);

-- Unique constraint on collection name per user
CREATE UNIQUE INDEX idx_recipe_collections_user_name ON recipe_collections(user_id, name);

-- =====================
-- RECIPE COLLECTION ITEMS
-- =====================
-- Junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS recipe_collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES recipe_collections(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  display_order INTEGER DEFAULT 0,
  UNIQUE(collection_id, recipe_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_collection_items_collection ON recipe_collection_items(collection_id);
CREATE INDEX idx_collection_items_recipe ON recipe_collection_items(recipe_id);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on collections
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own collections
CREATE POLICY "Users can view own collections"
  ON recipe_collections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own collections
CREATE POLICY "Users can create own collections"
  ON recipe_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own collections
CREATE POLICY "Users can update own collections"
  ON recipe_collections FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own collections
CREATE POLICY "Users can delete own collections"
  ON recipe_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on collection items
ALTER TABLE recipe_collection_items ENABLE ROW LEVEL SECURITY;

-- Users can view items in their own collections
CREATE POLICY "Users can view own collection items"
  ON recipe_collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipe_collections
      WHERE recipe_collections.id = recipe_collection_items.collection_id
      AND recipe_collections.user_id = auth.uid()
    )
  );

-- Users can add items to their own collections
CREATE POLICY "Users can add to own collections"
  ON recipe_collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipe_collections
      WHERE recipe_collections.id = recipe_collection_items.collection_id
      AND recipe_collections.user_id = auth.uid()
    )
  );

-- Users can remove items from their own collections
CREATE POLICY "Users can remove from own collections"
  ON recipe_collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipe_collections
      WHERE recipe_collections.id = recipe_collection_items.collection_id
      AND recipe_collections.user_id = auth.uid()
    )
  );

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Function to get collection with recipe count
CREATE OR REPLACE FUNCTION get_collection_with_count(collection_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  recipe_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.name,
    rc.description,
    rc.icon,
    rc.color,
    COUNT(rci.id)::BIGINT as recipe_count
  FROM recipe_collections rc
  LEFT JOIN recipe_collection_items rci ON rci.collection_id = rc.id
  WHERE rc.id = collection_id
  GROUP BY rc.id, rc.name, rc.description, rc.icon, rc.color;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
