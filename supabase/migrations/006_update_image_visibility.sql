-- Update RLS policy to allow viewing all users' images (for gallery feature)
-- This allows users to view other users' galleries

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own images" ON user_images;

-- Create new policy that allows viewing all images
CREATE POLICY "Users can view all images"
  ON user_images FOR SELECT
  USING (true);

-- Keep the insert and delete policies restrictive (users can only manage their own images)
-- These policies already exist from the original migration
