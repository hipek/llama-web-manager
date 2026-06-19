'use client'

interface Props {
  visible: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ visible, message, onConfirm, onCancel }: Props) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-[999]">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <p className="text-dark-200 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onConfirm}
            className="btn btn-danger"
          >
            Yes, Restart
          </button>
          <button
            onClick={onCancel}
            className="btn btn-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
