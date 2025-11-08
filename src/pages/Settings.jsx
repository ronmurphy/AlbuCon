import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import ConnectedServices from '../components/ConnectedServices'
import PWAInstall from '../components/PWAInstall'
import { contentTypes, platformTypes, defaultPreferences } from '../lib/contentTypes'
import './Settings.css'

export default function Settings({ onSignOut }) {
  const { user } = useAuth()
  const { currentTheme, openPreview, themes } = useTheme()
  const [contentPreferences, setContentPreferences] = useState(defaultPreferences)
  const [savingPreferences, setSavingPreferences] = useState(false)

  useEffect(() => {
    loadContentPreferences()
  }, [user])

  const loadContentPreferences = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('content_preferences')
        .eq('id', user.id)
        .single()

      if (!error && data?.content_preferences) {
        setContentPreferences(data.content_preferences)
      }
    } catch (error) {
      console.error('Error loading content preferences:', error)
    }
  }

  const saveContentPreferences = async (newPreferences) => {
    setSavingPreferences(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ content_preferences: newPreferences })
        .eq('id', user.id)

      if (error) throw error

      setContentPreferences(newPreferences)
    } catch (error) {
      console.error('Error saving content preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setSavingPreferences(false)
    }
  }

  const toggleContentType = (typeId) => {
    const newPreferences = {
      ...contentPreferences,
      [typeId]: !contentPreferences[typeId]
    }
    saveContentPreferences(newPreferences)
  }

  return (
    <div className="settings-page">
      {/* Account Info */}
      <div className="settings-section card">
        <h2 className="section-title">Account</h2>
        <p className="settings-info">
          <strong>Username:</strong> {user?.user_metadata?.username || 'Unknown'}
        </p>
        <p className="settings-info">
          <strong>Email:</strong> {user?.email || 'Unknown'}
        </p>
        <button onClick={onSignOut} className="btn btn-danger">
          Sign Out
        </button>
      </div>

      {/* Theme Selector */}
      <div className="settings-section card">
        <h2 className="section-title">Theme</h2>
        <p className="section-description">Choose your preferred color theme</p>
        <div className="theme-grid">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
              onClick={() => openPreview(theme.id)}
              title={`Preview ${theme.description}`}
            >
              <div className="theme-preview" style={{
                background: `linear-gradient(135deg, ${theme.preview.bg} 0%, ${theme.preview.accent} 100%)`
              }}>
                <span className="theme-icon">{theme.icon}</span>
              </div>
              <div className="theme-info">
                <div className="theme-name">{theme.name}</div>
                <div className="theme-description">{theme.description}</div>
              </div>
              {currentTheme === theme.id && (
                <div className="theme-check">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* PWA Install */}
      <PWAInstall />

      {/* Content Preferences */}
      <div className="settings-section card">
        <h2 className="section-title">Content Preferences</h2>
        <p className="section-description">Choose what types of content you want to see in your feed</p>
        <div className="preferences-grid">
          {contentTypes.map((type) => (
            <button
              key={type.id}
              className={`preference-option ${contentPreferences[type.id] ? 'enabled' : 'disabled'}`}
              onClick={() => toggleContentType(type.id)}
              disabled={savingPreferences}
              title={type.description}
            >
              <div className="preference-icon" style={{ color: type.color }}>
                {type.icon}
              </div>
              <div className="preference-info">
                <div className="preference-name">{type.name}</div>
                <div className="preference-description">{type.description}</div>
              </div>
              <div className="preference-toggle">
                {contentPreferences[type.id] ? '✓ Visible' : '✕ Hidden'}
              </div>
            </button>
          ))}
        </div>
        <p className="preferences-note">
          💡 Hidden content will show as placeholders like "A post was shared (Political)"
        </p>
      </div>

      {/* Platform Preferences */}
      <div className="settings-section card">
        <h2 className="section-title">Platform Filtering</h2>
        <p className="section-description">Choose which external platforms you want to see posts from</p>
        <div className="preferences-grid">
          {platformTypes.map((type) => (
            <button
              key={type.id}
              className={`preference-option ${contentPreferences[type.id] ? 'enabled' : 'disabled'}`}
              onClick={() => toggleContentType(type.id)}
              disabled={savingPreferences}
              title={type.description}
            >
              <div className="preference-icon" style={{ color: type.color }}>
                {type.icon}
              </div>
              <div className="preference-info">
                <div className="preference-name">{type.name}</div>
                <div className="preference-description">{type.description}</div>
              </div>
              <div className="preference-toggle">
                {contentPreferences[type.id] ? '✓ Visible' : '✕ Hidden'}
              </div>
            </button>
          ))}
        </div>
        <p className="preferences-note">
          💡 Hide posts from specific platforms. You can still follow accounts, but won't see their posts.
        </p>
      </div>

      {/* Connected Services */}
      <ConnectedServices />
    </div>
  )
}
