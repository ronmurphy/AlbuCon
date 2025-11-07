import { useState, useEffect } from 'react'
import './PWAInstall.css'

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
  }

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions)
  }

  // Don't show anything if already installed and not showing instructions
  if (isInstalled && !showInstructions) {
    return (
      <div className="pwa-install-card card">
        <div className="pwa-install-header">
          <h3>📱 App Installed</h3>
        </div>
        <p className="pwa-installed-message">
          AlbuCon is installed on your device! ✨
        </p>
        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleInstructions}
        >
          Show Uninstall Instructions
        </button>
      </div>
    )
  }

  // Show uninstall instructions
  if (isInstalled && showInstructions) {
    return (
      <div className="pwa-install-card card">
        <div className="pwa-install-header">
          <h3>🗑️ Uninstall Instructions</h3>
          <button
            className="btn-close"
            onClick={toggleInstructions}
          >
            ✕
          </button>
        </div>
        <div className="pwa-uninstall-instructions">
          <p><strong>Android:</strong></p>
          <ol>
            <li>Long-press the app icon on your home screen</li>
            <li>Select "App info" or drag to "Uninstall"</li>
            <li>Tap "Uninstall"</li>
          </ol>
          <p><strong>iOS (Safari):</strong></p>
          <ol>
            <li>Long-press the app icon on your home screen</li>
            <li>Tap "Remove App"</li>
            <li>Confirm removal</li>
          </ol>
          <p><strong>Desktop (Chrome/Edge):</strong></p>
          <ol>
            <li>Click the ⋮ menu in the browser</li>
            <li>Go to "Apps" → "Manage Apps"</li>
            <li>Find AlbuCon and click "Uninstall"</li>
          </ol>
        </div>
      </div>
    )
  }

  // Show install button if app is installable
  if (deferredPrompt) {
    return (
      <div className="pwa-install-card card">
        <div className="pwa-install-header">
          <h3>📱 Install AlbuCon</h3>
        </div>
        <p className="pwa-install-description">
          Install AlbuCon as an app for a better experience! Get quick access from your home screen and use it like a native app.
        </p>
        <div className="pwa-benefits">
          <div className="pwa-benefit">✓ Quick access from home screen</div>
          <div className="pwa-benefit">✓ Works offline</div>
          <div className="pwa-benefit">✓ Full-screen experience</div>
          <div className="pwa-benefit">✓ No app store needed</div>
        </div>
        <button
          className="btn btn-primary pwa-install-btn"
          onClick={handleInstallClick}
        >
          📥 Install App
        </button>
      </div>
    )
  }

  // Don't show anything if not installable
  return null
}
