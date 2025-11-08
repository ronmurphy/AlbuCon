-- Add reaction types to likes table
-- AlbuCon now supports multiple reaction types: heart, smile, sparkles, hug, thinking

-- Add reaction_type column to likes table
ALTER TABLE likes
ADD COLUMN IF NOT EXISTS reaction_type VARCHAR(20) DEFAULT 'heart' NOT NULL;

-- Update existing likes to have 'heart' as their reaction type
UPDATE likes
SET reaction_type = 'heart'
WHERE reaction_type IS NULL OR reaction_type = '';

-- Add index for better query performance when filtering by reaction type
CREATE INDEX IF NOT EXISTS idx_likes_reaction_type ON likes(post_id, reaction_type);

-- Add check constraint to ensure only valid reaction types
ALTER TABLE likes
ADD CONSTRAINT valid_reaction_type
CHECK (reaction_type IN ('heart', 'smile', 'sparkles', 'hug', 'thinking'));

-- Comments
COMMENT ON COLUMN likes.reaction_type IS 'Type of reaction: heart (love), smile (like), sparkles (inspiring), hug (support), thinking (interesting)';
