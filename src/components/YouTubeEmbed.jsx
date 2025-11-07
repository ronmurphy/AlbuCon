import { getYouTubeEmbedUrl } from '../utils/youtubeUtils'
import './YouTubeEmbed.css'

export default function YouTubeEmbed({ videoId, title = 'YouTube video' }) {
  if (!videoId) return null

  const embedUrl = getYouTubeEmbedUrl(videoId)

  return (
    <div className="youtube-embed-container">
      <div className="youtube-embed-wrapper">
        <iframe
          className="youtube-embed-iframe"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="youtube-embed-badge">
        <span className="youtube-icon">▶️</span>
        <span className="youtube-text">YouTube</span>
      </div>
    </div>
  )
}
