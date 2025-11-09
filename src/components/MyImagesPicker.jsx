import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserImages } from '../lib/imageUtils'
import './MyImagesPicker.css'

export default function MyImagesPicker({ onSelectImages, maxImages = 4, onClose }) {
  const { user } = useAuth()
  const [images, setImages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadImages()
  }, [user])

  const loadImages = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getUserImages(user.id)
      setImages(data)
    } catch (err) {
      console.error('Error loading images:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleImageSelection = (imageUrl) => {
    setSelectedImages(prev => {
      if (prev.includes(imageUrl)) {
        return prev.filter(url => url !== imageUrl)
      } else if (prev.length < maxImages) {
        return [...prev, imageUrl]
      }
      return prev
    })
  }

  const handleConfirm = () => {
    onSelectImages(selectedImages)
    onClose()
  }

  return (
    <div className="my-images-picker-overlay" onClick={onClose}>
      <div className="my-images-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="my-images-picker-header">
          <h3>Select from My Images</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="my-images-picker-info">
          Selected: {selectedImages.length} / {maxImages}
        </div>

        {loading ? (
          <div className="my-images-picker-loading">
            <div className="spinner"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="my-images-picker-empty">
            <p>📷 No images uploaded yet</p>
            <p>Upload some images first to share them in messages</p>
          </div>
        ) : (
          <div className="my-images-picker-grid">
            {images.map((image) => {
              const isSelected = selectedImages.includes(image.image_url)
              return (
                <div
                  key={image.id}
                  className={`my-images-picker-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleImageSelection(image.image_url)}
                >
                  <img src={image.image_url} alt="Your image" />
                  {isSelected && (
                    <div className="my-images-picker-check">✓</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="my-images-picker-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={selectedImages.length === 0}
          >
            Share {selectedImages.length > 0 ? `(${selectedImages.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
