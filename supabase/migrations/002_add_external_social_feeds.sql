-- External Social Media Integration
-- Allows users to follow Bluesky users and aggregate their posts

-- Table to track which external accounts users want to follow
CREATE TABLE followed_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('bluesky', 'mastodon', 'reddit')),
  handle VARCHAR(255) NOT NULL, -- e.g., 'user.bsky.social' or '@user@mastodon.social'
  display_name VARCHAR(255),
  avatar_url TEXT,
  enabled BOOLEAN DEFAULT true, -- User can temporarily disable without unfollowing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, handle)
);

-- Table to store posts from external platforms
CREATE TABLE external_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  followed_account_id UUID NOT NULL REFERENCES followed_accounts(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL,
  external_id VARCHAR(500) NOT NULL, -- Original post ID/URI from platform
  author_name VARCHAR(255) NOT NULL,
  author_handle VARCHAR(255) NOT NULL,
  author_avatar TEXT,
  content TEXT,
  image_url TEXT,
  original_url TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'general' CHECK (content_type IN ('general', 'venting', 'political', 'nsfw')),
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Original post timestamp
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform, external_id, user_id) -- Prevent duplicate posts per user
);

-- Indexes for performance
CREATE INDEX idx_followed_accounts_user_id ON followed_accounts(user_id);
CREATE INDEX idx_followed_accounts_platform ON followed_accounts(platform);
CREATE INDEX idx_followed_accounts_enabled ON followed_accounts(enabled) WHERE enabled = true;

CREATE INDEX idx_external_posts_user_id ON external_posts(user_id);
CREATE INDEX idx_external_posts_platform ON external_posts(platform);
CREATE INDEX idx_external_posts_content_type ON external_posts(content_type);
CREATE INDEX idx_external_posts_posted_at ON external_posts(posted_at DESC);
CREATE INDEX idx_external_posts_followed_account ON external_posts(followed_account_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_followed_accounts_updated_at
    BEFORE UPDATE ON followed_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE followed_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_posts ENABLE ROW LEVEL SECURITY;

-- Policies for followed_accounts
CREATE POLICY "Users can view their own followed accounts"
    ON followed_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own followed accounts"
    ON followed_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own followed accounts"
    ON followed_accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own followed accounts"
    ON followed_accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for external_posts
CREATE POLICY "Users can view their own external posts"
    ON external_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own external posts"
    ON external_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own external posts"
    ON external_posts FOR DELETE
    USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE followed_accounts IS 'Tracks external social media accounts that users want to follow';
COMMENT ON TABLE external_posts IS 'Stores posts fetched from external social media platforms';
COMMENT ON COLUMN followed_accounts.enabled IS 'Allows users to temporarily disable feed without unfollowing';
COMMENT ON COLUMN external_posts.content_type IS 'Auto-detected content type based on AlbuCon filtering system';
