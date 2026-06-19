import { useState, useCallback, useEffect, useRef } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextIdRef = useRef(0)

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = nextIdRef.current
    nextIdRef.current += 1
    setToasts(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const showToast = useCallback((message: string, type?: 'success' | 'error') => {
    addToast(message, type || 'success')
  }, [addToast])

  const showError = useCallback((message: string) => {
    addToast(message, 'error')
  }, [addToast])

  // Expose globally for non-React contexts
  useEffect(() => {
    (window as any).__toast = { success: showToast, error: showError }
    return () => { delete (window as any).__toast }
  }, [showToast, showError])

  return { toasts, showToast, showError }
}
