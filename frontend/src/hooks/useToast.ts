import { useState, useCallback, useEffect } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [nextId, setNextId] = useState(0)

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = nextId
    setNextId(prev => prev + 1)
    setToasts(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [nextId])

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
