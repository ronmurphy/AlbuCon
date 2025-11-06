# Image Feature Setup Guide 🖼️

This guide will walk you through setting up the image functionality for AlbuCon.

## Features Implemented:

✅ **Image URL Support** - Paste any image URL and it displays in posts
✅ **Image Upload** - Upload images from your device (compressed automatically)
✅ **20 Image Limit** - Each user can upload up to 20 images
✅ **Image Compression** - Automatically compresses images to save space
✅ **Image Preview** - See images before posting

---

## Step 1: Run Database Setup (Required)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** → **New Query**
3. Open the file `setup-image-storage.sql` from your repo
4. Copy the entire SQL script
5. Paste it into the Supabase SQL Editor
6. Click **Run**

This creates:
- `image_url` column in the `posts` table
- `user_images` table to track uploaded images
- Row Level Security policies
- Trigger to enforce 20-image limit

---

## Step 2: Create Storage Bucket in Supabase (Required)

### Create the Bucket:

1. In your Supabase dashboard, click **Storage** in the left sidebar
2. Click **"New bucket"**
3. Enter these settings:
   - **Name**: `post-images`
   - **Public bucket**: ✅ **Check this box** (images need to be publicly accessible)
   - **File size limit**: 10 MB (optional, but recommended)
   - **Allowed MIME types**: Leave empty or add: `image/jpeg, image/png, image/gif, image/webp`
4. Click **"Create bucket"**

### Set Storage Policies:

1. Click on the `post-images` bucket you just created
2. Click **"Policies"** tab
3. Click **"New policy"**

**Policy 1: Allow authenticated users to upload**
- Click **"For full customization"** → **INSERT**
- **Policy name**: `Authenticated users can upload images`
- **Target roles**: `authenticated`
- **Policy definition** - Use this SQL:
```sql
(bucket_id = 'post-images'::text) AND (auth.uid() = (storage.foldername(name))[1]::uuid)
```
- Click **"Review"** → **"Save policy"**

**Policy 2: Allow everyone to view images**
- Click **"New policy"** → **"For full customization"** → **SELECT**
- **Policy name**: `Public images are viewable by everyone`
- **Target roles**: `public`
- **Policy definition** - Use this SQL:
```sql
bucket_id = 'post-images'::text
```
- Click **"Review"** → **"Save policy"**

**Policy 3: Allow users to delete their own images**
- Click **"New policy"** → **"For full customization"** → **DELETE**
- **Policy name**: `Users can delete their own images`
- **Target roles**: `authenticated`
- **Policy definition** - Use this SQL:
```sql
(bucket_id = 'post-images'::text) AND (auth.uid() = (storage.foldername(name))[1]::uuid)
```
- Click **"Review"** → **"Save policy"**

---

## Step 3: Deploy the Code

The code is ready to deploy! Just merge the PR to main:

1. Go to your GitHub repo pulls page
2. Create a new pull request from your feature branch
3. Merge it to `main`
4. GitHub Actions will auto-deploy

---

## How It Works:

### For Users:

**Option 1: Paste an Image URL**
1. Find an image online (Imgur, Discord CDN, etc.)
2. Copy the direct image link (must end in .jpg, .png, .gif, or .webp)
3. Paste it in the "Image URL" field when creating a post
4. See preview → Click "Post"

**Option 2: Upload from Device**
1. Click "📷 Upload Image" button
2. Select an image (JPG, PNG, GIF, or WEBP)
3. Image is automatically compressed (max 1920px, under 1MB)
4. See preview → Click "Post"

**Limits:**
- Each user can upload up to 20 images
- Original files must be under 10MB
- After compression, images are optimized for web
- You can delete images to free up slots (coming soon!)

### Technical Details:

**Image Compression:**
- Max dimensions: 1920px (maintains aspect ratio)
- Target size: Under 1MB
- Format: Converted to JPEG with quality 90%
- If still too large, quality reduces automatically

**Storage Structure:**
```
post-images/
  └── {user_id}/
      ├── 1699123456789.jpg
      ├── 1699123567890.png
      └── ...
```

**Database:**
- `posts.image_url` stores the image URL (external or Supabase)
- `user_images` tracks all uploaded images for the 20-image limit

---

## Troubleshooting:

### Images not uploading?

**Check these:**
1. Did you create the `post-images` bucket?
2. Is the bucket set to **Public**?
3. Did you add the storage policies?
4. Check browser console for errors

### "Image limit reached" error?

You've uploaded 20 images! Coming soon: Image management page to delete old images.

### Images not displaying?

**For URL posts:**
- Make sure the URL ends with .jpg, .png, .gif, or .webp
- Test the URL in a new browser tab - does it show the image?

**For uploaded images:**
- Check Supabase Storage → post-images bucket
- Verify the file is there
- Check if it's publicly accessible

### Upload fails with "Policy violation"?

- Make sure you're logged in
- Check that storage policies are set correctly
- Verify bucket is public

---

## Coming Soon:

📋 **Image Management Page**
- View all your uploaded images
- Delete images to free up slots
- See image sizes and upload dates

🎨 **Additional Features**
- Image captions
- Multiple images per post
- Image editing/filters
- GIF support improvements

---

## Storage Costs:

**Supabase Free Tier:**
- 1GB storage free
- ~1,000+ compressed images
- Should be plenty for a small community!

**If you exceed:**
- Supabase Pro: $25/month for 100GB
- Or implement image cleanup features

---

## Security Notes:

✅ **What's Secure:**
- Users can only upload to their own folder
- Users can only delete their own images
- File types are validated
- File sizes are limited
- Images are compressed (prevents large uploads)

⚠️ **Considerations:**
- Images are publicly accessible (anyone with the URL can view)
- No content moderation (yet)
- Consider adding NSFW filters if needed

---

Need help? Check the browser console for error messages or open an issue!
