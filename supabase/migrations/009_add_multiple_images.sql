-- Add support for multiple images per post
-- Changes image_url (single) to image_urls (array of up to 4 images)

-- Add new column for multiple images
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Migrate existing single image_url data to the new array format
UPDATE posts
SET image_urls =
  CASE
    WHEN image_url IS NOT NULL AND image_url != ''
    THEN jsonb_build_array(image_url)
    ELSE '[]'::jsonb
  END
WHERE image_url IS NOT NULL OR image_urls = '[]'::jsonb;

-- Add check constraint to limit to 4 images max
ALTER TABLE posts
ADD CONSTRAINT max_four_images
CHECK (jsonb_array_length(image_urls) <= 4);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_image_urls ON posts USING GIN (image_urls);

-- Note: We're keeping image_url column for backward compatibility
-- but new posts should use image_urls array
