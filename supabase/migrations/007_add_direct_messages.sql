-- Direct Messages System for AlbuCon

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  CHECK (sender_id != recipient_id)
);

-- Indexes for performance
CREATE INDEX idx_dm_sender ON direct_messages(sender_id, created_at DESC);
CREATE INDEX idx_dm_recipient ON direct_messages(recipient_id, created_at DESC);
CREATE INDEX idx_dm_conversation ON direct_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_dm_unread ON direct_messages(recipient_id, read_at) WHERE read_at IS NULL;

-- Row Level Security
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
  ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can mark their received messages as read
CREATE POLICY "Users can mark messages as read"
  ON direct_messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Function to get conversation partners (users you've messaged with)
CREATE OR REPLACE FUNCTION get_conversation_partners(user_id UUID)
RETURNS TABLE (
  partner_id UUID,
  partner_username TEXT,
  partner_profile_picture TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    CASE
      WHEN dm.sender_id = user_id THEN dm.recipient_id
      ELSE dm.sender_id
    END as partner_id,
    p.username as partner_username,
    p.profile_picture_url as partner_profile_picture,
    MAX(dm.created_at) as last_message_at,
    COUNT(CASE
      WHEN dm.recipient_id = user_id AND dm.read_at IS NULL
      THEN 1
    END) as unread_count
  FROM direct_messages dm
  JOIN profiles p ON p.id = CASE
    WHEN dm.sender_id = user_id THEN dm.recipient_id
    ELSE dm.sender_id
  END
  WHERE dm.sender_id = user_id OR dm.recipient_id = user_id
  GROUP BY partner_id, p.username, p.profile_picture_url
  ORDER BY last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE direct_messages IS 'Stores direct messages between users';
COMMENT ON COLUMN direct_messages.read_at IS 'Timestamp when recipient read the message';
