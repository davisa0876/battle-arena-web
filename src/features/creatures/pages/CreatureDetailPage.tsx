import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { CreatureHero } from '../components/CreatureHero'
import { CreatureStats } from '../components/CreatureStats'
import { useCreatureDetail } from '../hooks/useCreatureDetail'

export function CreatureDetailPage() {
  const { t } = useTranslation('creatures')
  const { slug = '' } = useParams()
  const [retryToken, setRetryToken] = useState(0)
  const viewState = useCreatureDetail(slug, retryToken)

  return (
    <section className="mx-auto w-[min(980px,calc(100%-2rem))] pb-28 pt-8 max-sm:w-[min(980px,calc(100%-1.25rem))]">
      <Link to="/creatures" className="inline-flex text-sm font-semibold text-ember no-underline hover:text-gold">
        {t('detail.backToCatalog')}
      </Link>

      {viewState.status === 'loading' && (
        <p className="mt-10 text-arena-300/80" aria-live="polite">
          {t('detail.loading')}
        </p>
      )}

      {viewState.status === 'error' && (
        <div className="mt-10 rounded-2xl border border-signal-bad/40 bg-signal-bad/10 p-6">
          <p className="m-0 font-semibold text-signal-bad">{viewState.message}</p>
          {!viewState.notFound && (
            <button
              type="button"
              className="mt-4 rounded-xl border border-ember/50 bg-ember/15 px-4 py-2 font-semibold text-ember"
              onClick={() => setRetryToken((value) => value + 1)}
            >
              {t('detail.retry')}
            </button>
          )}
        </div>
      )}

      {viewState.status === 'ready' && (
        <article className="mt-8">
          <CreatureHero creature={viewState.creature} />
          <CreatureStats creature={viewState.creature} />
        </article>
      )}
    </section>
  )
}
