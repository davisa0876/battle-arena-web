export type { AuthUser } from '../../profile/types'

export type AuthStatus = 'loading' | 'authenticated' | 'guest'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  password_confirmation: string
  handle: string
  display_name: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}
