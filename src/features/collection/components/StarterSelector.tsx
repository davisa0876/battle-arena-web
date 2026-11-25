import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Alert } from '../../../shared/components/ui/Alert'
import { Button } from '../../../shared/components/ui/Button'
import { ApiError } from '../../../shared/lib/api/client'
import { CreatureImage } from '../../creatures/components/CreatureImage'
import { CreatureTypeBadge } from '../../creatures/components/CreatureTypeBadge'
import { fetchCreatureBySlug } from '../../creatures/api/creatures'
import type { Creature } from '../../creatures/types'

interface StarterSelectorProps {
  /** Starter slugs published by `GET /api/game/rules`. */
  slugs: string[]
  /** False when the server disables starter selection. */
  enabled: boolean
  busySlug: string | null
  onSelect: (creature: Creature) => void
}

type StarterState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; creatures: Creature[] }

/** Presents the server-defined starter list using catalog data (images, types) for each slug. */
export function StarterSelector({ slugs, enabled, busySlug, onSelect }: StarterSelectorProps) {
  const { t } = useTranslation(['collection', 'errors'])
  const [state, setState] = useState<StarterState>({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)
  const slugKey = slugs.join('|')

  useEffect(() => {
    if (slugKey === '') {
      return
    }

    const controller = new AbortController()
    const requested = slugKey.split('|')

    Promise.allSettled(requested.map((slug) => fetchCreatureBySlug(slug, controller.signal)))
      .then((results) => {
        if (controller.signal.aborted) {
          return
        }
        const creatures = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value.data] : []))
        if (creatures.length === 0) {
          const failure = results.find((result) => result.status === 'rejected')
          const message =
            failure?.status === 'rejected' && failure.reason instanceof ApiError
              ? failure.reason.message
              : t('errors:starterLoad')
          setState({ status: 'error', message })
          return
        }
        setState({ status: 'ready', creatures })
      })

    return () => controller.abort()
  }, [retryToken, slugKey, t])

  if (!enabled) {
    return <Alert variant="info">{t('collection:starter.disabled')}</Alert>
  }

  if (slugKey === '') {
    return <Alert variant="info">{t('collection:starter.empty')}</Alert>
  }

  return (
    <section aria-labelledby="starter-heading">
      <h2 id="starter-heading" className="m-0 font-display text-2xl font-semibold text-white">
        {t('collection:starter.title')}
      </h2>
      <p className="mb-6 mt-2 text-arena-300/80">{t('collection:starter.subtitle')}</p>

      {state.status === 'loading' && (
        <p className="text-arena-300/80" aria-live="polite">
          {t('collection:starter.loading')}
        </p>
      )}

      {state.status === 'error' && (
        <div className="rounded-2xl border border-signal-bad/40 bg-signal-bad/10 p-6">
          <p className="m-0 font-semibold text-signal-bad">{state.message}</p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => {
              setState({ status: 'loading' })
              setRetryToken((value) => value + 1)
            }}
          >
            {t('collection:starter.retry')}
          </Button>
        </div>
      )}

      {state.status === 'ready' && (
        <ul className="m-0 grid list-none grid-cols-3 gap-4 p-0 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {state.creatures.map((creature) => (
            <li
              key={creature.slug}
              className="flex flex-col rounded-[24px] border border-border bg-linear-to-br from-surface/95 to-background/95 p-4 shadow-card"
            >
              <CreatureImage
                src={creature.image_url ?? creature.image_ref}
                alt={creature.name}
                className="mb-4 aspect-4/3 w-full"
              />
              <h3 className="m-0 font-display text-xl font-semibold text-white">{creature.name}</h3>
              <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                {creature.types.map((creatureType) => (
                  <li key={creatureType.id}>
                    <CreatureTypeBadge name={creatureType.name} />
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
                <Button disabled={busySlug !== null} onClick={() => onSelect(creature)}>
                  {busySlug === creature.slug
                    ? t('collection:starter.choosing')
                    : t('collection:starter.choose', { name: creature.name })}
                </Button>
                <Link
                  to={`/creatures/${creature.slug}`}
                  className="text-sm font-semibold text-ember no-underline hover:text-gold"
                >
                  {t('collection:starter.viewDetails')}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
