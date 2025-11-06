import { useState, useRef, useEffect } from 'react'
import './FloatingWindow.css'

export default function FloatingWindow({
  id,
  title,
  children,
  initialX = 100,
  initialY = 100,
  initialWidth = 600,
  initialHeight = 400,
  minWidth = 300,
  minHeight = 200,
  onClose,
  onFocus,
  zIndex = 1000
}) {
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const windowRef = useRef(null)

  // Constrain to viewport
  const constrainPosition = (x, y, width, height) => {
    const maxX = window.innerWidth - width
    const maxY = window.innerHeight - height
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    }
  }

  // Handle drag start
  const handleDragStart = (e) => {
    if (e.target.closest('.window-resize-handle')) return
    if (e.target.closest('.window-close-btn')) return

    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    onFocus?.(id)
  }

  // Handle resize start
  const handleResizeStart = (e, direction) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y
    })
    onFocus?.(id)
  }

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        const constrained = constrainPosition(newX, newY, size.width, size.height)
        setPosition(constrained)
      }

      if (isResizing && resizeDirection) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y

        let newWidth = resizeStart.width
        let newHeight = resizeStart.height
        let newX = resizeStart.posX
        let newY = resizeStart.posY

        // Handle different resize directions
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(minWidth, resizeStart.width + deltaX)
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(minHeight, resizeStart.height + deltaY)
        }
        if (resizeDirection.includes('w')) {
          newWidth = Math.max(minWidth, resizeStart.width - deltaX)
          if (newWidth > minWidth) {
            newX = resizeStart.posX + deltaX
          }
        }
        if (resizeDirection.includes('n')) {
          newHeight = Math.max(minHeight, resizeStart.height - deltaY)
          if (newHeight > minHeight) {
            newY = resizeStart.posY + deltaY
          }
        }

        // Constrain to viewport
        const maxWidth = window.innerWidth - newX
        const maxHeight = window.innerHeight - newY
        newWidth = Math.min(newWidth, maxWidth)
        newHeight = Math.min(newHeight, maxHeight)

        setSize({ width: newWidth, height: newHeight })
        setPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeDirection(null)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeDirection, position, size, minWidth, minHeight])

  // Click to focus
  const handleWindowClick = () => {
    onFocus?.(id)
  }

  return (
    <div
      ref={windowRef}
      className={`floating-window ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: zIndex
      }}
      onClick={handleWindowClick}
    >
      {/* Window Header */}
      <div
        className="window-header"
        onMouseDown={handleDragStart}
      >
        <h3 className="window-title">{title}</h3>
        <button
          className="window-close-btn"
          onClick={(e) => {
            e.stopPropagation()
            onClose?.(id)
          }}
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Window Content */}
      <div className="window-content">
        {children}
      </div>

      {/* Resize Handles */}
      <div className="window-resize-handle resize-n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
      <div className="window-resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
      <div className="window-resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
      <div className="window-resize-handle resize-w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
      <div className="window-resize-handle resize-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
      <div className="window-resize-handle resize-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
      <div className="window-resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
      <div className="window-resize-handle resize-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
    </div>
  )
}
