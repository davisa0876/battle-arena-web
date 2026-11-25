import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/** Renders nested routes for authenticated users; redirects guests to /login (remembering where they were going). */
export function ProtectedRoute() {
  const { t } = useTranslation('auth')
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <p className="mx-auto mt-16 w-[min(480px,calc(100%-2rem))] text-center text-arena-300/80" role="status">
        {t('loading')}
      </p>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname, search: location.search } }} />
  }

  return <Outlet />
}
