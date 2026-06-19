'use client'

interface Props {
  visible: boolean
  text?: string
}

export function LoadingOverlay({ visible, text }: Props) {
  if (!visible) return null

  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="spinner spinner-lg mx-auto mb-4" />
        <p className="text-dark-400 text-sm">{text || 'Loading model...'}</p>
      </div>
    </div>
  )
}
