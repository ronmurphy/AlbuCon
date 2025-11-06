import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Dock from './Dock'
import Columns from './Columns'
import Home from '../pages/Home'
import Friends from '../pages/Friends'
import Profile from '../pages/Profile'
import MyImages from '../pages/MyImages'
import UserTimeline from '../pages/UserTimeline'
import FloatingWindow from './FloatingWindow'
import ImageViewer from './ImageViewer'
import './ColumnsLayout.css'

export default function ColumnsLayout() {
  const { user, signOut } = useAuth()

  // Column management - feed is always present
  const [openColumns, setOpenColumns] = useState([
    { id: 'feed', type: 'feed', data: null, minimized: false }
  ])

  // Floating windows management
  const [floatingWindows, setFloatingWindows] = useState([])
  const [nextWindowId, setNextWindowId] = useState(1)
  const [topZIndex, setTopZIndex] = useState(1000)

  const handleSignOut = async () => {
    await signOut()
  }

  // Floating window functions
  const openFloatingWindow = (type, data, options = {}) => {
    const windowId = `window-${nextWindowId}`
    setNextWindowId(prev => prev + 1)

    const newWindow = {
      id: windowId,
      type,
      data,
      zIndex: topZIndex + 1,
      ...options
    }

    setFloatingWindows(prev => [...prev, newWindow])
    setTopZIndex(prev => prev + 1)
  }

  const closeFloatingWindow = (windowId) => {
    setFloatingWindows(prev => prev.filter(w => w.id !== windowId))
  }

  const focusFloatingWindow = (windowId) => {
    setFloatingWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, zIndex: topZIndex + 1 } : w
    ))
    setTopZIndex(prev => prev + 1)
  }

  const openImageWindow = (imageUrl, alt = 'Image') => {
    // Calculate window size based on viewport
    const maxWidth = Math.min(800, window.innerWidth - 100)
    const maxHeight = Math.min(600, window.innerHeight - 150)

    openFloatingWindow('image', { imageUrl, alt }, {
      initialWidth: maxWidth,
      initialHeight: maxHeight,
      initialX: 50 + (floatingWindows.length * 30),
      initialY: 50 + (floatingWindows.length * 30)
    })
  }

  const handleMinimizeFeed = () => {
    setOpenColumns(prev =>
      prev.map(col =>
        col.id === 'feed' ? { ...col, minimized: true } : col
      )
    )
  }

  const handleMaximizeFeed = () => {
    setOpenColumns(prev =>
      prev.map(col =>
        col.id === 'feed' ? { ...col, minimized: false } : col
      )
    )
  }

  const openColumn = (type, data = null) => {
    const columnId = type === 'user' ? `user-${data.userId}` : type

    // Check if column already exists
    const exists = openColumns.find(col => col.id === columnId)
    if (exists) {
      // If minimized, maximize it
      if (exists.minimized) {
        setOpenColumns(prev =>
          prev.map(col =>
            col.id === columnId ? { ...col, minimized: false } : col
          )
        )
      }
      return
    }

    // Add new column
    setOpenColumns(prev => [...prev, { id: columnId, type, data, minimized: false }])
  }

  const closeColumn = (columnId) => {
    // Can't close feed, only minimize it
    if (columnId === 'feed') {
      handleMinimizeFeed()
      return
    }

    setOpenColumns(prev => prev.filter(col => col.id !== columnId))
  }

  const toggleSettings = () => {
    const exists = openColumns.find(col => col.id === 'settings')
    if (exists) {
      closeColumn('settings')
    } else {
      openColumn('settings')
    }
  }

  const renderColumn = (column) => {
    if (column.minimized) return null

    switch (column.type) {
      case 'feed':
        return (
          <div key={column.id} className="column-item">
            <Home onMinimize={handleMinimizeFeed} onImageClick={openImageWindow} />
          </div>
        )

      case 'friends':
        return (
          <div key={column.id} className="column-item">
            <div className="column-header">
              <h2 className="column-title">Friends</h2>
              <button
                className="close-column-btn"
                onClick={() => closeColumn(column.id)}
                title="Close column"
              >
                ✕
              </button>
            </div>
            <Friends onOpenUserTimeline={(userId, username, profilePic) => {
              openColumn('user', { userId, username, profilePicture: profilePic })
            }} />
          </div>
        )

      case 'profile':
        return (
          <div key={column.id} className="column-item">
            <div className="column-header">
              <h2 className="column-title">My Profile</h2>
              <button
                className="close-column-btn"
                onClick={() => closeColumn(column.id)}
                title="Close column"
              >
                ✕
              </button>
            </div>
            <Profile />
          </div>
        )

      case 'images':
        return (
          <div key={column.id} className="column-item">
            <div className="column-header">
              <h2 className="column-title">My Images</h2>
              <button
                className="close-column-btn"
                onClick={() => closeColumn(column.id)}
                title="Close column"
              >
                ✕
              </button>
            </div>
            <MyImages />
          </div>
        )

      case 'user':
        return (
          <div key={column.id} className="column-item">
            <UserTimeline
              userId={column.data.userId}
              username={column.data.username}
              profilePicture={column.data.profilePicture}
              onClose={() => closeColumn(column.id)}
              onImageClick={openImageWindow}
            />
          </div>
        )

      case 'settings':
        return (
          <div key={column.id} className="column-item">
            <div className="column-header">
              <h2 className="column-title">Settings</h2>
              <button
                className="close-column-btn"
                onClick={() => closeColumn(column.id)}
                title="Close column"
              >
                ✕
              </button>
            </div>
            <div className="settings-view">
              <div className="settings-card card">
                <div className="settings-section">
                  <h3>Account</h3>
                  <p className="settings-info">
                    <strong>Username:</strong> {user?.user_metadata?.username || 'Unknown'}
                  </p>
                  <p className="settings-info">
                    <strong>Email:</strong> {user?.email || 'Unknown'}
                  </p>
                </div>
                <div className="settings-section">
                  <button onClick={handleSignOut} className="btn btn-danger">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Get visible columns (not minimized)
  const visibleColumns = openColumns.filter(col => !col.minimized)

  return (
    <div className="columns-layout">
      <div className="main-content">
        <Columns
          visibleColumnCount={visibleColumns.length}
          openColumns={openColumns}
        >
          {openColumns.map(column => renderColumn(column))}
        </Columns>
      </div>
      <Dock
        openColumns={openColumns}
        onToggleColumn={(type, data) => {
          if (type === 'feed') {
            const feedCol = openColumns.find(col => col.id === 'feed')
            if (feedCol.minimized) {
              handleMaximizeFeed()
            } else {
              handleMinimizeFeed()
            }
          } else if (type === 'settings') {
            toggleSettings()
          } else {
            const columnId = type === 'user' ? `user-${data.userId}` : type
            const exists = openColumns.find(col => col.id === columnId)
            if (exists) {
              closeColumn(columnId)
            } else {
              openColumn(type, data)
            }
          }
        }}
        onCloseColumn={closeColumn}
        onSignOut={handleSignOut}
      />

      {/* Floating Windows */}
      {floatingWindows.map((window) => (
        <FloatingWindow
          key={window.id}
          id={window.id}
          title={window.type === 'image' ? window.data.alt : 'Window'}
          initialX={window.initialX}
          initialY={window.initialY}
          initialWidth={window.initialWidth}
          initialHeight={window.initialHeight}
          zIndex={window.zIndex}
          onClose={closeFloatingWindow}
          onFocus={focusFloatingWindow}
        >
          {window.type === 'image' && (
            <ImageViewer imageUrl={window.data.imageUrl} alt={window.data.alt} />
          )}
        </FloatingWindow>
      ))}
    </div>
  )
}
