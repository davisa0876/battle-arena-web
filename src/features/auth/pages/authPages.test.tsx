import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { ApiError } from '../../../shared/lib/api/client'
import { authenticatedValue, makeAuthValue, makeUser, renderWithAuth } from '../../../test/authTestUtils'
import * as authApi from '../api/auth'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'
import { ResetPasswordPage } from './ResetPasswordPage'
import { VerifyEmailPage } from './VerifyEmailPage'

vi.mock('../api/auth')

const mockedApi = vi.mocked(authApi)

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('LoginPage', () => {
  it('renders the form and links to forgot-password and register', () => {
    renderWithAuth(<LoginPage />, { route: '/login' })

    expect(screen.getByRole('heading', { name: 'Welcome back, trainer' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('link', { name: 'Forgot your password?' })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register')
  })

  it('shows client-side validation and does not call the API for empty or invalid input', async () => {
    const auth = makeAuthValue()
    renderWithAuth(<LoginPage />, { auth })

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getAllByText('This field is required.')).toHaveLength(2)

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')
    await userEvent.type(screen.getByLabelText('Password'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(auth.login).not.toHaveBeenCalled()
  })

  it('submits trimmed credentials through AuthProvider.login', async () => {
    const auth = makeAuthValue()
    renderWithAuth(<LoginPage />, { auth })

    await userEvent.type(screen.getByLabelText('Email'), '  ash@example.test ')
    await userEvent.type(screen.getByLabelText('Password'), 'password1')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(auth.login).toHaveBeenCalledWith({ email: 'ash@example.test', password: 'password1' }))
  })

  it('maps API validation errors onto the matching field', async () => {
    const auth = makeAuthValue({
      login: vi.fn(async () => {
        throw new ApiError('These credentials do not match our records.', 422, undefined, {
          email: ['These credentials do not match our records.'],
        })
      }),
    })
    renderWithAuth(<LoginPage />, { auth })

    await userEvent.type(screen.getByLabelText('Email'), 'ash@example.test')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('These credentials do not match our records.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a form-level error for network failures', async () => {
    const auth = makeAuthValue({
      login: vi.fn(async () => {
        throw new ApiError('Unable to connect to the API')
      }),
    })
    renderWithAuth(<LoginPage />, { auth })

    await userEvent.type(screen.getByLabelText('Email'), 'ash@example.test')
    await userEvent.type(screen.getByLabelText('Password'), 'password1')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to connect to the API')
  })

  it('toggles password visibility with an accessible button', async () => {
    renderWithAuth(<LoginPage />)
    const password = screen.getByLabelText('Password')

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('redirects authenticated users to home', () => {
    renderWithAuth(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>home route</p>} />
      </Routes>,
      { auth: authenticatedValue(), route: '/login' },
    )

    expect(screen.getByText('home route')).toBeInTheDocument()
  })
})

describe('RegisterPage', () => {
  it('validates required fields, password length and confirmation', async () => {
    const auth = makeAuthValue()
    renderWithAuth(<RegisterPage />, { auth })

    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getAllByText('This field is required.').length).toBeGreaterThanOrEqual(4)

    await userEvent.type(screen.getByLabelText('Email'), 'ash@example.test')
    await userEvent.type(screen.getByLabelText('Handle'), 'ash')
    await userEvent.type(screen.getByLabelText('Display name'), 'Ash')
    await userEvent.type(screen.getByLabelText('Password'), 'short')
    await userEvent.type(screen.getByLabelText('Confirm password'), 'different')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(auth.register).not.toHaveBeenCalled()
  })

  it('registers with the contract payload (no device_name)', async () => {
    const auth = makeAuthValue()
    renderWithAuth(<RegisterPage />, { auth })

    await userEvent.type(screen.getByLabelText('Email'), 'ash@example.test')
    await userEvent.type(screen.getByLabelText('Handle'), 'ash')
    await userEvent.type(screen.getByLabelText('Display name'), 'Ash Ketchum')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.type(screen.getByLabelText('Confirm password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() =>
      expect(auth.register).toHaveBeenCalledWith({
        email: 'ash@example.test',
        handle: 'ash',
        display_name: 'Ash Ketchum',
        password: 'password123',
        password_confirmation: 'password123',
      }),
    )
    expect(auth.register).toHaveBeenCalledWith(expect.not.objectContaining({ device_name: expect.anything() }))
  })

  it('shows the API handle conflict on the handle field', async () => {
    const auth = makeAuthValue({
      register: vi.fn(async () => {
        throw new ApiError('The handle has already been taken.', 422, undefined, {
          handle: ['The handle has already been taken.'],
        })
      }),
    })
    renderWithAuth(<RegisterPage />, { auth })

    await userEvent.type(screen.getByLabelText('Email'), 'ash@example.test')
    await userEvent.type(screen.getByLabelText('Handle'), 'ash')
    await userEvent.type(screen.getByLabelText('Display name'), 'Ash')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.type(screen.getByLabelText('Confirm password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('The handle has already been taken.')).toBeInTheDocument()
    expect(screen.getByLabelText('Handle')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('ForgotPasswordPage', () => {
  it('sends the reset link request and shows a non-revealing confirmation', async () => {
    mockedApi.forgotPassword.mockResolvedValue(undefined)
    renderWithAuth(<ForgotPasswordPage />)

    await userEvent.type(screen.getByLabelText('Email'), 'ash@example.test')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(mockedApi.forgotPassword).toHaveBeenCalledWith('ash@example.test')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'If an account exists for that email, a reset link is on its way.',
    )
  })

  it('validates the email first', async () => {
    renderWithAuth(<ForgotPasswordPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(screen.getByText('This field is required.')).toBeInTheDocument()
    expect(mockedApi.forgotPassword).not.toHaveBeenCalled()
  })
})

describe('ResetPasswordPage', () => {
  it('explains an invalid link when the token is missing', () => {
    renderWithAuth(<ResetPasswordPage />, { route: '/reset-password' })

    expect(screen.getByRole('alert')).toHaveTextContent('This reset link is incomplete or invalid')
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/forgot-password')
  })

  it('submits token, email and new password from the reset link', async () => {
    mockedApi.resetPassword.mockResolvedValue(undefined)
    renderWithAuth(<ResetPasswordPage />, { route: '/reset-password?token=abc123&email=ash%40example.test' })

    expect(screen.getByLabelText('Email')).toHaveValue('ash@example.test')
    await userEvent.type(screen.getByLabelText('Password'), 'newpassword1')
    await userEvent.type(screen.getByLabelText('Confirm password'), 'newpassword1')
    await userEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() =>
      expect(mockedApi.resetPassword).toHaveBeenCalledWith({
        token: 'abc123',
        email: 'ash@example.test',
        password: 'newpassword1',
        password_confirmation: 'newpassword1',
      }),
    )
    expect(await screen.findByText('Your password was updated. You can log in now.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to log in' })).toHaveAttribute('href', '/login')
  })
})

describe('VerifyEmailPage', () => {
  it('confirms verification after the API redirect and refreshes the user', async () => {
    const auth = authenticatedValue({ user: makeUser({ email_verified_at: '2026-01-01T00:00:00Z' }) })
    renderWithAuth(<VerifyEmailPage />, { auth, route: '/verify-email?status=verified' })

    expect(screen.getByText('Your email is verified. Thank you!')).toBeInTheDocument()
    await waitFor(() => expect(auth.refreshMe).toHaveBeenCalled())
  })

  it('reports an invalid or expired link', () => {
    renderWithAuth(<VerifyEmailPage />, { route: '/verify-email?status=invalid' })

    expect(screen.getByRole('alert')).toHaveTextContent('This verification link is invalid or expired.')
  })

  it('lets an unverified trainer resend the email', async () => {
    mockedApi.resendVerificationEmail.mockResolvedValue(undefined)
    renderWithAuth(<VerifyEmailPage />, {
      auth: authenticatedValue({ user: makeUser({ email_verified_at: null }) }),
      route: '/verify-email',
    })

    expect(screen.getByText(/not verified yet/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Resend email' }))

    expect(mockedApi.resendVerificationEmail).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Verification email sent.')).toBeInTheDocument()
  })

  it('asks guests to log in', () => {
    renderWithAuth(<VerifyEmailPage />, { route: '/verify-email' })

    expect(screen.getByText('Log in to resend the verification email.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
  })
})
