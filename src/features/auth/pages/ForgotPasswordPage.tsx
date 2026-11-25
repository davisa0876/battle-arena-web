import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AuthCard } from '../components/AuthCard'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth')

  return (
    <AuthCard
      title={t('forgot.title')}
      subtitle={t('forgot.subtitle')}
      footer={
        <Link to="/login" className="font-semibold text-electric">
          {t('forgot.backToLogin')}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
