import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../i18n'
import * as rulesApi from '../../features/game-rules/api/gameRules'
import { makeAuthValue, renderWithAuth } from '../../test/authTestUtils'
import { makeRules } from '../../test/fixtures'
import { AppRouter } from './AppRouter'

vi.mock('../../features/game-rules/api/gameRules')
vi.mock('../../shared/components/feedback/SystemStatus', () => ({
  SystemStatus: () => <div data-testid="system-status" />,
}))

describe('AppRouter', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.mocked(rulesApi.fetchGameRules).mockResolvedValue(makeRules({ version: '3.1.0' }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('serves /game-rules to guests without redirecting to login', async () => {
    renderWithAuth(<AppRouter />, { route: '/game-rules', auth: makeAuthValue({ status: 'guest' }) })

    expect(await screen.findByText('Rules version 3.1.0')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /log in/i })).not.toBeInTheDocument()
  })

  it('still protects the creature catalog from guests', async () => {
    renderWithAuth(<AppRouter />, { route: '/creatures', auth: makeAuthValue({ status: 'guest' }) })

    expect(screen.queryByText('Rules version 3.1.0')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /log in|sign in/i })).toBeInTheDocument()
  })
})
