'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { StatusBar } from '@/components/layout/StatusBar'
import { LoadingOverlay } from '@/components/layout/LoadingOverlay'
import { useConfig } from '@/hooks/useConfig'
import { useStatus } from '@/hooks/useStatus'
import { useModels } from '@/hooks/useModels'
import { useRecentModels } from '@/hooks/useRecentModels'
import { useToast } from '@/hooks/useToast'
import { ModelList } from '@/components/models/ModelList'
import { RecentModels } from '@/components/models/RecentModels'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { LogViewer } from '@/components/logs/LogViewer'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { loadModel, stopServer, saveConfig, restartServer, checkBackend } from '@/lib/api-client'
import { modelName } from '@/lib/utils'
import type { LlammaCppParams } from '@/types'

export default function DashboardPage() {
  const { config, loading: configLoading } = useConfig()
  const { status, scrollState, setScrollState, refresh: refreshStatus } = useStatus()
  const { models, refresh: refreshModels } = useModels()
  const { addModel: addRecent } = useRecentModels()
  const { showToast, showError } = useToast()

  const [loadingVisible, setLoadingVisible] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmLabel, setConfirmLabel] = useState('')

  // Poll status periodically for loading progress
  const pollLoading = useCallback(async () => {
    try {
      const res = await fetch('/api/status')
      const data = await res.json()
      if (data.ready) {
        setLoadingVisible(false)
        showToast('Model loaded')
      } else if (data.running && !data.model) {
        setLoadingVisible(false)
        showToast('Server restarted')
      }
    } catch {
      // silent
    }
  }, [showToast])

  // Start loading poll when overlay shows
  const startLoading = useCallback((text: string) => {
    setLoadingText(text)
    setLoadingVisible(true)
    // Wait 2 seconds before first check to ensure model is loaded
    setTimeout(() => {
      const interval = setInterval(pollLoading, 3000)
      setTimeout(() => {
        clearInterval(interval)
        setLoadingVisible(false)
        showError('Model loading timed out')
      }, 180000) // 3 min timeout
    }, 2000)
  }, [pollLoading, showError])

  const handleLoadModel = useCallback(async (path: string, name: string) => {
    startLoading('Loading ' + name + '...')
    try {
      await loadModel(path)
      addRecent(path, name)
      showToast('Loading ' + name + '...')
    } catch (e: unknown) {
      setLoadingVisible(false)
      showError(e instanceof Error ? e.message : 'Failed to load model')
    }
  }, [startLoading, showToast, showError])

  const handleStopServer = useCallback(async () => {
    setConfirmVisible(true)
    setConfirmMessage('Are you sure you want to stop the server?')
    setConfirmLabel('Stop Server')
    setConfirmAction(async () => {
      try {
        await stopServer()
        showToast('Server stopped')
        window.location.reload()
      } catch (e: unknown) {
        showError(e instanceof Error ? e.message : 'Failed to stop server')
      }
    })
  }, [showToast, showError])

  const handleSaveSettings = useCallback(async (params: LlammaCppParams) => {
    try {
      await saveConfig(params)
      showToast('Settings saved')
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : 'Failed to save settings')
    }
  }, [showToast, showError])

  const handleRestartServer = useCallback(() => {
    setConfirmVisible(true)
    setConfirmMessage('Are you sure you want to restart the server?')
    setConfirmLabel('Yes, Restart')
    setConfirmAction(async () => {
      try {
        await restartServer()
        setLoadingVisible(true)
        showToast('Server restarting...')
        // Start loading poll
        const interval = setInterval(pollLoading, 3000)
        setTimeout(() => {
          clearInterval(interval)
          setLoadingVisible(false)
        }, 180000)
      } catch (e: unknown) {
        showError(e instanceof Error ? e.message : 'Failed to restart')
      }
    })
  }, [showToast, showError, pollLoading])

  const handleRefreshLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/status')
      const data = await res.json()
      showToast('Logs refreshed')
    } catch {
      showError('Failed to refresh logs')
    }
  }, [showToast, showError])

  const handleConfirm = useCallback(() => {
    setConfirmVisible(false)
    confirmAction?.()
  }, [confirmAction])

  const handleCancel = useCallback(() => {
    setConfirmVisible(false)
    setConfirmAction(null)
    setConfirmMessage('')
    setConfirmLabel('')
  }, [])

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-box">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-dark-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-danger">Failed to load config</h1>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <OfflineBanner />
      <Header />

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {status && (
          <StatusBar
            status={status}
            serverPort={config.server_port}
            serverHost={config.server_host}
            onStop={handleStopServer}
          />
        )}

        <RecentModels onAction={handleLoadModel} />

        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3 text-dark-100 flex items-center gap-2">
            📦 Available Models
          </h2>
          <ModelList
            models={models}
            running={status?.running ?? false}
            onAction={handleLoadModel}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3 text-dark-100 flex items-center gap-2">
            ⚙️ llama.cpp Parameters
          </h2>
          {config.llamacpp_params && (
            <SettingsForm
              params={config.llamacpp_params}
              onSave={handleSaveSettings}
              onRestart={handleRestartServer}
            />
          )}
        </section>

        <LogViewer
          lines={status?.log_lines ?? []}
          scrollState={scrollState}
          setScrollState={setScrollState}
          onRefresh={handleRefreshLogs}
        />
      </main>

      <LoadingOverlay visible={loadingVisible} text={loadingText} />
      <ConfirmDialog
        visible={confirmVisible}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  )
}
