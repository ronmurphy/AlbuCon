import { detectVideo, VideoPlatform } from '../utils/videoUtils'
import YouTubeEmbed from './YouTubeEmbed'
import TikTokEmbed from './TikTokEmbed'
import VimeoEmbed from './VimeoEmbed'

/**
 * Unified video embed component
 * Automatically detects platform and renders appropriate embed
 */
export default function VideoEmbed({ content }) {
  if (!content) return null

  const videoData = detectVideo(content)
  if (!videoData) return null

  const { platform, videoId } = videoData

  switch (platform) {
    case VideoPlatform.YOUTUBE:
      return <YouTubeEmbed videoId={videoId} />

    case VideoPlatform.TIKTOK:
      return <TikTokEmbed videoId={videoId} />

    case VideoPlatform.VIMEO:
      return <VimeoEmbed videoId={videoId} />

    default:
      return null
  }
}
