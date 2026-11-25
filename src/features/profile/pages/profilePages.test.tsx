import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { ApiError } from '../../../shared/lib/api/client'
import { authenticatedValue, makeAuthValue, makeUser, makeProgress, renderWithAuth } from '../../../test/authTestUtils'
import { makeOwned } from '../../../test/fixtures'
import * as collectionApi from '../../collection/api/collection'
import * as profileApi from '../api/profile'
import type { PublicPlayer } from '../types'
import { EditProfilePage } from './EditProfilePage'
import { ProfilePage } from './ProfilePage'
import { PublicPlayerProfilePage } from './PublicPlayerProfilePage'

vi.mock('../api/profile')
vi.mock('../../collection/api/collection')
vi.mock('../../auth/api/auth')

const profile = vi.mocked(profileApi)
const collection = vi.mocked(collectionApi)

beforeEach(async () => {
  await i18n.changeLanguage('en')
  collection.fetchMyCreatures.mockResolvedValue([])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ProfilePage', () => {
  it('shows the real identity, level, XP and stats from the authenticated user', async () => {
    collection.fetchMyCreatures.mockResolvedValue([
      makeOwned(4, 'Charmander', { is_active: true }),
      makeOwned(25, 'Pikachu'),
    ])

    renderWithAuth(<ProfilePage />, { auth: authenticatedValue(), route: '/profile' })

    expect(screen.getByRole('heading', { level: 2, name: 'Ash Ketchum' })).toBeInTheDocument()
    expect(screen.getByText('@ash')).toBeInTheDocument()
    expect(screen.getByText('Gotta catch them all.')).toBeInTheDocument()
    expect(screen.getByText('Level 3', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '56')
    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/profile/edit')
    expect(screen.getByRole('link', { name: 'View public page' })).toHaveAttribute('href', '/players/ash')

    const stats = screen.getByRole('region', { name: 'Trainer stats' })
    await waitFor(() => expect(within(stats).getByText('Charmander')).toBeInTheDocument())
    expect(within(stats).getByText('Private')).toBeInTheDocument()
    expect(within(stats).getByText('450')).toBeInTheDocument()
    expect(within(stats).getByText('2')).toBeInTheDocument()
  })

  it('does not invent collection numbers when the collection cannot be loaded', async () => {
    collection.fetchMyCreatures.mockRejectedValue(new ApiError('Unable to connect to the API'))

    renderWithAuth(<ProfilePage />, { auth: authenticatedValue(), route: '/profile' })

    const stats = screen.getByRole('region', { name: 'Trainer stats' })
    await waitFor(() => expect(collection.fetchMyCreatures).toHaveBeenCalled())
    expect(within(stats).getAllByText('Unavailable')).toHaveLength(2)
  })

  it('prompts unverified users to verify their email', () => {
    renderWithAuth(<ProfilePage />, {
      auth: authenticatedValue({ user: makeUser({ email_verified_at: null }) }),
    })

    expect(screen.getByText('Please verify your email address to secure your account.')).toBeInTheDocument()
    expect(screen.getByText('Email not verified')).toBeInTheDocument()
  })

  it('shows selection allowances and PvP lock status for the owner', () => {
    const user = makeUser({
      progress: makeProgress({
        selection_allowances: [
          { evolution_stage: 1, total: 3, used: 1, remaining: 2 },
          { evolution_stage: 2, total: 0, used: 0, remaining: 0 },
        ],
        pvp_level_unlocked: false,
      }),
    })

    renderWithAuth(<ProfilePage />, { auth: authenticatedValue({ user }) })

    const region = screen.getByRole('region', { name: 'Creature selections' })
    expect(within(region).getByText('2 of 3 left')).toBeInTheDocument()
    expect(within(region).getByText('1 used')).toBeInTheDocument()
    expect(within(region).getByText('0 of 0 left')).toBeInTheDocument()
    expect(within(region).getByText('Locked')).toBeInTheDocument()
  })

  it('omits the allowances block when the API sent no owner-only data', () => {
    renderWithAuth(<ProfilePage />, { auth: authenticatedValue() })

    expect(screen.queryByRole('region', { name: 'Creature selections' })).not.toBeInTheDocument()
  })

  it('shows the initials fallback when there is no avatar', () => {
    renderWithAuth(<ProfilePage />, { auth: authenticatedValue() })

    expect(screen.getByRole('img', { name: 'Avatar of Ash Ketchum' })).toHaveTextContent('AK')
  })
})

describe('EditProfilePage', () => {
  it('sends only the changed profile fields, then reloads /api/me', async () => {
    profile.updateProfile.mockResolvedValue(undefined)
    const auth = authenticatedValue()
    renderWithAuth(<EditProfilePage />, { auth, route: '/profile/edit' })

    const name = screen.getByLabelText('Display name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Ash K.')
    await userEvent.click(screen.getByLabelText('Make my collection public'))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(profile.updateProfile).toHaveBeenCalledWith({ display_name: 'Ash K.', collection_is_public: true }),
    )
    expect(auth.refreshMe).toHaveBeenCalled()
    expect(await screen.findByText('Profile updated.')).toBeInTheDocument()
  })

  it('maps handle conflicts from the API to the handle field', async () => {
    profile.updateProfile.mockRejectedValue(
      new ApiError('Taken', 422, undefined, { handle: ['The handle has already been taken.'] }),
    )
    renderWithAuth(<EditProfilePage />, { auth: authenticatedValue() })

    const handle = screen.getByLabelText('Handle')
    await userEvent.clear(handle)
    await userEvent.type(handle, 'misty')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('The handle has already been taken.')).toBeInTheDocument()
    expect(handle).toHaveAttribute('aria-invalid', 'true')
  })

  it('validates the password form and submits the contract payload', async () => {
    profile.updatePassword.mockResolvedValue(undefined)
    renderWithAuth(<EditProfilePage />, { auth: authenticatedValue() })

    await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
    expect(profile.updatePassword).not.toHaveBeenCalled()
    expect(screen.getAllByText('This field is required.').length).toBeGreaterThanOrEqual(3)

    await userEvent.type(screen.getByLabelText('Current password'), 'oldpassword')
    await userEvent.type(screen.getByLabelText('New password'), 'newpassword1')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'newpassword1')
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }))

    await waitFor(() =>
      expect(profile.updatePassword).toHaveBeenCalledWith({
        current_password: 'oldpassword',
        password: 'newpassword1',
        password_confirmation: 'newpassword1',
      }),
    )
    expect(await screen.findByText('Password updated.')).toBeInTheDocument()
    expect(screen.getByLabelText('Current password')).toHaveValue('')
  })

  it('rejects unsupported avatar files before calling the API', async () => {
    renderWithAuth(<EditProfilePage />, { auth: authenticatedValue() })
    const input = screen.getByLabelText('Choose image') as HTMLInputElement

    // userEvent.upload honours `accept`, so dispatch the change directly to prove the guard.
    const svg = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' })
    await userEvent.upload(input, svg, { applyAccept: false })

    expect(await screen.findByText('Use a JPG, PNG or WebP image.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload avatar' })).toBeDisabled()
    expect(profile.uploadAvatar).not.toHaveBeenCalled()
  })

  it('rejects oversized avatars', async () => {
    renderWithAuth(<EditProfilePage />, { auth: authenticatedValue() })
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })

    await userEvent.upload(screen.getByLabelText('Choose image'), big)

    expect(await screen.findByText('The image must be 2 MB or smaller.')).toBeInTheDocument()
  })

  it('uploads a valid avatar and reloads the user', async () => {
    profile.uploadAvatar.mockResolvedValue(undefined)
    const auth = authenticatedValue()
    renderWithAuth(<EditProfilePage />, { auth })
    const file = new File(['png-bytes'], 'me.png', { type: 'image/png' })

    await userEvent.upload(screen.getByLabelText('Choose image'), file)
    expect(screen.getByText('Selected: me.png')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Upload avatar' }))

    await waitFor(() => expect(profile.uploadAvatar).toHaveBeenCalledWith(file))
    expect(auth.refreshMe).toHaveBeenCalled()
    expect(await screen.findByText('Avatar updated.')).toBeInTheDocument()
  })

  it('only offers avatar removal when an avatar exists, and removes it through the API', async () => {
    profile.deleteAvatar.mockResolvedValue(undefined)
    const withAvatar = makeUser()
    withAvatar.profile.avatar_url = 'http://api.test/api/avatars/7'
    const auth = authenticatedValue({ user: withAvatar })
    const { unmount } = renderWithAuth(<EditProfilePage />, { auth })

    await userEvent.click(screen.getByRole('button', { name: 'Remove avatar' }))

    await waitFor(() => expect(profile.deleteAvatar).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Avatar removed.')).toBeInTheDocument()
    unmount()

    renderWithAuth(<EditProfilePage />, { auth: authenticatedValue() })
    expect(screen.queryByRole('button', { name: 'Remove avatar' })).not.toBeInTheDocument()
  })
})

describe('PublicPlayerProfilePage', () => {
  const player: PublicPlayer = {
    handle: 'misty',
    display_name: 'Misty',
    bio: 'Water-type specialist.',
    avatar_url: null,
    collection_is_public: true,
    progress: makeProgress({ level: 12 }),
    collection: [makeOwned(7, 'Squirtle', { is_active: true })],
  }

  function renderPublic(handle = 'misty') {
    return render(
      <MemoryRouter initialEntries={[`/players/${handle}`]}>
        <Routes>
          <Route path="/players/:handle" element={<PublicPlayerProfilePage />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('loads a public trainer by handle and lists their public collection read-only', async () => {
    profile.fetchPublicPlayer.mockResolvedValue(player)

    renderPublic()

    expect(screen.getByText('Loading trainer...')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2, name: 'Misty' })).toBeInTheDocument()
    expect(profile.fetchPublicPlayer).toHaveBeenCalledWith('misty', expect.any(AbortSignal))
    expect(screen.getByText('Level 12', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Squirtle' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set as active' })).not.toBeInTheDocument()
  })

  it('shows a private collection message', async () => {
    profile.fetchPublicPlayer.mockResolvedValue({ ...player, collection_is_public: false, collection: null })

    renderPublic()

    expect(await screen.findByText('This trainer keeps their collection private.')).toBeInTheDocument()
  })

  it('shows not found for unknown handles', async () => {
    profile.fetchPublicPlayer.mockRejectedValue(new ApiError('API request failed with status 404', 404))

    renderPublic('ghost')

    expect(await screen.findByText('Trainer not found.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('offers a retry for other failures', async () => {
    profile.fetchPublicPlayer.mockRejectedValueOnce(new ApiError('Unable to connect to the API'))
    profile.fetchPublicPlayer.mockResolvedValueOnce(player)

    renderPublic()
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Misty' })).toBeInTheDocument()
  })
})

describe('guest safety', () => {
  it('ProfilePage renders nothing without a user (guarded by ProtectedRoute in the app)', () => {
    const { container } = renderWithAuth(<ProfilePage />, { auth: makeAuthValue() })

    expect(container).toBeEmptyDOMElement()
  })
})
