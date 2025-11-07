import './ThemePreview.css'

export default function ThemePreview({ theme, onApply, onCancel }) {
  return (
    <div className="theme-preview-container" data-theme={theme.id}>
      <div className="preview-content">
        {/* Header with theme info */}
        <div className="preview-header">
          <div className="preview-theme-icon">{theme.icon}</div>
          <div>
            <h2 className="preview-theme-name">{theme.name} Theme</h2>
            <p className="preview-theme-description">{theme.description}</p>
          </div>
        </div>

        {/* Sample Post Card */}
        <div className="preview-section">
          <h3 className="preview-section-title">Posts & Cards</h3>
          <div className="preview-card">
            <div className="preview-post-header">
              <div className="preview-avatar">JD</div>
              <div className="preview-user-info">
                <div className="preview-username">John Doe</div>
                <div className="preview-timestamp">2 hours ago</div>
              </div>
            </div>
            <div className="preview-post-content">
              This is what your posts will look like with the {theme.name} theme!
              Looking pretty good, right? ✨
            </div>
            <div className="preview-post-actions">
              <button className="preview-action-btn">❤️ Like</button>
              <button className="preview-action-btn">💬 Comment</button>
            </div>
          </div>
        </div>

        {/* Sample Buttons */}
        <div className="preview-section">
          <h3 className="preview-section-title">Buttons & Controls</h3>
          <div className="preview-buttons">
            <button className="preview-btn preview-btn-primary">Primary Button</button>
            <button className="preview-btn preview-btn-secondary">Secondary</button>
            <button className="preview-btn preview-btn-success">Success</button>
            <button className="preview-btn preview-btn-danger">Danger</button>
          </div>
        </div>

        {/* Sample Dock Icons */}
        <div className="preview-section">
          <h3 className="preview-section-title">Dock & Navigation</h3>
          <div className="preview-dock">
            <div className="preview-dock-item">🏠</div>
            <div className="preview-dock-item">👥</div>
            <div className="preview-dock-item active">👤</div>
            <div className="preview-dock-item">🖼️</div>
            <div className="preview-dock-item">🎮</div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="preview-section">
          <h3 className="preview-section-title">Color Palette</h3>
          <div className="preview-colors">
            <div className="preview-color-item">
              <div className="preview-color-swatch" style={{ background: 'var(--primary)' }}></div>
              <span className="preview-color-label">Primary</span>
            </div>
            <div className="preview-color-item">
              <div className="preview-color-swatch" style={{ background: 'var(--secondary)' }}></div>
              <span className="preview-color-label">Secondary</span>
            </div>
            <div className="preview-color-item">
              <div className="preview-color-swatch" style={{ background: 'var(--accent)' }}></div>
              <span className="preview-color-label">Accent</span>
            </div>
            <div className="preview-color-item">
              <div className="preview-color-swatch" style={{ background: 'var(--success)' }}></div>
              <span className="preview-color-label">Success</span>
            </div>
            <div className="preview-color-item">
              <div className="preview-color-swatch" style={{ background: 'var(--warning)' }}></div>
              <span className="preview-color-label">Warning</span>
            </div>
            <div className="preview-color-item">
              <div className="preview-color-swatch" style={{ background: 'var(--danger)' }}></div>
              <span className="preview-color-label">Danger</span>
            </div>
          </div>
        </div>

        {/* Sample Text */}
        <div className="preview-section">
          <h3 className="preview-section-title">Typography</h3>
          <div className="preview-text">
            <p className="preview-text-primary">Primary text color - Used for headings and main content</p>
            <p className="preview-text-secondary">Secondary text color - Used for descriptions and labels</p>
            <p className="preview-text-tertiary">Tertiary text color - Used for subtle hints and metadata</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="preview-actions">
        <button className="preview-action-button cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="preview-action-button apply" onClick={onApply}>
          Apply {theme.name} Theme
        </button>
      </div>
    </div>
  )
}
