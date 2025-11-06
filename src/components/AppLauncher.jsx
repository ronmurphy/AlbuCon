import { useState, useEffect, useRef } from 'react'
import './AppLauncher.css'

export default function AppLauncher({ isOpen, onClose, apps }) {
  const [searchTerm, setSearchTerm] = useState('')
  const modalRef = useRef(null)
  const searchInputRef = useRef(null)

  // Filter apps based on search term
  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Close when clicking outside modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleAppClick = (app) => {
    app.onClick()
    onClose()
    setSearchTerm('') // Reset search
  }

  if (!isOpen) return null

  return (
    <div className="app-launcher-backdrop" onClick={handleBackdropClick}>
      <div className="app-launcher-modal" ref={modalRef}>
        <div className="app-launcher-header">
          <input
            ref={searchInputRef}
            type="text"
            className="app-launcher-search"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="app-launcher-close" onClick={onClose}>✕</button>
        </div>

        <div className="app-launcher-content">
          {filteredApps.length === 0 ? (
            <div className="app-launcher-empty">
              <p>No apps found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="app-launcher-grid">
              {filteredApps.map((app) => (
                <button
                  key={app.id}
                  className="app-launcher-item"
                  onClick={() => handleAppClick(app)}
                  title={app.description}
                >
                  <div className="app-icon">
                    <span className="app-icon-emoji">{app.icon}</span>
                  </div>
                  <div className="app-name">{app.name}</div>
                  {app.description && (
                    <div className="app-description">{app.description}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="app-launcher-footer">
          <span className="app-count">
            {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'}
            {searchTerm && ` matching "${searchTerm}"`}
          </span>
        </div>
      </div>
    </div>
  )
}
