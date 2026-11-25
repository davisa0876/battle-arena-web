import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoading } from '../../../shared/components/feedback/PageLoading'
import { useAuth } from '../hooks/useAuth'

/** Renders nested routes for authenticated users; redirects guests to /login (remembering where they were going). */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <PageLoading />
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname, search: location.search } }} />
  }

  return <Outlet />
}
