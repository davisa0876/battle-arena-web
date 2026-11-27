import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import i18n from '../../../i18n'
import { ApiError, apiClient } from '../../../shared/lib/api/client'
import * as authApi from '../api/auth'
import type { AuthStatus, AuthUser, LoginPayload, RegisterPayload } from '../types'
import { AuthContext, type AuthContextValue } from './AuthContext'

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
}

const GUEST_STATE: AuthState = { status: 'guest', user: null }

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Session lives in HttpOnly cookies managed by the API (Sanctum SPA mode).
 * Nothing credential-like is ever written to localStorage/sessionStorage.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null })

  const refreshMe = useCallback(async (signal?: AbortSignal): Promise<AuthUser | null> => {
    try {
      const user = await authApi.fetchMe(signal)
      if (signal?.aborted) {
        return null
      }
      setState(user ? { status: 'authenticated', user } : GUEST_STATE)
      return user
    } catch {
      if (!signal?.aborted) {
        setState(GUEST_STATE)
      }
      return null
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void refreshMe(controller.signal)
    return () => controller.abort()
  }, [refreshMe])

  useEffect(() => {
    apiClient.setUnauthorizedHandler(() => setState(GUEST_STATE))
    return () => apiClient.setUnauthorizedHandler(undefined)
  }, [])

  const establishSession = useCallback(async (): Promise<AuthUser> => {
    const user = await authApi.fetchMe()
    if (!user) {
      throw new ApiError(i18n.t('errors:generic'))
    }
    setState({ status: 'authenticated', user })
    return user
  }, [])

  const login = useCallback(
    async (payload: LoginPayload) => {
      await authApi.login(payload)
      return establishSession()
    },
    [establishSession],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await authApi.register(payload)
      return establishSession()
    },
    [establishSession],
  )

  const logout = useCallback(async () => {
    // Drop local session first so PvpPresenceKeeper closes the WS immediately.
    setState(GUEST_STATE)
    try {
      await authApi.logout()
    } catch {
      // Still signed out locally; server presence clear may have failed.
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status: state.status, user: state.user, login, register, logout, refreshMe }),
    [login, logout, refreshMe, register, state.status, state.user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
