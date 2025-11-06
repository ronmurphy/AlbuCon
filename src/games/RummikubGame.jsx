import { useEffect, useRef } from 'react'
import { RummikubGame as RummikubClass } from './Rummikub.js'
import './Rummikub.css'

export default function RummikubGame() {
  const containerRef = useRef(null)
  const gameInstanceRef = useRef(null)

  useEffect(() => {
    if (containerRef.current && !gameInstanceRef.current) {
      // Create game instance with the container element
      gameInstanceRef.current = new RummikubClass(containerRef.current)

      // Initial render
      const initialContent = gameInstanceRef.current.render()
      if (initialContent instanceof HTMLElement) {
        containerRef.current.appendChild(initialContent)
      }
    }

    // Cleanup on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      gameInstanceRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="rummikub-game"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    />
  )
}
