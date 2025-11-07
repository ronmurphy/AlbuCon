-- Migration: Add Content Filtering System
-- Description: Adds content type tagging to posts and user content preferences

-- Step 1: Add content_type to posts table
ALTER TABLE posts
ADD COLUMN content_type VARCHAR(20) DEFAULT 'general' CHECK (content_type IN ('general', 'venting', 'political', 'nsfw'));

-- Add index for faster filtering
CREATE INDEX idx_posts_content_type ON posts(content_type);

-- Step 2: Add content preferences to profiles table
ALTER TABLE profiles
ADD COLUMN content_preferences JSONB DEFAULT '{"general": true, "venting": true, "political": true, "nsfw": false}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN posts.content_type IS 'Type of content: general (safe for all), venting (complaints), political (politics/debates), nsfw (mature content)';
COMMENT ON COLUMN profiles.content_preferences IS 'User preferences for content types they want to see. JSON object with boolean values for each content type.';

-- Update existing posts to have 'general' content type (already default, but explicit)
UPDATE posts SET content_type = 'general' WHERE content_type IS NULL;
