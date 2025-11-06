# GitHub Actions Setup Guide 🚀

This guide will help you set up automatic deployments with GitHub Actions - completely FREE!

## What You Get

- ✅ Automatic deployments when you push to main branch
- ✅ Secure storage of your Supabase credentials
- ✅ No need to clone the repo locally
- ✅ Edit code directly on vscode.dev or github.dev
- ✅ 100% FREE (2,000 minutes/month on public repos)

---

## Step 1: Get Your Supabase Credentials

You mentioned you already set up the SQL schema - great! Now get these two values:

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **API**
3. Copy these two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: Long string starting with `eyJ...`

**Important:** Use the **anon public** key, NOT the service_role key or legacy keys!

---

## Step 2: Add Secrets to GitHub

Now we'll securely store your Supabase credentials in GitHub:

1. Go to your GitHub repository: `https://github.com/ronmurphy/AlbuCon`

2. Click **Settings** (top tab, near Code/Issues/Pull requests)

3. In the left sidebar, find **Secrets and variables** → **Actions**

4. Click the green **New repository secret** button

5. Add your first secret:
   - **Name**: `VITE_SUPABASE_URL`
   - **Secret**: Paste your Project URL (e.g., `https://xxxxx.supabase.co`)
   - Click **Add secret**

6. Add your second secret:
   - Click **New repository secret** again
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Secret**: Paste your anon public key (the long JWT token)
   - Click **Add secret**

You should now see two secrets listed:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Step 3: Configure GitHub Pages

1. Still in your repo **Settings**
2. Find **Pages** in the left sidebar
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
   - (Not "Deploy from a branch" - make sure it says "GitHub Actions")
4. Save if needed

---

## Step 4: Merge Your Branch to Main

The GitHub Action runs when you push to the `main` branch. You currently have code on a `claude/...` branch.

### Option A: Via GitHub Website (Easiest)

1. Go to: `https://github.com/ronmurphy/AlbuCon/pulls`
2. You should see a notification about your recent branch push
3. Click **Compare & pull request**
4. Review the changes
5. Click **Create pull request**
6. Click **Merge pull request**
7. Click **Confirm merge**

### Option B: Via Command Line (If you cloned locally)

```bash
git checkout main
git merge claude/general-session-011CUrYUVvodKJK6sszcf4ZU
git push
```

---

## Step 5: Watch the Magic! ✨

1. Go to the **Actions** tab in your GitHub repo
2. You'll see a workflow running called "Deploy to GitHub Pages"
3. Click on it to watch the progress (takes ~2 minutes)
4. Once it's done (green checkmark), your site is live!

Your site will be at:
```
https://ronmurphy.github.io/AlbuCon/
```

---

## Step 6: Configure Supabase for Production

Almost done! Tell Supabase about your live URL:

1. Go back to your Supabase project
2. Click **Authentication** → **URL Configuration**
3. Add your GitHub Pages URL in both fields:
   - **Site URL**: `https://ronmurphy.github.io/AlbuCon/`
   - **Redirect URLs**: Add the same URL
4. Click **Save**

---

## 🎉 You're Done!

Now every time you:
- Merge code to the main branch
- Push to main branch
- Click "Run workflow" in the Actions tab

GitHub will automatically:
- Build your app with the Supabase credentials
- Deploy to GitHub Pages
- Make it live!

---

## Editing Code Going Forward

You can now edit your code entirely in the browser:

1. Go to your repo: `https://github.com/ronmurphy/AlbuCon`
2. Press `.` (period key) to open vscode.dev
3. Make your changes
4. Commit to main branch
5. GitHub Actions automatically deploys! 🚀

---

## Troubleshooting

### The build is failing in Actions

- Check that both secrets are set correctly in Settings → Secrets and variables → Actions
- Make sure there are no extra spaces in the secret values
- Secret names must be exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Site shows blank page

- Check the Actions tab - make sure the deployment succeeded (green checkmark)
- Check browser console for errors
- Make sure you added your GitHub Pages URL to Supabase redirect URLs

### Can't find Project URL in Supabase

Try these locations:
- **Settings** → **API** (should be at the top)
- **Settings** → **General** → scroll to "Project URL"

### Still need help?

Open an issue in the repo with:
- What step you're on
- What error message you're seeing
- Screenshot if helpful

---

## Cost Breakdown

Just to confirm - everything is FREE:

| Service | Free Tier | Cost |
|---------|-----------|------|
| GitHub Pages | 100GB bandwidth/month | $0 |
| GitHub Actions | 2,000 minutes/month | $0 |
| Supabase | 500MB DB, 50k users | $0 |
| **Total** | | **$0/month** |

Your friend can use this indefinitely without any charges! 🎊
