import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { PageLoading } from '../../../shared/components/feedback/PageLoading'
import { Alert } from '../../../shared/components/ui/Alert'
import { buttonClassName } from '../../../shared/components/ui/Button'
import { AuthCard } from '../components/AuthCard'
import { EmailVerificationBanner } from '../components/EmailVerificationBanner'
import { useAuth } from '../hooks/useAuth'

type VerificationOutcome = 'verified' | 'already_verified' | 'invalid' | null

/**
 * The API redirects here after the signed verification link is opened. The outcome is read
 * defensively from the query string; the authoritative state is always `/api/me`.
 */
function readOutcome(searchParams: URLSearchParams): VerificationOutcome {
  const status = (searchParams.get('status') ?? searchParams.get('verified') ?? '').toLowerCase()

  if (['already_verified', 'already-verified', 'already'].includes(status)) {
    return 'already_verified'
  }
  if (['1', 'true', 'ok', 'success', 'verified'].includes(status)) {
    return 'verified'
  }
  if (['0', 'false', 'invalid', 'error', 'expired', 'failed'].includes(status)) {
    return 'invalid'
  }
  return null
}

export function VerifyEmailPage() {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const { status, user, refreshMe } = useAuth()
  const outcome = readOutcome(searchParams)

  // Make sure the profile reflects the verification that just happened server-side.
  useEffect(() => {
    if (outcome === 'verified' || outcome === 'already_verified') {
      void refreshMe()
    }
  }, [outcome, refreshMe])

  const isVerified = Boolean(user?.email_verified_at)

  let content
  if (outcome === 'invalid') {
    content = <Alert variant="error">{t('verify.invalid')}</Alert>
  } else if (status === 'loading') {
    content = <PageLoading label={t('verify.checking')} fullPage={false} />
  } else if (outcome === 'already_verified') {
    content = <Alert variant="success">{t('verify.alreadyVerified')}</Alert>
  } else if (outcome === 'verified' || isVerified) {
    content = <Alert variant="success">{t('verify.verified')}</Alert>
  } else if (status === 'authenticated') {
    content = <Alert variant="info">{t('verify.pending')}</Alert>
  } else {
    content = <Alert variant="info">{t('verify.loginRequired')}</Alert>
  }

  return (
    <AuthCard title={t('verify.title')}>
      <div className="flex flex-col gap-4">
        {content}
        {status === 'authenticated' && !isVerified && outcome !== 'verified' && outcome !== 'already_verified' && (
          <EmailVerificationBanner />
        )}
        {status === 'authenticated' ? (
          <Link to="/profile" className={buttonClassName('primary')}>
            {t('verify.goToProfile')}
          </Link>
        ) : (
          status === 'guest' && (
            <Link to="/login" className={buttonClassName('primary')}>
              {t('verify.goToLogin')}
            </Link>
          )
        )}
      </div>
    </AuthCard>
  )
}
