import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toUserFacingMessage } from '../../../shared/lib/api/userFacingError'
import { fetchMyCreatures } from '../api/collection'
import type { OwnedCreature } from '../types'

export type CollectionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; creatures: OwnedCreature[] }

export interface MyCollection {
  state: CollectionState
  /** Reload showing the loading state (retry button). */
  reload: () => void
  /** Reload keeping the current list on screen (after select/starter mutations). */
  refresh: () => void
}

export function useMyCollection(): MyCollection {
  const { t, i18n } = useTranslation('errors')
  const [state, setState] = useState<CollectionState>({ status: 'loading' })
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => setRefreshToken((value) => value + 1), [])
  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setRefreshToken((value) => value + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchMyCreatures(controller.signal)
      .then((creatures) => setState({ status: 'ready', creatures }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        setState({ status: 'error', message: toUserFacingMessage(error, t('collectionLoad')) })
      })

    return () => controller.abort()
  }, [i18n.resolvedLanguage, refreshToken, t])

  return { state, reload, refresh }
}
