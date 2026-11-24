import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { fetchCreatureTypes, fetchCreatures } from '../api/creatures'
import type { Creature, CreatureType } from '../api/types'
import { CreaturePlaceholder } from '../components/CreaturePlaceholder'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; creatures: Creature[]; total: number; lastPage: number; page: number }

export function CreatureCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const type = searchParams.get('type') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const [draftSearch, setDraftSearch] = useState(search)
  const [types, setTypes] = useState<CreatureType[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)

  const queryKey = useMemo(
    () => JSON.stringify({ search, type, page, retryToken }),
    [search, type, page, retryToken],
  )

  useEffect(() => {
    setDraftSearch(search)
  }, [search])

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

  useEffect(() => {
    const controller = new AbortController()
    setLoadState({ status: 'loading' })

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
          status: 'ready',
          creatures: response.data,
          total: response.meta.total,
          lastPage: response.meta.last_page,
          page: response.meta.current_page,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const message =
          error instanceof ApiError
            ? error.message
            : 'Unable to load the creature catalog.'

        setLoadState({ status: 'error', message })
      })

    return () => controller.abort()
  }, [queryKey, search, type, page])

  const applyFilters = useCallback(
    (next: { search?: string; type?: string; page?: number }) => {
      const params = new URLSearchParams()
      const nextSearch = next.search ?? search
      const nextType = next.type ?? type
      const nextPage = next.page ?? 1

      if (nextSearch.trim()) {
        params.set('search', nextSearch.trim())
      }
      if (nextType.trim()) {
        params.set('type', nextType.trim())
      }
      if (nextPage > 1) {
        params.set('page', String(nextPage))
      }

      setSearchParams(params)
    },
    [search, setSearchParams, type],
  )

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    applyFilters({ search: draftSearch, page: 1 })
  }

  return (
    <section className="mx-auto w-[min(1120px,calc(100%-2.5rem))] pb-28 pt-8 max-md:w-[min(1120px,calc(100%-1.75rem))]">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-ember-400">
        Creature Collection
      </p>
      <h1 className="m-0 font-display text-[clamp(2rem,5vw,3.2rem)] font-semibold tracking-[-0.04em] text-white">
        Catalog
      </h1>
      <p className="mt-3 max-w-2xl text-arena-400">
        Browse creatures persisted in Battle Arena. Search and filters hit the Laravel API,
        never the external data provider.
      </p>

      <form
        className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"
        onSubmit={onSubmit}
        role="search"
        aria-label="Filter creatures"
      >
        <label className="grid gap-2 text-sm text-arena-400">
          <span>Search by name</span>
          <input
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            className="rounded-xl border border-arena-700 bg-arena-900 px-4 py-3 text-white outline-none transition focus:border-ember-400"
            placeholder="e.g. Charmander"
            name="search"
            autoComplete="off"
          />
        </label>

        <label className="grid gap-2 text-sm text-arena-400">
          <span>Type</span>
          <select
            value={type}
            onChange={(event) => applyFilters({ type: event.target.value, page: 1 })}
            className="rounded-xl border border-arena-700 bg-arena-900 px-4 py-3 text-white outline-none transition focus:border-ember-400"
            name="type"
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            {types.map((creatureType) => (
              <option key={creatureType.id} value={creatureType.slug}>
                {creatureType.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-xl border border-ember-400/50 bg-ember-400/15 px-5 py-3 font-semibold text-ember-300 transition hover:bg-ember-400/25"
          >
            Search
          </button>
          {(search || type) && (
            <button
              type="button"
              className="rounded-xl border border-arena-700 bg-transparent px-4 py-3 text-arena-300 transition hover:border-arena-400"
              onClick={() => {
                setDraftSearch('')
                setSearchParams(new URLSearchParams())
              }}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      <div className="mt-10" aria-live="polite">
        {loadState.status === 'loading' && (
          <p className="text-arena-400">Loading creatures...</p>
        )}

        {loadState.status === 'error' && (
          <div className="rounded-2xl border border-signal-bad/40 bg-signal-bad/10 p-6">
            <p className="m-0 font-semibold text-signal-bad">Could not load the catalog</p>
            <p className="mt-2 mb-4 text-arena-300">{loadState.message}</p>
            <button
              type="button"
              className="rounded-xl border border-ember-400/50 bg-ember-400/15 px-4 py-2 font-semibold text-ember-300"
              onClick={() => setRetryToken((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        )}

        {loadState.status === 'ready' && loadState.creatures.length === 0 && (
          <div className="rounded-2xl border border-arena-700 bg-arena-900/60 p-8 text-center">
            <p className="m-0 font-display text-xl text-white">No creatures found</p>
            <p className="mt-2 text-arena-400">
              Try another search, clear filters, or import the starter catalog on the API.
            </p>
          </div>
        )}

        {loadState.status === 'ready' && loadState.creatures.length > 0 && (
          <>
            <p className="mb-4 text-sm text-arena-400">
              Showing page {loadState.page} of {loadState.lastPage} · {loadState.total} creatures
            </p>
            <ul className="m-0 grid list-none grid-cols-3 gap-4 p-0 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {loadState.creatures.map((creature) => (
                <li key={creature.id}>
                  <Link
                    to={`/creatures/${creature.slug}`}
                    className="block h-full rounded-[20px] border border-arena-700 bg-linear-to-br from-arena-800/90 to-arena-950/95 p-5 text-inherit no-underline transition duration-200 hover:-translate-y-1 hover:border-ember-400/40"
                  >
                    <CreaturePlaceholder name={creature.name} className="mb-4 aspect-4/3 w-full" />
                    <h2 className="m-0 font-display text-xl font-semibold text-white">
                      {creature.name}
                    </h2>
                    <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                      {creature.types.map((creatureType) => (
                        <li
                          key={creatureType.id}
                          className="rounded-md border border-arena-700 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ember-300"
                        >
                          {creatureType.name}
                        </li>
                      ))}
                    </ul>
                  </Link>
                </li>
              ))}
            </ul>

            <nav className="mt-8 flex items-center justify-between gap-4" aria-label="Catalog pagination">
              <button
                type="button"
                className="rounded-xl border border-arena-700 px-4 py-2 text-sm text-arena-300 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={loadState.page <= 1}
                onClick={() => applyFilters({ page: loadState.page - 1 })}
              >
                Previous
              </button>
              <span className="text-sm text-arena-400">
                Page {loadState.page} / {loadState.lastPage}
              </span>
              <button
                type="button"
                className="rounded-xl border border-arena-700 px-4 py-2 text-sm text-arena-300 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={loadState.page >= loadState.lastPage}
                onClick={() => applyFilters({ page: loadState.page + 1 })}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  )
}
