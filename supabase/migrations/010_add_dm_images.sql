-- Add support for multiple images in direct messages
-- Allows up to 4 images per DM message

-- Add column for multiple images
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Add check constraint to limit to 4 images max
ALTER TABLE direct_messages
ADD CONSTRAINT max_four_dm_images
CHECK (jsonb_array_length(image_urls) <= 4);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_dm_image_urls ON direct_messages USING GIN (image_urls);

-- Comments
COMMENT ON COLUMN direct_messages.image_urls IS 'Array of up to 4 image URLs attached to this message';
