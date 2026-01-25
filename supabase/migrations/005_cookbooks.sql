-- Migration: Create cookbooks table for premium cookbook collection feature
-- This allows users to track physical cookbooks they own

-- Create cookbooks table
CREATE TABLE IF NOT EXISTS cookbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  cover_image_url TEXT,
  isbn TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user lookup
CREATE INDEX IF NOT EXISTS idx_cookbooks_user_id ON cookbooks(user_id);

-- Create index for title search
CREATE INDEX IF NOT EXISTS idx_cookbooks_title ON cookbooks(title);

-- Enable RLS
ALTER TABLE cookbooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own cookbooks
CREATE POLICY "Users can view own cookbooks"
  ON cookbooks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own cookbooks
CREATE POLICY "Users can create own cookbooks"
  ON cookbooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cookbooks
CREATE POLICY "Users can update own cookbooks"
  ON cookbooks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own cookbooks
CREATE POLICY "Users can delete own cookbooks"
  ON cookbooks FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_cookbook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cookbook_updated_at
  BEFORE UPDATE ON cookbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_cookbook_updated_at();
