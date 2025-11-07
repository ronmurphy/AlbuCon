export default function DonutsMagic() {
  const baseUrl = import.meta.env.BASE_URL

  return (
    <iframe
      src={`${baseUrl}donutsMagicMania/donutsMagicMania.html`}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
        background: 'transparent'
      }}
      title="Donut's Magic Mania"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  )
}
