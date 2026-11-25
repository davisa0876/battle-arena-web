import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../../shared/lib/api/client'
import { toUserFacingMessage } from '../../../shared/lib/api/userFacingError'
import { fetchCreatureBySlug } from '../api/creatures'
import type { Creature } from '../types'

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound?: boolean }
  | { status: 'ready'; creature: Creature }

export function useCreatureDetail(slug: string, retryToken: number): DetailState {
  const { t, i18n } = useTranslation('errors')
  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [activeSlug, setActiveSlug] = useState(slug)

  if (slug !== activeSlug) {
    setActiveSlug(slug)
    setState({ status: 'loading' })
  }

  useEffect(() => {
    if (!slug) {
      return
    }

    const controller = new AbortController()

    fetchCreatureBySlug(slug, controller.signal)
      .then((response) => setState({ status: 'ready', creature: response.data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        if (error instanceof ApiError && error.status === 404) {
          setState({ status: 'error', message: t('notFound'), notFound: true })
          return
        }

        const message = toUserFacingMessage(error, t('detailLoad'))
        setState({ status: 'error', message })
      })

    return () => controller.abort()
  }, [i18n.resolvedLanguage, retryToken, slug, t])

  return slug ? state : { status: 'error', message: t('missingSlug'), notFound: true }
}
