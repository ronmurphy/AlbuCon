import { getTikTokEmbedUrl } from '../utils/videoUtils'
import './VideoEmbed.css'

export default function TikTokEmbed({ videoId, title = 'TikTok video' }) {
  if (!videoId) return null

  const embedUrl = getTikTokEmbedUrl(videoId)

  return (
    <div className="video-embed-container">
      <div className="video-embed-wrapper tiktok-wrapper">
        <iframe
          className="video-embed-iframe"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          scrolling="no"
        />
      </div>
      <div className="video-embed-badge tiktok-badge">
        <span className="video-icon">🎵</span>
        <span className="video-text">TikTok</span>
      </div>
    </div>
  )
}
