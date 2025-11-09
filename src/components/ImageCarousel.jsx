import { useState } from 'react'
import './ImageCarousel.css'

/**
 * Image carousel for displaying multiple images in posts
 * Supports up to 4 images with navigation buttons
 */
export default function ImageCarousel({ images, onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) return null

  // Single image - no carousel needed
  if (images.length === 1) {
    return (
      <div
        className="post-image-container"
        onClick={() => onImageClick?.(images[0], 'Post image')}
        style={{ cursor: onImageClick ? 'pointer' : 'default' }}
      >
        <img
          src={images[0]}
          alt="Post image"
          className="post-image"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.style.display = 'none'
            console.error('Failed to load image:', images[0])
          }}
        />
      </div>
    )
  }

  // Multiple images - show carousel
  const handlePrevious = (e) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = (e) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleDotClick = (index, e) => {
    e.stopPropagation()
    setCurrentIndex(index)
  }

  return (
    <div className="image-carousel">
      <div
        className="carousel-image-container"
        onClick={() => onImageClick?.(images[currentIndex], `Post image ${currentIndex + 1}`)}
        style={{ cursor: onImageClick ? 'pointer' : 'default' }}
      >
        <img
          src={images[currentIndex]}
          alt={`Post image ${currentIndex + 1}`}
          className="carousel-image"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.style.display = 'none'
            console.error('Failed to load image:', images[currentIndex])
          }}
        />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              className="carousel-nav carousel-nav-prev"
              onClick={handlePrevious}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="carousel-nav carousel-nav-next"
              onClick={handleNext}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="carousel-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="carousel-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={(e) => handleDotClick(index, e)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
