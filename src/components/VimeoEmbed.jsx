import { getVimeoEmbedUrl } from '../utils/videoUtils'
import './VideoEmbed.css'

export default function VimeoEmbed({ videoId, title = 'Vimeo video' }) {
  if (!videoId) return null

  const embedUrl = getVimeoEmbedUrl(videoId)

  return (
    <div className="video-embed-container">
      <div className="video-embed-wrapper vimeo-wrapper">
        <iframe
          className="video-embed-iframe"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="video-embed-badge vimeo-badge">
        <span className="video-icon">▶️</span>
        <span className="video-text">Vimeo</span>
      </div>
    </div>
  )
}
