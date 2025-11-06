import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserImages, deleteImage } from '../lib/imageUtils'
import { supabase } from '../lib/supabase'
import './MyImages.css'

export default function MyImages() {
  const { user } = useAuth()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [settingProfilePic, setSettingProfilePic] = useState(null)
  const [currentProfilePic, setCurrentProfilePic] = useState(null)
  const [error, setError] = useState(null)

  const loadImages = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getUserImages(user.id)
      setImages(data)

      // Load current profile picture
      const { data: profileData } = await supabase
        .from('profiles')
        .select('profile_picture_url')
        .eq('id', user.id)
        .single()

      setCurrentProfilePic(profileData?.profile_picture_url)
    } catch (err) {
      console.error('Error loading images:', err)
      setError('Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [user])

  const handleSetProfilePicture = async (imageUrl) => {
    try {
      setSettingProfilePic(imageUrl)
      setError(null)

      const { error } = await supabase
        .from('profiles')
        .update({ profile_picture_url: imageUrl })
        .eq('id', user.id)

      if (error) throw error

      setCurrentProfilePic(imageUrl)
      alert('Profile picture updated! 🎉')
    } catch (err) {
      console.error('Error setting profile picture:', err)
      setError('Failed to set profile picture. Please try again.')
    } finally {
      setSettingProfilePic(null)
    }
  }

  const handleDelete = async (imageId, storagePath) => {
    if (!confirm('Are you sure you want to delete this image? This cannot be undone.')) {
      return
    }

    try {
      setDeleting(imageId)
      setError(null)
      await deleteImage(imageId, storagePath)
      // Remove from local state
      setImages(images.filter(img => img.id !== imageId))
    } catch (err) {
      console.error('Error deleting image:', err)
      setError('Failed to delete image. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <div className="container my-images-page">
        <div className="card">
          <p className="login-prompt">Please log in to view your images.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container my-images-page">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="container my-images-page">
      <div className="page-header">
        <h1 className="page-title">My Images</h1>
        <p className="page-subtitle">
          You have uploaded <strong>{images.length}/20</strong> images
        </p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {images.length === 0 ? (
        <div className="empty-state card">
          <p className="empty-icon">📷</p>
          <p className="empty-text">You haven't uploaded any images yet.</p>
          <p className="empty-hint">Upload images when creating posts!</p>
        </div>
      ) : (
        <div className="images-grid">
          {images.map((image) => {
            const isCurrentProfilePic = currentProfilePic === image.public_url
            return (
              <div key={image.id} className={`image-item card ${isCurrentProfilePic ? 'profile-pic-active' : ''}`}>
                {isCurrentProfilePic && (
                  <div className="profile-pic-badge">
                    ✨ Profile Picture
                  </div>
                )}

                <div className="image-thumbnail">
                  <img
                    src={image.public_url}
                    alt="Uploaded image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </div>

                <div className="image-info">
                  <div className="image-details">
                    <span className="image-size">{formatFileSize(image.file_size)}</span>
                    <span className="image-date">{formatDate(image.created_at)}</span>
                  </div>

                  <div className="image-actions">
                    {!isCurrentProfilePic && (
                      <button
                        className="btn btn-profile"
                        onClick={() => handleSetProfilePicture(image.public_url)}
                        disabled={settingProfilePic !== null}
                      >
                        {settingProfilePic === image.public_url ? 'Setting...' : '👤 Set as Profile'}
                      </button>
                    )}

                    <button
                      className="btn btn-delete"
                      onClick={() => handleDelete(image.id, image.storage_path)}
                      disabled={deleting === image.id}
                    >
                      {deleting === image.id ? 'Deleting...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {images.length >= 20 && (
        <div className="limit-notice card">
          <p><strong>⚠️ You've reached the 20 image limit!</strong></p>
          <p>Delete some images above to free up space for new uploads.</p>
        </div>
      )}
    </div>
  )
}
