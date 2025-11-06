import { supabase } from './supabase'

// Validate if a string is a valid image URL
export function isValidImageUrl(url) {
  if (!url) return false

  try {
    const urlObj = new URL(url)
    // Check if URL ends with common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    const pathname = urlObj.pathname.toLowerCase()
    return imageExtensions.some(ext => pathname.endsWith(ext))
  } catch {
    return false
  }
}

// Extract image URLs from post content
export function extractImageUrls(content) {
  if (!content) return []

  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|bmp))/gi
  const matches = content.match(urlRegex)
  return matches || []
}

// Compress image before upload
export async function compressImage(file, maxSizeMB = 1, maxWidthOrHeight = 1920) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width
            width = maxWidthOrHeight
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height
            height = maxWidthOrHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Start with high quality and reduce if needed
        let quality = 0.9
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }

              const sizeMB = blob.size / 1024 / 1024

              // If still too large and quality can be reduced, try again
              if (sizeMB > maxSizeMB && quality > 0.5) {
                quality -= 0.1
                tryCompress()
              } else {
                resolve(blob)
              }
            },
            'image/jpeg',
            quality
          )
        }

        tryCompress()
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// Upload image to Supabase Storage
export async function uploadImage(file, userId) {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, GIF, or WEBP images.')
    }

    // Check file size (before compression)
    const maxSize = 10 * 1024 * 1024 // 10MB max original file
    if (file.size > maxSize) {
      throw new Error('File too large. Please upload images under 10MB.')
    }

    // Compress image
    const compressedBlob = await compressImage(file)

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, compressedBlob, {
        contentType: file.type,
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName)

    // Record in user_images table
    const { error: dbError } = await supabase
      .from('user_images')
      .insert({
        user_id: userId,
        storage_path: fileName,
        public_url: publicUrlData.publicUrl,
        file_size: compressedBlob.size
      })

    if (dbError) {
      // If database insert fails, try to delete the uploaded file
      await supabase.storage.from('post-images').remove([fileName])
      throw dbError
    }

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Get user's uploaded images
export async function getUserImages(userId) {
  const { data, error } = await supabase
    .from('user_images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Delete image from storage and database
export async function deleteImage(imageId, storagePath) {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('post-images')
      .remove([storagePath])

    if (storageError) throw storageError

    // Delete from database
    const { error: dbError } = await supabase
      .from('user_images')
      .delete()
      .eq('id', imageId)

    if (dbError) throw dbError

    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

// Check how many images a user has uploaded
export async function getUserImageCount(userId) {
  const { count, error } = await supabase
    .from('user_images')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error
  return count || 0
}
