import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '../../../i18n'
import { ApiError, apiClient } from '../../../shared/lib/api/client'
import { makeUser } from '../../../test/authTestUtils'
import * as authApi from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import { AuthProvider } from './AuthProvider'

vi.mock('../api/auth')

const mockedApi = vi.mocked(authApi)

function Probe() {
  const { status, user, login, logout } = useAuth()

  return (
    <div>
      <output data-testid="status">{status}</output>
      <output data-testid="handle">{user?.profile.handle ?? 'none'}</output>
      <button
        type="button"
        onClick={() => void login({ email: 'ash@example.test', password: 'password1' }).catch(() => undefined)}
      >
        do-login
      </button>
      <button type="button" onClick={() => void logout().catch(() => undefined)}>
        do-logout
      </button>
    </div>
  )
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('starts loading and becomes authenticated when /api/me returns a user', async () => {
    mockedApi.fetchMe.mockResolvedValue(makeUser())

    renderProbe()

    expect(screen.getByTestId('status')).toHaveTextContent('loading')
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('handle')).toHaveTextContent('ash')
  })

  it('becomes guest when /api/me answers 401', async () => {
    mockedApi.fetchMe.mockRejectedValue(new ApiError('Please log in', 401))

    renderProbe()

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))
    expect(screen.getByTestId('handle')).toHaveTextContent('none')
  })

  it('becomes guest when the API is unreachable', async () => {
    mockedApi.fetchMe.mockRejectedValue(new ApiError('Unable to connect to the API'))

    renderProbe()

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))
  })

  it('logs in with the cookie flow: login call, then /api/me, then authenticated', async () => {
    mockedApi.fetchMe.mockResolvedValueOnce(null)
    mockedApi.login.mockResolvedValue(undefined)
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    mockedApi.fetchMe.mockResolvedValueOnce(makeUser())
    await userEvent.click(screen.getByRole('button', { name: 'do-login' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(mockedApi.login).toHaveBeenCalledWith({ email: 'ash@example.test', password: 'password1' })
    expect(localStorage.length).toBe(0)
  })

  it('stays a guest when login is rejected', async () => {
    mockedApi.fetchMe.mockResolvedValue(null)
    mockedApi.login.mockRejectedValue(new ApiError('Invalid credentials', 422, undefined, { email: ['Invalid'] }))
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))

    await userEvent.click(screen.getByRole('button', { name: 'do-login' }))

    await waitFor(() => expect(mockedApi.login).toHaveBeenCalled())
    expect(screen.getByTestId('status')).toHaveTextContent('guest')
  })

  it('logs out and drops the user even if the logout request fails', async () => {
    mockedApi.fetchMe.mockResolvedValue(makeUser())
    mockedApi.logout.mockRejectedValue(new ApiError('Unable to connect to the API'))
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await userEvent.click(screen.getByRole('button', { name: 'do-logout' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))
    expect(mockedApi.logout).toHaveBeenCalledTimes(1)
  })

  it('drops to guest when any API call answers 401', async () => {
    mockedApi.fetchMe.mockResolvedValue(makeUser())
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'Unauthenticated.' }), { status: 401 })),
    )
    await expect(apiClient.get('/api/me/creatures')).rejects.toMatchObject({ status: 401 })

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('guest'))
  })

  it('throws a helpful error when useAuth is used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => render(<Probe />)).toThrow('useAuth must be used inside <AuthProvider>')

    spy.mockRestore()
  })
})
