# AlbuCon Setup Guide

This guide will walk you through setting up and deploying AlbuCon, a positive social network built with React and Supabase, hosted for free on GitHub Pages.

## 🎯 What You'll Need

- A GitHub account (free)
- A Supabase account (free)
- Node.js installed on your computer (v16 or higher)
- Basic familiarity with the terminal/command line

## 📋 Table of Contents

1. [Setting Up Supabase](#1-setting-up-supabase)
2. [Configuring the Project](#2-configuring-the-project)
3. [Running Locally](#3-running-locally)
4. [Deploying to GitHub Pages](#4-deploying-to-github-pages)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Setting Up Supabase

### Step 1.1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign Up"
3. Sign up with GitHub (recommended) or email

### Step 1.2: Create a New Project

1. Click "New Project" in your Supabase dashboard
2. Fill in the details:
   - **Name**: AlbuCon (or whatever you prefer)
   - **Database Password**: Choose a strong password and save it somewhere safe
   - **Region**: Choose the region closest to your target users
   - **Pricing Plan**: Select "Free" (this is perfect for getting started)
3. Click "Create new project"
4. Wait 2-3 minutes for your database to be set up

### Step 1.3: Set Up the Database

1. In your Supabase project dashboard, click on the **SQL Editor** icon in the left sidebar
2. Click "New Query"
3. Open the `database-schema.sql` file from this repository
4. Copy the entire contents of the file
5. Paste it into the SQL Editor in Supabase
6. Click "Run" or press Cmd/Ctrl + Enter
7. You should see a success message. Your database tables are now created!

### Step 1.4: Get Your API Keys

1. In your Supabase project, click on the **Settings** icon (gear icon) in the left sidebar
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (a long string of characters)
4. Keep this page open - you'll need these values in the next step!

---

## 2. Configuring the Project

### Step 2.1: Clone and Install

If you haven't already, clone this repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/AlbuCon.git
cd AlbuCon

# Install dependencies
npm install
```

### Step 2.2: Set Up Environment Variables

1. In the project root, copy the example environment file:

```bash
cp .env.example .env
```

2. Open the `.env` file in your text editor

3. Replace the placeholder values with your Supabase credentials from Step 1.4:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

4. Save the file

⚠️ **Important**: Never commit your `.env` file to git. It's already in `.gitignore` to prevent this.

---

## 3. Running Locally

Now you can run the app on your local machine:

```bash
npm run dev
```

This will start a development server, usually at `http://localhost:5173`

Open your browser and visit that URL. You should see AlbuCon running!

### Try It Out:

1. Click "Get Started" or "Sign Up"
2. Create an account with your email
3. Check your email for a confirmation link (check spam folder too!)
4. Click the confirmation link
5. Sign in with your credentials
6. Start posting positive vibes! ✨

---

## 4. Deploying to GitHub Pages

### Step 4.1: Update the Base Path

Before deploying, you need to set the correct base path:

1. Open `vite.config.js`
2. Find the line: `base: '/AlbuCon/',`
3. Replace `AlbuCon` with your actual repository name (case-sensitive!)
   - Example: If your repo is `my-social-network`, change it to: `base: '/my-social-network/',`
4. Save the file

### Step 4.2: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll down to **Pages** in the left sidebar
4. Under "Build and deployment":
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select "gh-pages" and "/ (root)"
   - Click **Save**

Note: The gh-pages branch will be created automatically when you first deploy.

### Step 4.3: Deploy

Now deploy your app:

```bash
npm run deploy
```

This command will:
1. Build your app for production
2. Deploy it to the gh-pages branch
3. Make it live on GitHub Pages

After a minute or two, your site will be live at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

Example: `https://johnsmith.github.io/AlbuCon/`

### Step 4.4: Configure Supabase for Production

Important: Add your GitHub Pages URL to Supabase's allowed URLs:

1. Go back to your Supabase project
2. Click **Authentication** in the left sidebar
3. Click **URL Configuration**
4. Add your GitHub Pages URL to **Site URL**:
   - Example: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
5. Also add it to **Redirect URLs**
6. Click **Save**

---

## 5. Troubleshooting

### Issue: "Failed to fetch" or API errors

**Solution**: Make sure your `.env` file has the correct Supabase URL and key. The keys should not have quotes around them.

### Issue: Sign up isn't working

**Solution**:
1. Check your email spam folder for the confirmation email
2. In Supabase, go to Authentication > Settings and make sure "Enable email confirmations" is configured correctly

### Issue: GitHub Pages shows a blank page

**Solutions**:
1. Make sure the `base` path in `vite.config.js` matches your repository name exactly
2. Check that GitHub Pages is enabled in your repository settings
3. Wait a few minutes - GitHub Pages can take time to update
4. Clear your browser cache

### Issue: Users can't sign in after deployment

**Solution**: Make sure you added your GitHub Pages URL to Supabase's allowed URLs (see Step 4.4)

### Issue: "Invalid API key" error

**Solution**: You're using the wrong key. Make sure you're using the **anon public** key, NOT the service role key. The anon key is safe to use in your frontend.

---

## 🎉 Success!

You now have a fully functional social network running on free infrastructure!

### What's Next?

- Customize the colors in `src/index.css`
- Add more features (comments, user profiles, etc.)
- Set up a custom domain (GitHub Pages supports this!)
- Monitor usage in your Supabase dashboard

### Free Tier Limits

**GitHub Pages:**
- 1 GB storage
- 100 GB bandwidth per month
- Should be plenty for a small community!

**Supabase Free Tier:**
- 500 MB database space
- 2 GB file storage
- 50,000 monthly active users
- More than enough to get started!

### Need Help?

If you run into issues:
1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Check the [Vite Documentation](https://vitejs.dev)
3. Open an issue in this repository

---

## 📝 Notes

- Remember to never commit your `.env` file
- The free tiers are generous but monitor your usage
- Consider upgrading if your app grows popular
- Back up your Supabase database regularly (Supabase has backup features)

Happy coding! ✨
