-- Fix for Missing Profiles
-- Run this in Supabase SQL Editor if posts aren't showing up

-- This will create profiles for any users who don't have one yet
-- (In case they signed up before the trigger was set up)

INSERT INTO public.profiles (id, username)
SELECT
  auth.users.id,
  COALESCE(
    auth.users.raw_user_meta_data->>'username',
    'user_' || substring(auth.users.id::text, 1, 8)
  ) as username
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;

-- Check if profiles were created
SELECT COUNT(*) as profiles_created FROM profiles;

-- Verify your posts now have profiles
SELECT
  p.id,
  p.content,
  pr.username,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC;
