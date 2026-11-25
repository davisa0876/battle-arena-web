import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../../shared/lib/api/client'
import { toUserFacingMessage } from '../../../shared/lib/api/userFacingError'
import { fetchPublicPlayer } from '../api/profile'
import type { PublicPlayer } from '../types'

export type PublicPlayerState =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound?: boolean }
  | { status: 'ready'; player: PublicPlayer }

export function usePublicPlayer(handle: string, retryToken: number): PublicPlayerState {
  const { t, i18n } = useTranslation('errors')
  const [state, setState] = useState<PublicPlayerState>({ status: 'loading' })
  const [activeHandle, setActiveHandle] = useState(handle)

  if (handle !== activeHandle) {
    setActiveHandle(handle)
    setState({ status: 'loading' })
  }

  useEffect(() => {
    if (!handle) {
      return
    }

    const controller = new AbortController()

    fetchPublicPlayer(handle, controller.signal)
      .then((player) =>
        setState(
          player
            ? { status: 'ready', player }
            : { status: 'error', message: t('playerNotFound'), notFound: true },
        ),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        if (error instanceof ApiError && error.status === 404) {
          setState({ status: 'error', message: t('playerNotFound'), notFound: true })
          return
        }
        setState({ status: 'error', message: toUserFacingMessage(error, t('playerLoad')) })
      })

    return () => controller.abort()
  }, [handle, i18n.resolvedLanguage, retryToken, t])

  return handle ? state : { status: 'error', message: t('missingHandle'), notFound: true }
}
