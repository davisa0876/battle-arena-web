import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../features/auth/context/AuthContext'
import type { AuthUser } from '../features/auth/types'
import type { TrainerProgress } from '../features/profile/types'

export function makeProgress(overrides: Partial<TrainerProgress> = {}): TrainerProgress {
  return {
    level: 3,
    total_xp: 450,
    xp_into_level: 125,
    xp_to_next_level: 100,
    xp_for_next_level: 225,
    progress_percent: 55.5,
    is_max_level: false,
    ...overrides,
  }
}

export function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 7,
    email: 'ash@example.test',
    email_verified_at: '2026-01-02T10:00:00Z',
    profile: {
      handle: 'ash',
      display_name: 'Ash Ketchum',
      bio: 'Gotta catch them all.',
      avatar_url: null,
      collection_is_public: false,
    },
    progress: makeProgress(),
    ...overrides,
  }
}

export function makeAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'guest',
    user: null,
    login: vi.fn(async () => makeUser()),
    register: vi.fn(async () => makeUser()),
    logout: vi.fn(async () => undefined),
    refreshMe: vi.fn(async () => null),
    ...overrides,
  }
}

export function authenticatedValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return makeAuthValue({ status: 'authenticated', user: makeUser(), ...overrides })
}

interface RenderOptions {
  route?: string
  auth?: AuthContextValue
}

/** Renders `ui` inside a MemoryRouter with a controllable AuthContext. */
export function renderWithAuth(ui: ReactElement, { route = '/', auth = makeAuthValue() }: RenderOptions = {}) {
  return {
    auth,
    ...render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthContext.Provider>,
    ),
  }
}
