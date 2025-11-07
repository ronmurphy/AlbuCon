-- Social Features: Comments, Following, Notifications, Invite Codes
-- Run this migration to enable full social functionality

-- ==================== COMMENTS TABLE ====================
-- Threaded comments with support for replies
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- ==================== FOLLOWS TABLE ====================
-- User following system
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

-- Indexes for performance
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_created_at ON follows(created_at DESC);

-- ==================== NOTIFICATIONS TABLE ====================
-- Real-time notification system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'reply', 'external_post')),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  external_post_id UUID REFERENCES external_posts(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ==================== INVITE CODES TABLE ====================
-- Shareable invite links for mutual following
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  uses_count INT DEFAULT 0,
  max_uses INT DEFAULT NULL, -- NULL = unlimited
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_invite_codes_user_id ON invite_codes(user_id);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_expires_at ON invite_codes(expires_at);

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Comments Policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Follows Policies
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can create follows"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Anyone can create notifications

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Invite Codes Policies
CREATE POLICY "Anyone can view active invite codes"
  ON invite_codes FOR SELECT
  USING (expires_at IS NULL OR expires_at > NOW());

CREATE POLICY "Users can create their own invite codes"
  ON invite_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invite codes"
  ON invite_codes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invite codes"
  ON invite_codes FOR DELETE
  USING (auth.uid() = user_id);

-- ==================== FUNCTIONS & TRIGGERS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification on like
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user likes their own post
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    SELECT user_id, NEW.user_id, 'like', NEW.post_id
    FROM posts
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like notifications
CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_like();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify post owner (if not commenting on own post)
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id)
    SELECT user_id, NEW.user_id, 'comment', NEW.post_id, NEW.id
    FROM posts
    WHERE id = NEW.post_id;
  END IF;

  -- If replying to a comment, notify parent comment author
  IF NEW.parent_comment_id IS NOT NULL THEN
    IF NEW.user_id != (SELECT user_id FROM comments WHERE id = NEW.parent_comment_id) THEN
      INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id)
      SELECT user_id, NEW.user_id, 'reply', NEW.post_id, NEW.id
      FROM comments
      WHERE id = NEW.parent_comment_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment notifications
CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();

-- Function to create notification on follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follow notifications
CREATE TRIGGER trigger_notify_on_follow
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_follow();

-- ==================== HELPER VIEWS ====================

-- View for comment counts per post
CREATE OR REPLACE VIEW post_comment_counts AS
SELECT
  post_id,
  COUNT(*) as comment_count
FROM comments
GROUP BY post_id;

-- View for follower/following counts
CREATE OR REPLACE VIEW user_follow_counts AS
SELECT
  profiles.id as user_id,
  COALESCE(follower_counts.count, 0) as follower_count,
  COALESCE(following_counts.count, 0) as following_count
FROM profiles
LEFT JOIN (
  SELECT following_id, COUNT(*) as count
  FROM follows
  GROUP BY following_id
) follower_counts ON profiles.id = follower_counts.following_id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as count
  FROM follows
  GROUP BY follower_id
) following_counts ON profiles.id = following_counts.follower_id;

-- View for unread notification counts
CREATE OR REPLACE VIEW user_unread_notifications AS
SELECT
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE read = false
GROUP BY user_id;

-- ==================== COMMENTS ====================

COMMENT ON TABLE comments IS 'Threaded comments on posts with reply support';
COMMENT ON TABLE follows IS 'User following relationships';
COMMENT ON TABLE notifications IS 'Real-time notification system';
COMMENT ON TABLE invite_codes IS 'Shareable invite links for mutual following';

COMMENT ON COLUMN comments.parent_comment_id IS 'NULL for top-level comments, references parent for replies';
COMMENT ON COLUMN notifications.type IS 'Type: like, comment, follow, reply, external_post';
COMMENT ON COLUMN invite_codes.max_uses IS 'NULL = unlimited uses';
COMMENT ON COLUMN invite_codes.expires_at IS 'NULL = never expires';
