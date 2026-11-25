import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageHeading, PageSection } from '../../../shared/components/layout/PageSection'
import { buttonClassName } from '../../../shared/components/ui/Button'
import { EmailVerificationBanner } from '../../auth/components/EmailVerificationBanner'
import { useAuth } from '../../auth/hooks/useAuth'
import { useMyCollection } from '../../collection/hooks/useMyCollection'
import { PlayerIdentityCard } from '../components/PlayerIdentityCard'
import { PlayerStats } from '../components/PlayerStats'
import { SelectionAllowances } from '../components/SelectionAllowances'

export function ProfilePage() {
  const { t } = useTranslation('profile')
  const { user } = useAuth()
  const { state } = useMyCollection()

  // ProtectedRoute guarantees a user; this keeps the type narrow without a non-null assertion.
  if (!user) {
    return null
  }

  const verified = Boolean(user.email_verified_at)

  return (
    <PageSection size="medium">
      <PageHeading eyebrow={t('page.eyebrow')} title={t('page.title')} />

      {!verified && <EmailVerificationBanner />}

      <div className="flex flex-col gap-8">
        <PlayerIdentityCard
          profile={user.profile}
          progress={user.progress}
          meta={
            <span className={verified ? 'text-signal-ok' : 'text-signal-warn'}>
              {verified ? t('identity.emailVerified') : t('identity.emailUnverified')}
            </span>
          }
          actions={
            <>
              <Link to="/profile/edit" className={buttonClassName('primary')}>
                {t('page.editAction')}
              </Link>
              <Link to={`/players/${encodeURIComponent(user.profile.handle)}`} className={buttonClassName('secondary')}>
                {t('page.publicAction')}
              </Link>
            </>
          }
        />

        <PlayerStats
          progress={user.progress}
          collectionIsPublic={user.profile.collection_is_public}
          creatures={state.status === 'ready' ? state.creatures : null}
        />

        <SelectionAllowances progress={user.progress} />

        <div>
          <Link to="/my-collection" className={buttonClassName('secondary')}>
            {t('page.collectionAction')}
          </Link>
        </div>
      </div>
    </PageSection>
  )
}
