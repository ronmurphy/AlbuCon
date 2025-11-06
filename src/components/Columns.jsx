import { useState, useRef, useEffect } from 'react'
import './Columns.css'

export default function Columns({ children, title }) {
  const [currentColumn, setCurrentColumn] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const columnsRef = useRef(null)

  const columns = Array.isArray(children) ? children : [children]

  // Touch/Mouse drag scrolling
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setStartX(e.pageX - columnsRef.current.offsetLeft)
    setScrollLeft(columnsRef.current.scrollLeft)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - columnsRef.current.offsetLeft
    const walk = (x - startX) * 2
    columnsRef.current.scrollLeft = scrollLeft - walk
  }

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].pageX - columnsRef.current.offsetLeft)
    setScrollLeft(columnsRef.current.scrollLeft)
  }

  const handleTouchMove = (e) => {
    const x = e.touches[0].pageX - columnsRef.current.offsetLeft
    const walk = (x - startX) * 2
    columnsRef.current.scrollLeft = scrollLeft - walk
  }

  // Navigation buttons
  const scrollToColumn = (index) => {
    if (columnsRef.current) {
      const columnWidth = columnsRef.current.scrollWidth / columns.length
      columnsRef.current.scrollTo({
        left: columnWidth * index,
        behavior: 'smooth'
      })
      setCurrentColumn(index)
    }
  }

  const handlePrev = () => {
    const newIndex = Math.max(0, currentColumn - 1)
    scrollToColumn(newIndex)
  }

  const handleNext = () => {
    const newIndex = Math.min(columns.length - 1, currentColumn + 1)
    scrollToColumn(newIndex)
  }

  // Update current column based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (columnsRef.current && !isDragging) {
        const columnWidth = columnsRef.current.scrollWidth / columns.length
        const scrollPos = columnsRef.current.scrollLeft
        const newIndex = Math.round(scrollPos / columnWidth)
        if (newIndex !== currentColumn) {
          setCurrentColumn(newIndex)
        }
      }
    }

    const ref = columnsRef.current
    if (ref) {
      ref.addEventListener('scroll', handleScroll)
      return () => ref.removeEventListener('scroll', handleScroll)
    }
  }, [currentColumn, columns.length, isDragging])

  return (
    <div className="columns-container">
      {title && (
        <div className="columns-header">
          <h2 className="columns-title">{title}</h2>
        </div>
      )}

      <div
        ref={columnsRef}
        className={`columns-wrapper ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {columns.map((column, index) => (
          <div key={index} className="column">
            {column}
          </div>
        ))}
      </div>

      {/* Mobile navigation buttons */}
      {columns.length > 1 && (
        <div className="columns-mobile-nav">
          <button
            className="nav-button nav-prev"
            onClick={handlePrev}
            disabled={currentColumn === 0}
          >
            ‹
          </button>

          <div className="column-indicators">
            {columns.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentColumn ? 'active' : ''}`}
                onClick={() => scrollToColumn(index)}
              />
            ))}
          </div>

          <button
            className="nav-button nav-next"
            onClick={handleNext}
            disabled={currentColumn === columns.length - 1}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
