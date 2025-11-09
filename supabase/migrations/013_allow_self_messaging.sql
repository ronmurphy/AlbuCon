-- Remove the constraint that prevents users from messaging themselves
-- This allows users to use DMs as a personal notepad/reminder system

ALTER TABLE direct_messages
DROP CONSTRAINT IF EXISTS direct_messages_check;
