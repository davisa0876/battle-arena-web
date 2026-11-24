import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../../lib/api/client'

type ConnectionStatus = 'connecting' | 'connected' | 'offline'
type HealthResponse = Record<string, unknown>

const statusDotClass: Record<ConnectionStatus, string> = {
  connecting: 'bg-gold shadow-[0_0_10px_currentColor]',
  connected: 'bg-signal-ok shadow-[0_0_10px_currentColor]',
  offline: 'bg-signal-bad shadow-[0_0_10px_currentColor]',
}

export function SystemStatus() {
  const { t } = useTranslation('navigation')
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
    <div
      className="hidden items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-2 text-[13px] text-arena-300/80 shadow-card backdrop-blur sm:flex"
      role="status"
      aria-live="polite"
    >
      <span className={`size-1.5 rounded-full ${statusDotClass[status]}`} aria-hidden="true" />
      <span>{t(`status.${status}`)}</span>
      {status === 'offline' && (
        <button
          type="button"
          onClick={retry}
          className="cursor-pointer border-0 bg-transparent pl-1 font-[inherit] text-ember underline underline-offset-3"
        >
          {t('status.retry')}
        </button>
      )}
    </div>
  )
}
