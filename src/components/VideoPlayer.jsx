import { useEffect, useRef } from 'react'

export default function VideoPlayer({ src, className = '' }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    // Check if the browser supports HLS natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
    } else if (window.Hls && window.Hls.isSupported()) {
      // For browsers that need hls.js (Chrome, Firefox, etc.)
      const hls = new window.Hls()
      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data)
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error, trying to recover...')
              hls.startLoad()
              break
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error, trying to recover...')
              hls.recoverMediaError()
              break
            default:
              console.error('Unrecoverable error')
              hls.destroy()
              break
          }
        }
      })

      return () => {
        hls.destroy()
      }
    } else {
      // Fallback: try to play as MP4
      video.src = src
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      className={className}
      controls
      preload="metadata"
      onError={(e) => {
        console.error('Failed to load video:', src, e)
      }}
    >
      Your browser does not support the video tag.
    </video>
  )
}
