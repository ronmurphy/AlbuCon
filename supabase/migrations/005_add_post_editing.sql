-- Add edited_at column to posts table for tracking post edits
ALTER TABLE posts
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX idx_posts_edited_at ON posts(edited_at);

-- Add comment for documentation
COMMENT ON COLUMN posts.edited_at IS 'Timestamp when the post was last edited (NULL if never edited)';
