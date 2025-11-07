export default function WriteFlow() {
  const baseUrl = import.meta.env.BASE_URL

  return (
    <iframe
      src={`${baseUrl}writeflow.html`}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
        background: 'transparent'
      }}
      title="WriteFlow Text Editor"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  )
}
