import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { PageLoading } from '../../../shared/components/feedback/PageLoading'
import { PageSection } from '../../../shared/components/layout/PageSection'
import { Button } from '../../../shared/components/ui/Button'
import { OwnedCreatureCard } from '../../collection/components/OwnedCreatureCard'
import { PlayerIdentityCard } from '../components/PlayerIdentityCard'
import { PlayerStats } from '../components/PlayerStats'
import { usePublicPlayer } from '../hooks/usePublicPlayer'

export function PublicPlayerProfilePage() {
  const { t } = useTranslation('profile')
  const { handle = '' } = useParams()
  const [retryToken, setRetryToken] = useState(0)
  const viewState = usePublicPlayer(handle, retryToken)

  return (
    <PageSection size="medium">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-ember">{t('public.eyebrow')}</p>

      {viewState.status === 'loading' && <PageLoading label={t('public.loading')} fullPage={false} />}

      {viewState.status === 'error' && (
        <div className="mt-6 rounded-2xl border border-signal-bad/40 bg-signal-bad/10 p-6">
          <p className="m-0 font-semibold text-signal-bad">{viewState.message}</p>
          {viewState.notFound ? (
            <Link to="/creatures" className="mt-4 inline-flex text-sm font-semibold text-ember no-underline hover:text-gold">
              {t('public.backToCreatures')}
            </Link>
          ) : (
            <Button className="mt-4" variant="secondary" onClick={() => setRetryToken((value) => value + 1)}>
              {t('public.retry')}
            </Button>
          )}
        </div>
      )}

      {viewState.status === 'ready' && (
        <div className="flex flex-col gap-8">
          <h1 className="sr-only">{viewState.player.display_name}</h1>
          <PlayerIdentityCard profile={viewState.player} progress={viewState.player.progress} />
          <PlayerStats
            progress={viewState.player.progress}
            collectionIsPublic={viewState.player.collection_is_public}
            creatures={viewState.player.collection}
          />

          <section aria-labelledby="public-collection-heading">
            <h2 id="public-collection-heading" className="mb-4 mt-0 font-display text-xl font-semibold text-white">
              {t('public.collectionTitle')}
            </h2>
            {!viewState.player.collection_is_public || viewState.player.collection === null ? (
              <p className="text-arena-300/80">{t('public.collectionPrivate')}</p>
            ) : viewState.player.collection.length === 0 ? (
              <p className="text-arena-300/80">{t('public.collectionEmpty')}</p>
            ) : (
              <ul className="m-0 grid list-none grid-cols-3 gap-4 p-0 max-lg:grid-cols-2 max-sm:grid-cols-1">
                {viewState.player.collection.map((owned) => (
                  <li key={owned.id}>
                    <OwnedCreatureCard owned={owned} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PageSection>
  )
}
