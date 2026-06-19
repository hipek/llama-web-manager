'use client'

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-danger">Something went wrong</h1>
        <p className="mt-2 text-dark-400">{error.message}</p>
        <button
          onClick={() => reset()}
          className="mt-4 btn btn-primary"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
