-- Setup Image Storage for AlbuCon
-- Run this in Supabase SQL Editor

-- 1. Add image_url column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create a table to track user image uploads (for the 20 image limit)
CREATE TABLE IF NOT EXISTS user_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(storage_path)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS user_images_user_id_idx ON user_images(user_id);
CREATE INDEX IF NOT EXISTS user_images_created_at_idx ON user_images(created_at DESC);

-- Row Level Security for user_images
ALTER TABLE user_images ENABLE ROW LEVEL SECURITY;

-- Users can view their own images
CREATE POLICY "Users can view their own images"
  ON user_images FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own images
CREATE POLICY "Users can insert their own images"
  ON user_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete their own images"
  ON user_images FOR DELETE
  USING (auth.uid() = user_id);

-- Function to check user image count (enforce 20 image limit)
CREATE OR REPLACE FUNCTION check_user_image_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM user_images WHERE user_id = NEW.user_id) >= 20 THEN
    RAISE EXCEPTION 'Image limit reached. You can only upload 20 images. Please delete some images first.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce image limit before insert
DROP TRIGGER IF EXISTS enforce_image_limit ON user_images;
CREATE TRIGGER enforce_image_limit
  BEFORE INSERT ON user_images
  FOR EACH ROW
  EXECUTE FUNCTION check_user_image_limit();

-- Grant necessary permissions (you may need to adjust these based on your setup)
-- Note: Storage bucket policies are set in the Supabase Dashboard, not via SQL
