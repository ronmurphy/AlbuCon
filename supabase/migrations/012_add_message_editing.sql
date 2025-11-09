-- Add columns for message editing and soft deletion
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for better performance on deleted messages
CREATE INDEX IF NOT EXISTS idx_dm_deleted_at ON direct_messages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_dm_edited_at ON direct_messages(edited_at);

-- Function to update edited_at timestamp
CREATE OR REPLACE FUNCTION update_dm_edited_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update edited_at if content or image_urls changed and message isn't being deleted
  IF (NEW.content != OLD.content OR NEW.image_urls != OLD.image_urls) AND NEW.deleted_at IS NULL THEN
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for edited timestamp
DROP TRIGGER IF EXISTS update_dm_edited_timestamp ON direct_messages;
CREATE TRIGGER update_dm_edited_timestamp
  BEFORE UPDATE ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_dm_edited_timestamp();
