import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import { AuthCard } from '../components/AuthCard'
import { RegisterForm } from '../components/RegisterForm'
import { useAuth } from '../hooks/useAuth'

export function RegisterPage() {
  const { t } = useTranslation('auth')
  const { status } = useAuth()

  if (status === 'authenticated') {
    // New accounts land on the collection page, where the starter is chosen.
    return <Navigate to="/my-collection" replace />
  }

  return (
    <AuthCard
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <p className="m-0">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-ember">
            {t('register.loginLink')}
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  )
}
