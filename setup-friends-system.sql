-- Friends System Database Setup
-- Run this in Supabase SQL Editor

-- 1. Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent duplicate friend requests
  UNIQUE(user_id, friend_id),
  -- Prevent users from friending themselves
  CHECK (user_id != friend_id)
);

-- 2. Add visibility column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends_only'));

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS friendships_user_id_idx ON friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_id_idx ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS friendships_status_idx ON friendships(status);
CREATE INDEX IF NOT EXISTS posts_visibility_idx ON posts(visibility);

-- 4. Row Level Security for friendships table
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships where they are involved
CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can update friendships where they are the recipient (accept/decline)
CREATE POLICY "Users can accept or decline friend requests"
  ON friendships FOR UPDATE
  USING (auth.uid() = friend_id)
  WITH CHECK (auth.uid() = friend_id);

-- Users can delete friendships where they are involved (unfriend)
CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 5. Update posts RLS to respect visibility
-- Drop existing "Posts are viewable by everyone" policy
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;

-- New policy: Public posts are viewable by everyone
CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT
  USING (visibility = 'public');

-- New policy: Friends-only posts are viewable by friends
CREATE POLICY "Friends-only posts are viewable by friends"
  ON posts FOR SELECT
  USING (
    visibility = 'friends_only' AND (
      -- Post author can see their own post
      auth.uid() = user_id
      OR
      -- Friends can see the post (mutual friendship)
      EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
        AND (
          (user_id = posts.user_id AND friend_id = auth.uid())
          OR
          (friend_id = posts.user_id AND user_id = auth.uid())
        )
      )
    )
  );

-- 6. Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (user_id = user1_id AND friend_id = user2_id)
      OR
      (user_id = user2_id AND friend_id = user1_id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to get friend count
CREATE OR REPLACE FUNCTION get_friend_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM friendships
    WHERE status = 'accepted'
    AND (user_id = target_user_id OR friend_id = target_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger to update updated_at on friendships
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. View for easier friendship queries
CREATE OR REPLACE VIEW user_friends AS
SELECT
  f.id,
  f.user_id,
  f.friend_id,
  f.status,
  f.created_at,
  f.updated_at,
  -- Always show the "other" user
  CASE
    WHEN f.user_id = auth.uid() THEN f.friend_id
    ELSE f.user_id
  END as friend_user_id,
  -- Include profile info of the friend
  p.username as friend_username,
  p.profile_picture_url as friend_profile_picture
FROM friendships f
LEFT JOIN profiles p ON (
  CASE
    WHEN f.user_id = auth.uid() THEN f.friend_id
    ELSE f.user_id
  END = p.id
)
WHERE f.user_id = auth.uid() OR f.friend_id = auth.uid();
