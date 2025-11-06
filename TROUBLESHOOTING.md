# Troubleshooting Guide

## Issue: Posts Not Showing in Feed

### Symptoms:
- Posts appear in Supabase Table Editor (posts table has data)
- But feed shows "No posts yet" or is empty
- Posts are being created successfully but not displaying

### Root Cause:
The query joins posts with the `profiles` table. If a user's profile doesn't exist (perhaps they signed up before the database trigger was set up), the join fails and posts don't appear.

### Solution:

#### Step 1: Create Missing Profiles (Run in Supabase SQL Editor)

Go to your Supabase project → SQL Editor → New Query

Copy and paste this SQL:

```sql
-- Create profiles for any users who don't have one yet
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

-- Verify profiles were created
SELECT COUNT(*) as total_profiles FROM profiles;

-- Check your posts now have profiles attached
SELECT
  p.id,
  p.content,
  pr.username,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC;
```

Click **Run** or press Cmd/Ctrl + Enter.

#### Step 2: Deploy the Code Fix

The code has been updated to:
1. Use explicit foreign key references for better reliability
2. Add fallback queries if profile joins fail
3. Add console logging for debugging

This is already in the codebase - just needs to be deployed.

#### Step 3: Verify the Fix

1. Go to your AlbuCon site
2. Open browser console (Right-click → Inspect → Console tab)
3. Refresh the page
4. You should see: `Fetched posts: [array of posts]`
5. Posts should now appear in the feed!

---

## Issue: Redirect to Wrong Site After Refresh

### Symptoms:
- After refreshing, browser goes to `ronmurphy.github.io/` (404)
- Or redirects to a different old site

### Solution:
This was fixed by adding `basename` to React Router. Make sure your code includes:

```jsx
<Router basename={import.meta.env.BASE_URL}>
```

---

## Issue: Authentication Redirect Errors

### Symptoms:
- After signing up or logging in, redirects to wrong URL
- Gets stuck on login page
- "Invalid redirect URL" errors

### Solution:

1. **Check Supabase URL Configuration:**
   - Go to Supabase → Authentication → URL Configuration
   - **Site URL** should be: `https://ronmurphy.github.io/AlbuCon/`
   - **Redirect URLs** should include: `https://ronmurphy.github.io/AlbuCon/**`

2. **Check GitHub Secrets:**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly

---

## Debugging Tips

### Check Browser Console

Always open the browser console when testing:
1. Right-click on the page
2. Click "Inspect" or "Inspect Element"
3. Click "Console" tab
4. Look for red error messages

Common errors and what they mean:
- `Failed to fetch` = Network issue or wrong Supabase URL
- `Invalid API key` = Wrong Supabase key in GitHub Secrets
- `Row Level Security policy violation` = Database permissions issue
- `relation "profiles" does not exist` = Database schema not run

### Check Supabase Table Editor

1. Go to Supabase → Table Editor
2. Check each table:
   - **profiles**: Should have one row per user
   - **posts**: Should show all created posts
   - **likes**: Should show all likes

### Check GitHub Actions Logs

If deployment fails:
1. Go to GitHub repo → Actions tab
2. Click on the failed workflow
3. Click on the failed step
4. Read the error message

Common issues:
- `Missing secret` = GitHub Secrets not set
- `Build failed` = Code syntax error
- `Permission denied` = GitHub Pages not configured

---

## Still Having Issues?

1. Check that you ran the complete database schema (`database-schema.sql`)
2. Verify GitHub Secrets are set (not Environment secrets)
3. Make sure GitHub Pages is set to "GitHub Actions" mode
4. Clear browser cache and try again
5. Check Supabase logs in Dashboard → Logs

If posts are in the database but not showing, run the `fix-missing-profiles.sql` script!
