import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import { AuthCard } from '../components/AuthCard'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'
import { useRedirectTarget } from '../hooks/useRedirectTarget'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const { status } = useAuth()
  const redirectTo = useRedirectTarget('/')

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <AuthCard
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <div className="flex flex-col gap-2">
          <Link to="/forgot-password" className="font-semibold text-electric">
            {t('login.forgotLink')}
          </Link>
          <p className="m-0">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-ember">
              {t('login.registerLink')}
            </Link>
          </p>
        </div>
      }
    >
      <LoginForm />
    </AuthCard>
  )
}
