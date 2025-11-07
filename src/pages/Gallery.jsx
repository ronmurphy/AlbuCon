import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Gallery.css'

export default function Gallery({ userId, username, onImageClick }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserImages()
  }, [userId])

  const fetchUserImages = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('user_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setImages(data || [])
    } catch (error) {
      console.error('Error fetching gallery images:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="gallery-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="gallery-container">
        <div className="gallery-empty card">
          <p>📷 No images uploaded yet</p>
          <p className="empty-hint">
            {username ? `${username} hasn't uploaded any images.` : 'Upload images from your profile page.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h2>{username ? `${username}'s Gallery` : 'My Gallery'}</h2>
        <p className="gallery-count">{images.length} image{images.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="gallery-grid">
        {images.map((image) => (
          <div
            key={image.id}
            className="gallery-item"
            onClick={() => onImageClick?.(image.public_url, 'Gallery Image')}
          >
            <img
              src={image.public_url}
              alt="Gallery image"
              className="gallery-image"
              onError={(e) => {
                e.target.style.display = 'none'
                console.error('Failed to load image:', image.public_url)
              }}
            />
            <div className="gallery-item-overlay">
              <span className="gallery-item-date">
                {new Date(image.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
