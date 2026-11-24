import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { fetchCreatureBySlug } from '../api/creatures'
import type { Creature } from '../api/types'
import { CreaturePlaceholder } from '../components/CreaturePlaceholder'
import { StatBar } from '../components/StatBar'

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound?: boolean }
  | { status: 'ready'; creature: Creature }

export function CreatureDetailPage() {
  const { slug = '' } = useParams()
  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)
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
          setState({ status: 'error', message: 'Creature not found.', notFound: true })
          return
        }

        const message =
          error instanceof ApiError
            ? error.message
            : 'Unable to load this creature.'

        setState({ status: 'error', message })
      })

    return () => controller.abort()
  }, [slug, retryToken])

  const viewState: DetailState = !slug
    ? { status: 'error', message: 'Missing creature slug.', notFound: true }
    : state

  return (
    <section className="mx-auto w-[min(960px,calc(100%-2.5rem))] pb-28 pt-8 max-md:w-[min(960px,calc(100%-1.75rem))]">
      <Link
        to="/creatures"
        className="inline-flex text-sm font-semibold text-ember-300 no-underline hover:text-ember-400"
      >
        ← Back to catalog
      </Link>

      {viewState.status === 'loading' && (
        <p className="mt-10 text-arena-400" aria-live="polite">
          Loading creature...
        </p>
      )}

      {viewState.status === 'error' && (
        <div className="mt-10 rounded-2xl border border-signal-bad/40 bg-signal-bad/10 p-6">
          <p className="m-0 font-semibold text-signal-bad">{viewState.message}</p>
          {!viewState.notFound && (
            <button
              type="button"
              className="mt-4 rounded-xl border border-ember-400/50 bg-ember-400/15 px-4 py-2 font-semibold text-ember-300"
              onClick={() => {
                setState({ status: 'loading' })
                setRetryToken((value) => value + 1)
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {viewState.status === 'ready' && (
        <article className="mt-8 grid gap-8 md:grid-cols-[280px_minmax(0,1fr)]">
          <CreaturePlaceholder
            name={viewState.creature.name}
            className="aspect-square w-full min-h-64"
          />

          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-ember-400">
              Creature Detail
            </p>
            <h1 className="m-0 font-display text-[clamp(2rem,5vw,3.4rem)] font-semibold tracking-[-0.04em] text-white">
              {viewState.creature.name}
            </h1>

            <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
              {viewState.creature.types.map((creatureType) => (
                <li
                  key={creatureType.id}
                  className="rounded-md border border-arena-700 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ember-300"
                >
                  {creatureType.name}
                </li>
              ))}
            </ul>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-arena-700 bg-arena-900/50 p-4">
                <dt className="text-arena-400">Height</dt>
                <dd className="m-0 mt-1 font-display text-lg text-white">
                  {viewState.creature.height_cm == null
                    ? '—'
                    : `${(viewState.creature.height_cm / 100).toFixed(2)} m`}
                </dd>
              </div>
              <div className="rounded-xl border border-arena-700 bg-arena-900/50 p-4">
                <dt className="text-arena-400">Weight</dt>
                <dd className="m-0 mt-1 font-display text-lg text-white">
                  {viewState.creature.weight_g == null
                    ? '—'
                    : `${(viewState.creature.weight_g / 1000).toFixed(1)} kg`}
                </dd>
              </div>
            </dl>

            <div className="mt-8 grid gap-4">
              <h2 className="m-0 font-display text-xl text-white">Base stats</h2>
              <StatBar label="HP" value={viewState.creature.base_stats.hp} />
              <StatBar label="Attack" value={viewState.creature.base_stats.attack} />
              <StatBar label="Defense" value={viewState.creature.base_stats.defense} />
              <StatBar label="Special Attack" value={viewState.creature.base_stats.special_attack} />
              <StatBar label="Special Defense" value={viewState.creature.base_stats.special_defense} />
              <StatBar label="Speed" value={viewState.creature.base_stats.speed} />
            </div>
          </div>
        </article>
      )}
    </section>
  )
}
