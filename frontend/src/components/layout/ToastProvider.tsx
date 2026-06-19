'use client'

import { useToast } from '@/hooks/useToast'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts } = useToast()

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </>
  )
}
