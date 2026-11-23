import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../api/client'

type ConnectionStatus = 'connecting' | 'connected' | 'offline'
type HealthResponse = Record<string, unknown>

export function SystemStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setStatus('connecting')
    setAttempt((value) => value + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    apiClient
      .get<HealthResponse>('/api/health', controller.signal)
      .then(() => setStatus('connected'))
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus('offline')
        }
      })

    return () => controller.abort()
  }, [attempt])

  return (
    <div className={`system-status system-status--${status}`} role="status" aria-live="polite">
      <span className="status-dot" aria-hidden="true" />
      <span>
        {status === 'connecting' && 'Connecting...'}
        {status === 'connected' && 'API Connected'}
        {status === 'offline' && 'API Offline'}
      </span>
      {status === 'offline' && (
        <button type="button" onClick={retry}>Retry</button>
      )}
    </div>
  )
}
