-- Add video support to external_posts table
-- This allows storing video URLs from external platforms like Bluesky

ALTER TABLE external_posts
ADD COLUMN video_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN external_posts.video_url IS 'URL to video content from external platforms (e.g., Bluesky videos)';
