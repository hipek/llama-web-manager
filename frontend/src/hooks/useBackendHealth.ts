import { useState, useEffect, useCallback } from 'react'
import { checkBackend, getBackendOnline } from '@/lib/api-client'

const HEALTH_CHECK_INTERVAL = 15000

export function useBackendHealth() {
  const [online, setOnline] = useState(true)

  const check = useCallback(async () => {
    const result = await checkBackend()
    setOnline(result)
    return result
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, HEALTH_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [check])

  // Listen for backend state changes
  useEffect(() => {
    const handleOffline = () => setOnline(false)
    const handleOnline = () => setOnline(true)

    window.addEventListener('backend-offline', handleOffline)
    window.addEventListener('backend-online', handleOnline)

    return () => {
      window.removeEventListener('backend-offline', handleOffline)
      window.removeEventListener('backend-online', handleOnline)
    }
  }, [])

  return { online, check }
}
