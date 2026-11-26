import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../i18n'
import { authenticatedValue, makeAuthValue, makeUser, renderWithAuth } from '../../test/authTestUtils'
import { AppShell } from './AppShell'

vi.mock('../../shared/components/feedback/SystemStatus', () => ({
  SystemStatus: () => <div data-testid="system-status" />,
}))

vi.mock('../../features/pvp/components/PvpIncomingInviteBanner', () => ({
  PvpIncomingInviteBanner: () => null,
}))

vi.mock('../../features/pvp/components/PvpPresenceKeeper', () => ({
  PvpPresenceKeeper: () => null,
}))

function renderShell(auth = makeAuthValue(), route = '/') {
  return renderWithAuth(
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<p>home page</p>} />
        <Route path="profile" element={<p>profile page</p>} />
        <Route path="login" element={<p>login page</p>} />
      </Route>
    </Routes>,
    { auth, route },
  )
}

describe('AppShell navigation', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('preserves the brand, language selector and system status', () => {
    renderShell()

    expect(screen.getByRole('link', { name: 'Battle Arena home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('combobox', { name: 'Select language' })).toBeInTheDocument()
    expect(screen.getByTestId('system-status')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  })

  it('shows Login, Register and the public Game Rules link to guests', () => {
    renderShell()
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })

    expect(within(nav).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
    expect(within(nav).getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register')
    expect(within(nav).getByRole('link', { name: 'Game Rules' })).toHaveAttribute('href', '/game-rules')
    expect(within(nav).queryByRole('link', { name: 'Creatures' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Account menu' })).not.toBeInTheDocument()
  })

  it('hides account controls while the session is loading', () => {
    renderShell(makeAuthValue({ status: 'loading' }))

    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Account menu' })).not.toBeInTheDocument()
  })

  it('shows a compact avatar dropdown with the level to authenticated trainers', async () => {
    renderShell(authenticatedValue())
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })

    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'My Collection' })).toHaveAttribute('href', '/my-collection')
    expect(within(nav).getByRole('link', { name: 'Game Rules' })).toHaveAttribute('href', '/game-rules')
    const trigger = screen.getByRole('button', { name: 'Account menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveTextContent('Level 3')

    await userEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/profile/edit')
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
    expect(screen.getByText('@ash')).toBeInTheDocument()
  })

  it('closes the dropdown with Escape and on outside click', async () => {
    renderShell(authenticatedValue())
    const trigger = screen.getByRole('button', { name: 'Account menu' })

    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await userEvent.click(trigger)
    await userEvent.click(screen.getByText('home page'))
    expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument()
  })

  it('closes the dropdown after navigating from it', async () => {
    renderShell(authenticatedValue())

    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    await userEvent.click(screen.getByRole('link', { name: 'Profile' }))

    expect(screen.getByText('profile page')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument()
  })

  it('logs out from the dropdown and returns to login', async () => {
    const auth = authenticatedValue()
    renderShell(auth, '/profile')

    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))

    expect(auth.logout).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('exposes the mobile navigation as an accessible disclosure for guests', async () => {
    renderShell()
    const toggle = screen.getByRole('button', { name: 'Open menu' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)

    const closeToggle = screen.getByRole('button', { name: 'Close menu' })
    expect(closeToggle).toHaveAttribute('aria-expanded', 'true')
    expect(closeToggle).toHaveAttribute('aria-controls')
    const panel = document.getElementById(closeToggle.getAttribute('aria-controls') as string) as HTMLElement
    expect(within(panel).queryByRole('link', { name: 'Creatures' })).not.toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: 'Game Rules' })).toHaveAttribute('href', '/game-rules')
    expect(within(panel).getByRole('link', { name: 'Log in' })).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: 'Sign up' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus()
  })

  it('lists trainer links with level and logout in the mobile menu', async () => {
    const auth = authenticatedValue({ user: makeUser() })
    renderShell(auth)

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const panel = document.getElementById(
      screen.getByRole('button', { name: 'Close menu' }).getAttribute('aria-controls') as string,
    ) as HTMLElement

    expect(within(panel).getByText('Level 3')).toBeInTheDocument()
    for (const name of ['Profile', 'My Collection', 'Settings', 'Creatures', 'Game Rules']) {
      expect(within(panel).getByRole('link', { name })).toBeInTheDocument()
    }

    await userEvent.click(within(panel).getByRole('button', { name: 'Log out' }))
    expect(auth.logout).toHaveBeenCalledTimes(1)
  })
})
