import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLoading } from '../../../shared/components/feedback/PageLoading'
import { PageHeading, PageSection } from '../../../shared/components/layout/PageSection'
import { Alert } from '../../../shared/components/ui/Alert'
import { Button } from '../../../shared/components/ui/Button'
import { useFormSubmission } from '../../../shared/hooks/useFormSubmission'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGameRules } from '../../game-rules/hooks/useGameRules'
import { SelectionAllowances } from '../../profile/components/SelectionAllowances'
import { selectStarter, setActiveCreature } from '../api/collection'
import { OwnedCreatureCard } from '../components/OwnedCreatureCard'
import { StarterSelector } from '../components/StarterSelector'
import { useMyCollection } from '../hooks/useMyCollection'
import type { Creature } from '../../creatures/types'
import type { OwnedCreature } from '../types'

export function MyCollectionPage() {
  const { t } = useTranslation('collection')
  const { user } = useAuth()
  const collection = useMyCollection()
  const rules = useGameRules()
  const action = useFormSubmission()
  const [busyStarter, setBusyStarter] = useState<string | null>(null)
  const [busyOwnedId, setBusyOwnedId] = useState<number | null>(null)

  const chooseStarter = async (creature: Creature) => {
    setBusyStarter(creature.slug)
    const ok = await action.submit(() => selectStarter(creature.slug))
    setBusyStarter(null)
    if (ok) {
      collection.refresh()
    }
  }

  const activate = async (owned: OwnedCreature) => {
    setBusyOwnedId(owned.id)
    const ok = await action.submit(() => setActiveCreature(owned.id))
    setBusyOwnedId(null)
    if (ok) {
      collection.refresh()
    }
  }

  const { state } = collection

  return (
    <PageSection>
      <PageHeading
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('subtitle')}
      />

      {user && (
        <div className="mb-8">
          <SelectionAllowances progress={user.progress} />
        </div>
      )}

      {action.formError && <Alert variant="error" className="mb-6">{action.formError}</Alert>}
      {action.fieldErrors.creature_slug && (
        <Alert variant="error" className="mb-6">{action.fieldErrors.creature_slug[0]}</Alert>
      )}

      <div aria-live="polite">
        {state.status === 'loading' && <PageLoading label={t('loading')} fullPage={false} />}

        {state.status === 'error' && (
          <div className="rounded-2xl border border-signal-bad/40 bg-signal-bad/10 p-6">
            <p className="m-0 font-semibold text-signal-bad">{state.message}</p>
            <Button className="mt-4" variant="secondary" onClick={collection.reload}>
              {t('retry')}
            </Button>
          </div>
        )}
      </div>

      {state.status === 'ready' && state.creatures.length === 0 && (
        <>
          <div className="mb-8 rounded-2xl border border-border bg-surface/70 p-8 text-center shadow-card">
            <p className="m-0 font-display text-xl text-white">{t('empty.title')}</p>
            <p className="mb-0 mt-2 text-arena-300/80">{t('empty.description')}</p>
          </div>
          {rules.status === 'loading' && <PageLoading label={t('starter.loading')} fullPage={false} />}
          {rules.status === 'error' && (
            <div className="rounded-2xl border border-signal-bad/40 bg-signal-bad/10 p-6">
              <p className="m-0 font-semibold text-signal-bad">{rules.message}</p>
              <Button className="mt-4" variant="secondary" onClick={rules.reload}>
                {t('starter.retry')}
              </Button>
            </div>
          )}
          {rules.status === 'ready' && (
            <StarterSelector
              slugs={rules.rules.starter_slugs}
              enabled={rules.rules.features.starter_selection ?? false}
              busySlug={busyStarter}
              onSelect={(creature) => void chooseStarter(creature)}
            />
          )}
        </>
      )}

      {state.status === 'ready' && state.creatures.length > 0 && (
        <>
          <p className="mb-4 text-sm text-arena-300/80">{t('count', { count: state.creatures.length })}</p>
          <ul className="m-0 grid list-none grid-cols-3 gap-4 p-0 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {state.creatures.map((owned) => (
              <li key={owned.id}>
                <OwnedCreatureCard
                  owned={owned}
                  busy={busyOwnedId === owned.id}
                  onSetActive={(item) => void activate(item)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </PageSection>
  )
}
