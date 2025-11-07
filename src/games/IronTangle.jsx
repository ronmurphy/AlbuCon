export default function IronTangle() {
  const baseUrl = import.meta.env.BASE_URL

  return (
    <iframe
      src={`${baseUrl}ironTangle/ironTangle.html`}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
        background: 'transparent'
      }}
      title="Iron Tangle Railway"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  )
}
