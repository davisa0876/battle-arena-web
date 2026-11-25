import { createContext } from 'react'
import type { AuthStatus, AuthUser, LoginPayload, RegisterPayload } from '../types'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  login: (payload: LoginPayload) => Promise<AuthUser>
  register: (payload: RegisterPayload) => Promise<AuthUser>
  logout: () => Promise<void>
  /** Re-reads `/api/me`. Resolves with the user, or null when the visitor is a guest. */
  refreshMe: (signal?: AbortSignal) => Promise<AuthUser | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
