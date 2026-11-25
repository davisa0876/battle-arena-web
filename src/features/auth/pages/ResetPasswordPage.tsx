import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert } from '../../../shared/components/ui/Alert'
import { buttonClassName } from '../../../shared/components/ui/Button'
import { AuthCard } from '../components/AuthCard'
import { ResetPasswordForm } from '../components/ResetPasswordForm'

/** Landing page for the link in the reset email: `/reset-password?token=...&email=...`. */
export function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  return (
    <AuthCard title={t('reset.title')} subtitle={t('reset.subtitle')}>
      {token === '' ? (
        <div className="flex flex-col gap-4">
          <Alert variant="error">{t('reset.missingToken')}</Alert>
          <Link to="/forgot-password" className={buttonClassName('secondary')}>
            {t('reset.requestNew')}
          </Link>
        </div>
      ) : (
        <ResetPasswordForm token={token} initialEmail={email} />
      )}
    </AuthCard>
  )
}
