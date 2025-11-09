-- Create typing_status table for real-time typing indicators
CREATE TABLE IF NOT EXISTS typing_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipient_id)
);

-- Enable RLS
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Users can insert/update their own typing status
CREATE POLICY "Users can manage their own typing status"
  ON typing_status
  FOR ALL
  USING (auth.uid() = user_id);

-- Users can view typing status where they are the recipient
CREATE POLICY "Users can view typing status directed to them"
  ON typing_status
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_typing_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_typing_status_timestamp
  BEFORE UPDATE ON typing_status
  FOR EACH ROW
  EXECUTE FUNCTION update_typing_status_timestamp();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_typing_status_recipient ON typing_status(recipient_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_user ON typing_status(user_id);

-- Function to clean up old typing status (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_status()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_status
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;
