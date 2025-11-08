import { useState, useRef, useEffect } from 'react'
import './Columns.css'

export default function Columns({ children, visibleColumnCount, openColumns }) {
  const [currentColumn, setCurrentColumn] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [maxVisibleColumns, setMaxVisibleColumns] = useState(4)
  const columnsRef = useRef(null)

  // Calculate max visible columns based on viewport width
  useEffect(() => {
    const calculateMaxColumns = () => {
      const AVERAGE_COLUMN_WIDTH = 400
      const DOCK_SPACE = 100 // Reserve space for dock
      const viewportWidth = window.innerWidth - DOCK_SPACE
      const calculated = Math.floor(viewportWidth / AVERAGE_COLUMN_WIDTH)
      setMaxVisibleColumns(Math.max(1, calculated))
    }

    calculateMaxColumns()

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      calculateMaxColumns()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Filter out null/undefined children (minimized columns)
  const columns = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean)

  // Calculate column width based on number of visible columns
  const getColumnWidth = () => {
    // On mobile, ALWAYS show one column at a time (full width carousel)
    if (isMobile) {
      return '100%'
    }

    // Desktop behavior - side-by-side columns
    if (!visibleColumnCount) return '100%'

    if (visibleColumnCount === 1) return '100%'
    if (visibleColumnCount === 2) return '50%'
    if (visibleColumnCount === 3) return '33.333%'
    if (visibleColumnCount === 4) return '25%'
    // 5+ columns use fixed width with horizontal scroll
    return '400px'
  }

  const columnWidth = getColumnWidth()
  const useFixedWidth = !isMobile && visibleColumnCount >= 5

  // Determine if we need desktop navigation (more columns than can fit on screen)
  const needsDesktopNav = !isMobile && columns.length > maxVisibleColumns

  // Touch/Mouse drag scrolling
  const handleMouseDown = (e) => {
    // Enable drag for desktop 5+ columns
    if (!useFixedWidth && !isMobile) return
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
    // Enable touch swipe on mobile always, or desktop with 5+ columns
    if (!isMobile && !useFixedWidth) return
    setStartX(e.touches[0].pageX - columnsRef.current.offsetLeft)
    setScrollLeft(columnsRef.current.scrollLeft)
  }

  const handleTouchMove = (e) => {
    // Enable touch swipe on mobile always, or desktop with 5+ columns
    if (!isMobile && !useFixedWidth) return
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

  // Keyboard navigation for desktop
  useEffect(() => {
    if (isMobile || !needsDesktopNav) return

    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Left Arrow
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
      // Ctrl/Cmd + Right Arrow
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentColumn, columns.length, isMobile, needsDesktopNav])

  return (
    <div className="columns-container">
      <div
        ref={columnsRef}
        className={`columns-wrapper ${isDragging ? 'dragging' : ''} ${isMobile ? 'mobile-carousel' : useFixedWidth ? 'fixed-width' : 'responsive-width'}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          cursor: (useFixedWidth || isMobile) ? 'grab' : 'default'
        }}
      >
        {columns.map((column, index) => (
          <div
            key={index}
            className="column"
            style={{
              flex: (useFixedWidth || isMobile) ? 'none' : undefined,
              minWidth: columnWidth,
              maxWidth: (useFixedWidth || isMobile) ? (isMobile ? columnWidth : '400px') : columnWidth,
              width: columnWidth
            }}
          >
            {column}
          </div>
        ))}
      </div>

      {/* Mobile navigation buttons - show only on mobile */}
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

      {/* Desktop navigation - show when columns exceed max visible */}
      {needsDesktopNav && (
        <div className="columns-desktop-nav">
          <button
            className="desktop-nav-arrow"
            onClick={handlePrev}
            disabled={currentColumn === 0}
            title="Previous Column (Ctrl+←)"
          >
            ←
          </button>

          <div className="desktop-column-indicators">
            {columns.map((_, index) => (
              <button
                key={index}
                className={`desktop-indicator ${index === currentColumn ? 'active' : ''}`}
                onClick={() => scrollToColumn(index)}
                title={`Column ${index + 1}`}
              />
            ))}
          </div>

          <button
            className="desktop-nav-arrow"
            onClick={handleNext}
            disabled={currentColumn === columns.length - 1}
            title="Next Column (Ctrl+→)"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
