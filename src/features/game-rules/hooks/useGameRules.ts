import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../../shared/lib/api/client'
import { fetchGameRules } from '../api/gameRules'
import type { GameRules } from '../types'

export type GameRulesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rules: GameRules }

export function useGameRules(): GameRulesState & { reload: () => void } {
  const { t, i18n } = useTranslation('errors')
  const [state, setState] = useState<GameRulesState>({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setRetryToken((value) => value + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchGameRules(controller.signal)
      .then((rules) => setState({ status: 'ready', rules }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        setState({ status: 'error', message: error instanceof ApiError ? error.message : t('rulesLoad') })
      })

    return () => controller.abort()
  }, [i18n.resolvedLanguage, retryToken, t])

  return { ...state, reload }
}
