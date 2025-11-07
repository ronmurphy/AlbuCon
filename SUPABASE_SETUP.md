# Supabase Edge Function Setup

This guide explains how to set up automatic deployment of the Reddit proxy Edge Function using GitHub Actions.

## Prerequisites

- A Supabase account and project
- Admin access to your GitHub repository

## Step 1: Get Supabase Credentials

### 1.1 Get your Project ID

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **General**
4. Copy your **Reference ID** (looks like: `abcdefghijklmnop`)

### 1.2 Generate Access Token

1. Go to [Supabase Access Tokens](https://supabase.com/dashboard/account/tokens)
2. Click **Generate New Token**
3. Give it a name like "GitHub Actions Deploy"
4. Copy the token (it will only be shown once!)

## Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these two secrets:

### Secret 1: SUPABASE_PROJECT_ID
- **Name:** `SUPABASE_PROJECT_ID`
- **Value:** Your project reference ID from Step 1.1

### Secret 2: SUPABASE_ACCESS_TOKEN
- **Name:** `SUPABASE_ACCESS_TOKEN`
- **Value:** Your access token from Step 1.2

## Step 3: Deploy the Edge Function

You have two options to trigger the deployment:

### Option A: Manual Deployment (Recommended First Time)

1. Go to **Actions** tab in your GitHub repository
2. Click **Deploy Supabase Edge Functions** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for the workflow to complete (should take ~1 minute)

### Option B: Automatic on Merge

The workflow automatically runs when you merge changes to the `main` branch that affect files in `supabase/functions/`.

## Step 4: Verify Deployment

After the workflow completes:

1. Check the workflow logs for the success message
2. Look for the function URL in the logs: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/reddit-proxy`
3. Open your app in the browser
4. Open the browser console (F12)
5. Look for the health check message:
   - ✅ `Reddit proxy Edge Function is working!` (Success)
   - ❌ Error messages if something went wrong

## Step 5: Update Environment Variables

Make sure your `.env` file (for local development) or environment variables (for production) include:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Troubleshooting

### "Reddit proxy Edge Function not deployed" error

**Solution:** The Edge Function hasn't been deployed yet. Run the GitHub Action manually (see Step 3, Option A).

### "Supabase URL not configured" error

**Solution:** Set `VITE_SUPABASE_URL` in your environment variables.

### GitHub Action fails with authentication error

**Solution:**
- Verify your `SUPABASE_ACCESS_TOKEN` is correct and not expired
- Make sure you copied the token correctly (no extra spaces)
- Generate a new token if needed

### Function works locally but not on GitHub Pages

**Solution:**
- GitHub Pages needs the environment variables set in the build process
- Check your build/deploy workflow includes the Supabase environment variables

## Security Notes

- ✅ GitHub Secrets are encrypted and not exposed in logs
- ✅ The Edge Function uses `verify_jwt = false` for public Reddit data (this is safe)
- ✅ The function only accepts Reddit URLs for security
- ⚠️ Never commit `.env` files with real credentials to GitHub

## Next Steps

After successful deployment:
- The Reddit integration should work without CORS errors
- Health check will show green ✅ on app startup
- You can monitor Edge Function usage in Supabase Dashboard → Edge Functions
