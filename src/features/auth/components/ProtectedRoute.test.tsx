import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import '../../../i18n'
import { AuthContext } from '../context/AuthContext'
import { authenticatedValue, makeAuthValue } from '../../../test/authTestUtils'
import { ProtectedRoute } from './ProtectedRoute'

function LoginProbe() {
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from
  return <p>login page from {from ? `${from.pathname}${from.search}` : 'nowhere'}</p>
}

function renderGuarded(auth: ReturnType<typeof makeAuthValue>, route = '/profile') {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<p>secret profile</p>} />
            <Route path="/my-collection" element={<p>secret collection</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('shows a status message while the session is being resolved', () => {
    renderGuarded(makeAuthValue({ status: 'loading' }))

    expect(screen.getByRole('status')).toHaveTextContent('Checking your session...')
    expect(screen.queryByText('secret profile')).not.toBeInTheDocument()
  })

  it('redirects guests to /login and remembers where they were going', () => {
    renderGuarded(makeAuthValue({ status: 'guest' }), '/my-collection?tab=owned')

    expect(screen.getByText('login page from /my-collection?tab=owned')).toBeInTheDocument()
    expect(screen.queryByText('secret collection')).not.toBeInTheDocument()
  })

  it('renders the nested route for authenticated users', () => {
    renderGuarded(authenticatedValue())

    expect(screen.getByText('secret profile')).toBeInTheDocument()
  })
})
