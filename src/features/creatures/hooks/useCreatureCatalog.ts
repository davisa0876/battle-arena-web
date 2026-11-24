import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../../shared/lib/api/client'
import { fetchCreatureTypes, fetchCreatures } from '../api/creatures'
import type { Creature, CreatureType } from '../types'

type CatalogLoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; creatures: Creature[]; total: number; lastPage: number; page: number }

interface CatalogState {
  key: string
  result: CatalogLoadState
}

interface UseCreatureCatalogArgs {
  search: string
  type: string
  page: number
  retryToken: number
}

export function useCreatureTypes() {
  const [types, setTypes] = useState<CreatureType[]>([])

  useEffect(() => {
    const controller = new AbortController()

    fetchCreatureTypes(controller.signal)
      .then((response) => setTypes(response.data))
      .catch(() => {
        if (!controller.signal.aborted) {
          setTypes([])
        }
      })

    return () => controller.abort()
  }, [])

  return types
}

export function useCreatureCatalog({ search, type, page, retryToken }: UseCreatureCatalogArgs): CatalogLoadState {
  const { t, i18n } = useTranslation('errors')
  const language = i18n.resolvedLanguage ?? i18n.language
  const queryKey = useMemo(
    () => JSON.stringify({ language, page, retryToken, search, type }),
    [language, page, retryToken, search, type],
  )
  const [loadState, setLoadState] = useState<CatalogState>({ key: '', result: { status: 'loading' } })

  useEffect(() => {
    const controller = new AbortController()

    fetchCreatures(
      {
        search: search || undefined,
        type: type || undefined,
        page,
        per_page: 12,
      },
      controller.signal,
    )
      .then((response) => {
        setLoadState({
          key: queryKey,
          result: {
            status: 'ready',
            creatures: response.data,
            total: response.meta.total,
            lastPage: response.meta.last_page,
            page: response.meta.current_page,
          },
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const message = error instanceof ApiError ? error.message : t('catalogLoad')
        setLoadState({ key: queryKey, result: { status: 'error', message } })
      })

    return () => controller.abort()
  }, [page, queryKey, search, t, type])

  return loadState.key === queryKey ? loadState.result : { status: 'loading' }
}

