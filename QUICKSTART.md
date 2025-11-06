# Quick Start Guide - AlbuCon 🚀

Get your social network up and running in 15 minutes!

## Step 1: Get Supabase Running (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Name it "AlbuCon", choose a password, select a region
4. Wait 2-3 minutes for setup
5. Go to **SQL Editor** → **New Query**
6. Copy/paste everything from `database-schema.sql` into the editor
7. Click **Run** ✅

## Step 2: Get Your Keys (2 minutes)

1. In Supabase, click **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL**
   - **anon public** key

## Step 3: Configure Locally (3 minutes)

```bash
# Create .env file
cp .env.example .env

# Edit .env and paste your Supabase credentials
# (Use your favorite text editor)
```

Your `.env` should look like:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your_long_key_here
```

## Step 4: Run It! (2 minutes)

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser. Done! 🎉

## Step 5: Deploy to GitHub Pages (3 minutes)

```bash
# Update vite.config.js base path to match your repo name
# Then deploy:
npm run deploy
```

Go to your repo **Settings** → **Pages** → Set source to "gh-pages" branch.

Your site will be live at: `https://YOUR_USERNAME.github.io/AlbuCon/`

## Final Step: Configure Production

In Supabase:
1. **Authentication** → **URL Configuration**
2. Add your GitHub Pages URL to both:
   - Site URL
   - Redirect URLs
3. Save ✅

## That's it!

You now have a fully functional social network! 🎊

Need more details? Check [SETUP.md](./SETUP.md) for the comprehensive guide.

## Quick Troubleshooting

**Blank page after deploy?**
- Check the `base` path in `vite.config.js` matches your repo name

**Can't sign up?**
- Check your email spam folder for confirmation

**API errors?**
- Double-check your `.env` file has the right keys
- No quotes around the values

**Need help?** Open an issue or check [SETUP.md](./SETUP.md) for detailed troubleshooting.
