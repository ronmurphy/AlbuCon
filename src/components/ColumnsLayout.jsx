import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Dock from './Dock'
import Columns from './Columns'
import Home from '../pages/Home'
import Friends from '../pages/Friends'
import Profile from '../pages/Profile'
import MyImages from '../pages/MyImages'
import UserTimeline from '../pages/UserTimeline'
import Gallery from '../pages/Gallery'
import Conversations from '../pages/Conversations'
import DirectMessages from '../pages/DirectMessages'
import FloatingWindow from './FloatingWindow'
import ImageViewer from './ImageViewer'
import ThemePreview from './ThemePreview'
import RummikubGame from '../games/RummikubGame'
import Minesweeper from '../games/Minesweeper'
import WriteFlow from '../games/WriteFlow'
import DonutsMagic from '../games/DonutsMagic'
import IronTangle from '../games/IronTangle'
import AppLauncher from './AppLauncher'
import './ColumnsLayout.css'

export default function ColumnsLayout() {
  const { user, signOut } = useAuth()
  const { previewTheme, closePreview, applyPreviewTheme } = useTheme()

  // Column management - feed is always present
  const [openColumns, setOpenColumns] = useState([
    { id: 'feed', type: 'feed', data: null, minimized: false }
  ])

  // Floating windows management
  const [floatingWindows, setFloatingWindows] = useState([])
  const [nextWindowId, setNextWindowId] = useState(1)
  const [topZIndex, setTopZIndex] = useState(1000)

  // App launcher state
  const [isLauncherOpen, setIsLauncherOpen] = useState(false)

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const openRummikubWindow = () => {
    // On mobile, open as column instead of floating window
    if (isMobile) {
      // Check if already open as column
      const exists = openColumns.find(col => col.id === 'game-rummikub')
      if (exists) return

      // Show warning if screen too small for Rummikub
      if (window.innerWidth < 600) {
        alert('⚠️ Rummikub works best on larger screens! Consider playing on desktop for the full experience.')
      }

      openColumn('game', { gameType: 'rummikub', gameName: 'Rummikub' })
      return
    }

    // Desktop: Check if Rummikub window is already open
    const exists = floatingWindows.find(w => w.type === 'rummikub')
    if (exists) {
      focusFloatingWindow(exists.id)
      return
    }

    // Large window for game - 90% of viewport
    const width = Math.min(1200, window.innerWidth * 0.9)
    const height = Math.min(800, window.innerHeight * 0.9)
    const x = (window.innerWidth - width) / 2
    const y = (window.innerHeight - height) / 2

    openFloatingWindow('rummikub', {}, {
      initialWidth: width,
      initialHeight: height,
      initialX: x,
      initialY: y,
      minWidth: 800,
      minHeight: 600
    })
  }

  const openMinesweeperWindow = () => {
    // On mobile, open as column
    if (isMobile) {
      const exists = openColumns.find(col => col.id === 'game-minesweeper')
      if (exists) return
      openColumn('game', { gameType: 'minesweeper', gameName: 'Minesweeper' })
      return
    }

    // Desktop: Check if Minesweeper window is already open
    const exists = floatingWindows.find(w => w.type === 'minesweeper')
    if (exists) {
      focusFloatingWindow(exists.id)
      return
    }

    // Compact window for Minesweeper
    const width = Math.min(600, window.innerWidth * 0.8)
    const height = Math.min(700, window.innerHeight * 0.85)
    const x = (window.innerWidth - width) / 2
    const y = (window.innerHeight - height) / 2

    openFloatingWindow('minesweeper', {}, {
      initialWidth: width,
      initialHeight: height,
      initialX: x,
      initialY: y,
      minWidth: 400,
      minHeight: 500
    })
  }

  const openWriteFlowWindow = () => {
    // On mobile, open as column
    if (isMobile) {
      const exists = openColumns.find(col => col.id === 'game-writeflow')
      if (exists) return
      openColumn('game', { gameType: 'writeflow', gameName: 'WriteFlow' })
      return
    }

    // Desktop: Check if WriteFlow window is already open
    const exists = floatingWindows.find(w => w.type === 'writeflow')
    if (exists) {
      focusFloatingWindow(exists.id)
      return
    }

    // Large window for text editor
    const width = Math.min(1000, window.innerWidth * 0.9)
    const height = Math.min(700, window.innerHeight * 0.85)
    const x = (window.innerWidth - width) / 2
    const y = (window.innerHeight - height) / 2

    openFloatingWindow('writeflow', {}, {
      initialWidth: width,
      initialHeight: height,
      initialX: x,
      initialY: y,
      minWidth: 600,
      minHeight: 400
    })
  }

  const openDonutsMagicWindow = () => {
    // On mobile, open as column
    if (isMobile) {
      const exists = openColumns.find(col => col.id === 'game-donutsmagic')
      if (exists) return
      openColumn('game', { gameType: 'donutsmagic', gameName: "Donut's Magic" })
      return
    }

    // Desktop: Check if Donut's Magic window is already open
    const exists = floatingWindows.find(w => w.type === 'donutsmagic')
    if (exists) {
      focusFloatingWindow(exists.id)
      return
    }

    // Medium window for match-3 game
    const width = Math.min(700, window.innerWidth * 0.85)
    const height = Math.min(800, window.innerHeight * 0.9)
    const x = (window.innerWidth - width) / 2
    const y = (window.innerHeight - height) / 2

    openFloatingWindow('donutsmagic', {}, {
      initialWidth: width,
      initialHeight: height,
      initialX: x,
      initialY: y,
      minWidth: 500,
      minHeight: 600
    })
  }

  const openIronTangleWindow = () => {
    // On mobile, open as column
    if (isMobile) {
      const exists = openColumns.find(col => col.id === 'game-irontangle')
      if (exists) return
      openColumn('game', { gameType: 'irontangle', gameName: 'Iron Tangle' })
      return
    }

    // Desktop: Check if Iron Tangle window is already open
    const exists = floatingWindows.find(w => w.type === 'irontangle')
    if (exists) {
      focusFloatingWindow(exists.id)
      return
    }

    // Medium window for puzzle game
    const width = Math.min(700, window.innerWidth * 0.85)
    const height = Math.min(750, window.innerHeight * 0.85)
    const x = (window.innerWidth - width) / 2
    const y = (window.innerHeight - height) / 2

    openFloatingWindow('irontangle', {}, {
      initialWidth: width,
      initialHeight: height,
      initialX: x,
      initialY: y,
      minWidth: 500,
      minHeight: 500
    })
  }

  // App launcher
  const toggleLauncher = () => {
    setIsLauncherOpen(prev => !prev)
  }

  // Define available apps
  const apps = [
    {
      id: 'rummikub',
      name: 'Rummikub',
      icon: '🎲',
      description: 'Classic tile-based game. Play against AI opponents.',
      onClick: openRummikubWindow,
      mobileSupported: false // Too complex for mobile
    },
    {
      id: 'donutsmagic',
      name: "Donut's Magic",
      icon: '🍩',
      description: 'Match-3 puzzle game with powerups and combos.',
      onClick: openDonutsMagicWindow,
      mobileSupported: true
    },
    {
      id: 'irontangle',
      name: 'Iron Tangle',
      icon: '🚂',
      description: 'Connect railway pipes to solve puzzles.',
      onClick: openIronTangleWindow,
      mobileSupported: true
    },
    {
      id: 'minesweeper',
      name: 'Minesweeper',
      icon: '💣',
      description: 'Classic puzzle game. Find all the mines!',
      onClick: openMinesweeperWindow,
      mobileSupported: true
    },
    {
      id: 'writeflow',
      name: 'WriteFlow',
      icon: '📝',
      description: 'Full-featured text editor with rich formatting.',
      onClick: openWriteFlowWindow,
      mobileSupported: false // Better on desktop with keyboard
    },
  ]

  // Filter apps for mobile
  const availableApps = isMobile ? apps.filter(app => app.mobileSupported) : apps

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
    // Generate column ID based on type
    let columnId = type
    if (type === 'user') {
      columnId = `user-${data.userId}`
    } else if (type === 'game') {
      columnId = `game-${data.gameType}`
    } else if (type === 'gallery') {
      columnId = `gallery-${data.userId}`
    } else if (type === 'dm') {
      columnId = `dm-${data.recipientId}`
    }

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

    // When closing profile, also close user's gallery
    if (columnId === 'profile') {
      setOpenColumns(prev => prev.filter(col =>
        col.id !== columnId && col.id !== `gallery-${user?.id}`
      ))
      return
    }

    // When closing a user timeline, also close that user's gallery
    if (columnId.startsWith('user-')) {
      const userId = columnId.replace('user-', '')
      setOpenColumns(prev => prev.filter(col =>
        col.id !== columnId && col.id !== `gallery-${userId}`
      ))
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
            <MyImages onImageClick={openImageWindow} />
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
              onOpenGallery={(userId, username) => {
                openColumn('gallery', { userId, username })
              }}
              onOpenDirectMessage={(recipientId, recipientUsername, recipientProfilePicture) => {
                openColumn('dm', { recipientId, recipientUsername, recipientProfilePicture })
              }}
            />
          </div>
        )

      case 'gallery':
        return (
          <div key={column.id} className="column-item">
            <div className="column-header">
              <h2 className="column-title">{column.data.username ? `${column.data.username}'s Gallery` : 'Gallery'}</h2>
              <button
                className="close-column-btn"
                onClick={() => closeColumn(column.id)}
                title="Close column"
              >
                ✕
              </button>
            </div>
            <Gallery
              userId={column.data.userId}
              username={column.data.username}
              onImageClick={openImageWindow}
            />
          </div>
        )

      case 'messages':
        return (
          <div key={column.id} className="column-item">
            <div className="column-header">
              <h2 className="column-title">Messages</h2>
              <button
                className="close-column-btn"
                onClick={() => closeColumn(column.id)}
                title="Close column"
              >
                ✕
              </button>
            </div>
            <Conversations
              onOpenConversation={(recipientId, recipientUsername, recipientProfilePicture) => {
                openColumn('dm', { recipientId, recipientUsername, recipientProfilePicture })
              }}
            />
          </div>
        )

      case 'dm':
        return (
          <div key={column.id} className="column-item">
            <div className="column-header">
              <h2 className="column-title">💬 {column.data.recipientUsername || 'Direct Message'}</h2>
              <button
                className="close-column-btn"
                onClick={() => closeColumn(column.id)}
                title="Close column"
              >
                ✕
              </button>
            </div>
            <DirectMessages
              recipientId={column.data.recipientId}
              recipientUsername={column.data.recipientUsername}
              recipientProfilePicture={column.data.recipientProfilePicture}
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

      case 'game':
        return (
          <div key={column.id} className="column-item game-column">
            <div className="column-header">
              <h2 className="column-title">{column.data.gameName}</h2>
              <button
                className="close-column-btn"
                onClick={() => closeColumn(column.id)}
                title="Close game"
              >
                ✕
              </button>
            </div>
            <div className="game-container">
              {column.data.gameType === 'rummikub' && <RummikubGame />}
              {column.data.gameType === 'minesweeper' && <Minesweeper />}
              {column.data.gameType === 'writeflow' && <WriteFlow />}
              {column.data.gameType === 'donutsmagic' && <DonutsMagic />}
              {column.data.gameType === 'irontangle' && <IronTangle />}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Get visible columns (not minimized)
  const visibleColumns = openColumns.filter(col => !col.minimized)

  // Get open games for mobile indicator
  const openGames = openColumns.filter(col => col.type === 'game' && !col.minimized)

  return (
    <div className="columns-layout">
      {/* Mobile Game Indicators */}
      {isMobile && openGames.length > 0 && (
        <div className="mobile-game-indicators">
          {openGames.map(game => (
            <div
              key={game.id}
              className="game-indicator"
              onClick={() => closeColumn(game.id)}
              title={`Close ${game.data.gameName}`}
            >
              <span className="game-indicator-icon">
                {game.data.gameType === 'minesweeper' && '💣'}
                {game.data.gameType === 'donutsmagic' && '🍩'}
                {game.data.gameType === 'irontangle' && '🚂'}
                {game.data.gameType === 'rummikub' && '🎲'}
                {game.data.gameType === 'writeflow' && '📝'}
              </span>
              <span className="game-indicator-close">✕</span>
            </div>
          ))}
        </div>
      )}
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
        onOpenLauncher={toggleLauncher}
      />

      {/* Floating Windows */}
      {floatingWindows.map((window) => {
        // Set window title based on type
        let title = 'Window'
        if (window.type === 'image') title = window.data.alt
        else if (window.type === 'rummikub') title = 'Rummikub'
        else if (window.type === 'minesweeper') title = 'Minesweeper'
        else if (window.type === 'writeflow') title = 'WriteFlow'
        else if (window.type === 'donutsmagic') title = "Donut's Magic Mania"
        else if (window.type === 'irontangle') title = 'Iron Tangle Railway'

        return (
          <FloatingWindow
            key={window.id}
            id={window.id}
            title={title}
            initialX={window.initialX}
            initialY={window.initialY}
            initialWidth={window.initialWidth}
            initialHeight={window.initialHeight}
            minWidth={window.minWidth}
            minHeight={window.minHeight}
            zIndex={window.zIndex}
            onClose={closeFloatingWindow}
            onFocus={focusFloatingWindow}
          >
            {window.type === 'image' && (
              <ImageViewer imageUrl={window.data.imageUrl} alt={window.data.alt} />
            )}
            {window.type === 'rummikub' && (
              <RummikubGame />
            )}
            {window.type === 'minesweeper' && (
              <Minesweeper />
            )}
            {window.type === 'writeflow' && (
              <WriteFlow />
            )}
            {window.type === 'donutsmagic' && (
              <DonutsMagic />
            )}
            {window.type === 'irontangle' && (
              <IronTangle />
            )}
          </FloatingWindow>
        )
      })}

      {/* App Launcher */}
      <AppLauncher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        apps={availableApps}
      />

      {/* Theme Preview Window */}
      {previewTheme && (
        <FloatingWindow
          id="theme-preview"
          title={`Preview: ${previewTheme.name} Theme`}
          initialX={Math.max(50, (window.innerWidth - 700) / 2)}
          initialY={Math.max(50, (window.innerHeight - 600) / 2)}
          initialWidth={Math.min(700, window.innerWidth - 100)}
          initialHeight={Math.min(600, window.innerHeight - 100)}
          minWidth={500}
          minHeight={400}
          zIndex={10000}
          onClose={closePreview}
          onFocus={() => {}}
        >
          <ThemePreview
            theme={previewTheme}
            onApply={applyPreviewTheme}
            onCancel={closePreview}
          />
        </FloatingWindow>
      )}
    </div>
  )
}
