import { apiClient } from '../../../shared/lib/api/client'
import { normalizeAuthUser } from '../../profile/lib/normalizeProfile'
import type { AuthUser, LoginPayload, RegisterPayload, ResetPasswordPayload } from '../types'

/** Session (cookie) login: no `device_name`, so the API answers with a session instead of a token. */
export async function login(payload: LoginPayload): Promise<void> {
  await apiClient.ensureCsrfCookie()
  await apiClient.post<unknown>('/api/login', payload)
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiClient.ensureCsrfCookie()
  await apiClient.post<unknown>('/api/register', payload)
}

export async function logout(): Promise<void> {
  await apiClient.post<unknown>('/api/logout')
}

/** Resolves with the current user, or null when the response carries no user. */
export async function fetchMe(signal?: AbortSignal): Promise<AuthUser | null> {
  return normalizeAuthUser(await apiClient.get<unknown>('/api/me', signal))
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.ensureCsrfCookie()
  await apiClient.post<unknown>('/api/forgot-password', { email })
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.ensureCsrfCookie()
  await apiClient.post<unknown>('/api/reset-password', payload)
}

export async function resendVerificationEmail(): Promise<void> {
  await apiClient.post<unknown>('/api/email/verification-notification')
}
