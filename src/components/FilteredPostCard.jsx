import { getContentType } from '../lib/contentTypes'
import './FilteredPostCard.css'

export default function FilteredPostCard({ contentType }) {
  const type = getContentType(contentType)

  return (
    <div className="filtered-post-card card">
      <div className="filtered-content">
        <span className="filtered-icon">{type.icon}</span>
        <div className="filtered-text">
          <p className="filtered-message">
            A post was shared ({type.name})
          </p>
          <p className="filtered-hint">
            You've chosen not to see {type.name.toLowerCase()} content.
            <br />
            Change this in your Profile settings.
          </p>
        </div>
      </div>
    </div>
  )
}
