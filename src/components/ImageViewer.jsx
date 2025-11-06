import './ImageViewer.css'

export default function ImageViewer({ imageUrl, alt = 'Image' }) {
  return (
    <div className="image-viewer">
      <img
        src={imageUrl}
        alt={alt}
        className="image-viewer-img"
      />
    </div>
  )
}
