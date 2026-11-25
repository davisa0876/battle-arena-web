import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { CatalogPagination } from '../components/CatalogPagination'
import { CreatureFilters } from '../components/CreatureFilters'
import { CreatureGrid } from '../components/CreatureGrid'
import { useCreatureCatalog, useCreatureTypes } from '../hooks/useCreatureCatalog'

export function CreatureCatalogPage() {
  const { t } = useTranslation('creatures')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const type = searchParams.get('type') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const [draftSearch, setDraftSearch] = useState(search)
  const [retryToken, setRetryToken] = useState(0)
  const types = useCreatureTypes()
  const loadState = useCreatureCatalog({ search, type, page, retryToken })

  useEffect(() => {
    setDraftSearch(search)
  }, [search])

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

  const clearFilters = () => {
    setDraftSearch('')
    setSearchParams(new URLSearchParams())
  }

  return (
    <section className="mx-auto w-[min(1180px,calc(100%-2rem))] pb-28 pt-8 max-sm:w-[min(1180px,calc(100%-1.25rem))]">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-ember">
        {t('catalog.eyebrow')}
      </p>
      <h1 className="m-0 font-display text-[clamp(2.25rem,6vw,4.2rem)] font-semibold tracking-[-0.05em] text-white">
        {t('catalog.title')}
      </h1>
      <p className="mt-3 max-w-2xl text-arena-300/80">{t('catalog.description')}</p>

      <CreatureFilters
        search={search}
        type={type}
        draftSearch={draftSearch}
        types={types}
        onDraftSearchChange={setDraftSearch}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <div className="mt-10" aria-live="polite">
        {loadState.status === 'loading' && <p className="text-arena-300/80">{t('catalog.loading')}</p>}

        {loadState.status === 'error' && (
          <div className="rounded-2xl border border-signal-bad/40 bg-signal-bad/10 p-6">
            <p className="m-0 font-semibold text-signal-bad">{t('catalog.errorTitle')}</p>
            <p className="mb-4 mt-2 text-arena-300">{loadState.message}</p>
            <button
              type="button"
              className="rounded-xl border border-ember/50 bg-ember/15 px-4 py-2 font-semibold text-ember"
              onClick={() => setRetryToken((value) => value + 1)}
            >
              {t('catalog.retry')}
            </button>
          </div>
        )}

        {loadState.status === 'ready' && loadState.creatures.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface/70 p-8 text-center shadow-card">
            <p className="m-0 font-display text-xl text-white">{t('catalog.emptyTitle')}</p>
            <p className="mt-2 text-arena-300/80">{t('catalog.emptyDescription')}</p>
          </div>
        )}

        {loadState.status === 'ready' && loadState.creatures.length > 0 && (
          <>
            <p className="mb-4 text-sm text-arena-300/80">
              {t('catalog.resultsSummary', {
                page: loadState.page,
                lastPage: loadState.lastPage,
                total: loadState.total,
              })}
            </p>
            <CreatureGrid
              creatures={loadState.creatures}
              onCollectionChanged={() => setRetryToken((value) => value + 1)}
            />
            <CatalogPagination page={loadState.page} lastPage={loadState.lastPage} onPageChange={(nextPage) => applyFilters({ page: nextPage })} />
          </>
        )}
      </div>
    </section>
  )
}
