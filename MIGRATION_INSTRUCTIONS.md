# Database Migration Required: Reaction Types

## Overview
This update adds support for multiple reaction types (❤️ Heart, 😊 Smile, ✨ Sparkles, 🤗 Hug, 🤔 Thinking) to posts, replacing the simple "like" system.

## Migration File
The migration SQL is located at:
```
supabase/migrations/008_add_reaction_types.sql
```

## How to Apply

### Option 1: Supabase Dashboard (Recommended for most users)
1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/008_add_reaction_types.sql`
4. Paste and run the SQL in the editor
5. Verify the migration succeeded

### Option 2: Supabase CLI (If you have it installed)
```bash
supabase db push
```

Or run the migration directly:
```bash
supabase db execute --file supabase/migrations/008_add_reaction_types.sql
```

## What This Migration Does
1. Adds a `reaction_type` column to the `likes` table (VARCHAR(20), default 'heart')
2. Updates all existing likes to have 'heart' as their reaction type
3. Adds an index for better query performance
4. Adds a constraint to ensure only valid reaction types are used

## Verification
After running the migration, you can verify it worked by running:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'likes' AND column_name = 'reaction_type';
```

## Changes in This Update
- **New utility file**: `src/utils/reactionTypes.js` - Defines the 5 reaction types
- **Updated component**: `src/components/PostCard.jsx` - Shows reaction picker and breakdown
- **Updated styles**: `src/components/PostCard.css` - Reaction picker styling
- **Updated profile**: `src/pages/Profile.jsx` - Shows "Reactions Received" instead of "Likes Received"

## Notes
- All existing likes will automatically become "heart" reactions
- The migration is safe and preserves all existing data
- Users can now choose from 5 different reaction types when reacting to posts
- The system still tracks the total count of all reactions
