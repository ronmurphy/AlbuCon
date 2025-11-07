import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const themes = [
  {
    id: 'dark',
    name: 'Dark',
    description: 'Classic dark theme',
    icon: '🌙',
    preview: { bg: '#1e293b', text: '#f1f5f9', accent: '#8b5cf6' }
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Classic light theme',
    icon: '☀️',
    preview: { bg: '#ffffff', text: '#0f172a', accent: '#7c3aed' }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Pure black for OLED',
    icon: '🌃',
    preview: { bg: '#000000', text: '#ffffff', accent: '#a78bfa' }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blue ocean vibes',
    icon: '🌊',
    preview: { bg: '#143754', text: '#e0f2fe', accent: '#0ea5e9' }
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural green forest',
    icon: '🌲',
    preview: { bg: '#153320', text: '#d1fae5', accent: '#10b981' }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm sunset colors',
    icon: '🌅',
    preview: { bg: '#3d1a2d', text: '#fef3c7', accent: '#f59e0b' }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon cyberpunk aesthetic',
    icon: '🎮',
    preview: { bg: '#190b3a', text: '#f0abfc', accent: '#d946ef' }
  },
  {
    id: 'retro',
    name: 'Retro',
    description: '90s nostalgic colors',
    icon: '📼',
    preview: { bg: '#3e3e5e', text: '#fef3c7', accent: '#fb923c' }
  },
  {
    id: 'nord',
    name: 'Nord',
    description: 'Cool and elegant',
    icon: '❄️',
    preview: { bg: '#3b4252', text: '#eceff4', accent: '#88c0d0' }
  }
]

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('dark')
  const [previewTheme, setPreviewTheme] = useState(null)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('albucon-theme')
    if (savedTheme && themes.find(t => t.id === savedTheme)) {
      setCurrentTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (themeId) => {
    console.log('[ThemeContext] Applying theme:', themeId)
    document.documentElement.setAttribute('data-theme', themeId)
    console.log('[ThemeContext] Document theme attribute:', document.documentElement.getAttribute('data-theme'))
  }

  const changeTheme = (themeId) => {
    if (!themes.find(t => t.id === themeId)) {
      console.error('[ThemeContext] Invalid theme ID:', themeId)
      return
    }

    console.log('[ThemeContext] Changing theme from', currentTheme, 'to', themeId)
    setCurrentTheme(themeId)
    applyTheme(themeId)
    localStorage.setItem('albucon-theme', themeId)
    console.log('[ThemeContext] Theme saved to localStorage:', themeId)
  }

  const openPreview = (themeId) => {
    const theme = themes.find(t => t.id === themeId)
    if (theme) {
      setPreviewTheme(theme)
    }
  }

  const closePreview = () => {
    setPreviewTheme(null)
  }

  const applyPreviewTheme = () => {
    if (previewTheme) {
      const themeId = previewTheme.id
      console.log('[ThemeContext] Apply preview theme clicked:', themeId)

      // Apply theme first
      changeTheme(themeId)

      // Force a check that the theme was applied
      requestAnimationFrame(() => {
        const appliedTheme = document.documentElement.getAttribute('data-theme')
        console.log('[ThemeContext] Theme after apply (RAF):', appliedTheme)

        // Close preview after ensuring theme is applied
        setTimeout(() => {
          console.log('[ThemeContext] Closing preview window')
          setPreviewTheme(null)
        }, 150)
      })
    } else {
      console.warn('[ThemeContext] applyPreviewTheme called but no previewTheme set')
    }
  }

  const value = {
    currentTheme,
    changeTheme,
    themes,
    getCurrentTheme: () => themes.find(t => t.id === currentTheme),
    previewTheme,
    openPreview,
    closePreview,
    applyPreviewTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
