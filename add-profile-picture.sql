-- Add Profile Picture Support
-- Run this in Supabase SQL Editor

-- Add profile_picture_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Users should be able to update their own profile picture
-- (The existing "Users can update their own profile" policy covers this)
