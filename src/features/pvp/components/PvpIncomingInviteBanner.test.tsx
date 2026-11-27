import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { authenticatedValue, makeProgress, makeUser, renderWithAuth } from '../../../test/authTestUtils'
import { PvpIncomingInviteBanner } from './PvpIncomingInviteBanner'

function pvpAuth() {
  return authenticatedValue({
    user: makeUser({
      // Matches the room host below: accepted-invite alerts are shown to the host only.
      id: 2,
      progress: makeProgress({ level: 6, pvp_level_unlocked: true }),
    }),
  })
}

const listMock = vi.fn()
const fetchLobbyMock = vi.fn()
const acceptMock = vi.fn()

vi.mock('../api/pvpLobbies', () => ({
  listPvpInvitations: (...args: unknown[]) => listMock(...args),
  fetchCurrentPvpLobby: (...args: unknown[]) => fetchLobbyMock(...args),
  fetchPvpRoom: vi.fn(),
  acceptPvpInvitation: (...args: unknown[]) => acceptMock(...args),
  declinePvpInvitation: vi.fn(),
  issueRealtimeTicket: vi.fn(async () => ({ ticket: 't', expires_in: 30, ws_url: 'ws://localhost/ws' })),
}))

function LocationProbe() {
  const location = useLocation()
  const state = location.state as { focusRoomId?: string; fromInviteAccept?: boolean } | null
  return (
    <p>
      path:{location.pathname};focus:{state?.focusRoomId ?? ''};accept:{state?.fromInviteAccept ? '1' : '0'}
    </p>
  )
}

vi.mock('../lib/pvpRealtimeSession', () => ({
  PvpRealtimeSession: class {
    async connect() {
      return undefined
    }
    close() {
      return undefined
    }
  },
}))

describe('PvpIncomingInviteBanner', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    listMock.mockReset()
    fetchLobbyMock.mockReset()
    acceptMock.mockReset()
    fetchLobbyMock.mockResolvedValue(null)
  })

  it('shows pending invites on non-battle pages', async () => {
    listMock.mockImplementation(async (box: string) => {
      if (box === 'received') {
        return [
          {
            id: 'inv-1',
            room_id: 'room-1',
            status: 'pending',
            expires_at: null,
            inviter: { id: 9, handle: 'ahahahah', display_name: 'Ahahahah', avatar_url: null },
            invitee: { id: 2, handle: 'bombom', display_name: 'bombom', avatar_url: null },
            allowed_actions: ['accept', 'decline'],
          },
        ]
      }
      return []
    })

    renderWithAuth(
      <Routes>
        <Route
          path="/"
          element={
            <>
              <PvpIncomingInviteBanner />
              <p>home</p>
            </>
          }
        />
      </Routes>,
      { auth: pvpAuth(), route: '/' },
    )

    expect(await screen.findByText(/ahahahah invited you/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument()
  })

  it('notifies host when invitee accepted and dismisses after Choose creatures', async () => {
    const user = userEvent.setup()
    listMock.mockResolvedValue([])
    fetchLobbyMock.mockResolvedValue({
      id: 'room-2',
      status: 'ready',
      version: 2,
      closed_reason: null,
      host: { id: 2, handle: 'bombom', display_name: 'bombom', avatar_url: null },
      members: [
        {
          user_id: 2,
          role: 'host',
          joined_at: null,
          player: { id: 2, handle: 'bombom', display_name: 'bombom', avatar_url: null },
        },
        {
          user_id: 9,
          role: 'guest',
          joined_at: null,
          player: { id: 9, handle: 'ahahahah', display_name: 'Ahahahah', avatar_url: null },
        },
      ],
      invitation: null,
      allowed_actions: ['select_creature', 'ready'],
      phase_note: 'ready',
    })

    renderWithAuth(
      <Routes>
        <Route
          path="/pvp"
          element={
            <>
              <PvpIncomingInviteBanner />
              <p>pvp lobby</p>
              <div id="pvp-creature-select">creatures</div>
            </>
          }
        />
      </Routes>,
      { auth: pvpAuth(), route: '/pvp' },
    )

    expect(await screen.findByText(/accepted your private invite/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Choose creatures' }))
    expect(screen.queryByText(/accepted your private invite/i)).not.toBeInTheDocument()
  })

  it('redirects from any screen to /pvp creature select after accept', async () => {
    const user = userEvent.setup()
    listMock.mockImplementation(async (box: string) => {
      if (box === 'received') {
        return [
          {
            id: 'inv-home',
            room_id: 'room-home',
            status: 'pending',
            expires_at: null,
            inviter: { id: 9, handle: 'ahahahah', display_name: 'Ahahahah', avatar_url: null },
            invitee: { id: 2, handle: 'bombom', display_name: 'bombom', avatar_url: null },
            allowed_actions: ['accept', 'decline'],
          },
        ]
      }
      return []
    })
    acceptMock.mockResolvedValue({
      id: 'room-home',
      status: 'ready',
      version: 2,
      closed_reason: null,
      host: null,
      members: [],
      invitation: null,
      allowed_actions: ['select_creature', 'ready'],
      phase_note: 'ready',
    })

    renderWithAuth(
      <Routes>
        <Route
          path="/my-collection"
          element={
            <>
              <PvpIncomingInviteBanner />
              <LocationProbe />
            </>
          }
        />
        <Route
          path="/pvp"
          element={
            <>
              <p>pvp lobby</p>
              <LocationProbe />
            </>
          }
        />
      </Routes>,
      { auth: pvpAuth(), route: '/my-collection' },
    )

    expect(await screen.findByText(/ahahahah invited you/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Accept' }))

    expect(await screen.findByText('pvp lobby')).toBeInTheDocument()
    expect(screen.getByText('path:/pvp;focus:room-home;accept:1')).toBeInTheDocument()
  })

  it('hides on active pvp battle routes', async () => {
    listMock.mockResolvedValue([])

    renderWithAuth(
      <Routes>
        <Route
          path="/pvp/battles/:battleId"
          element={
            <>
              <PvpIncomingInviteBanner />
              <p>battle</p>
            </>
          }
        />
      </Routes>,
      { auth: pvpAuth(), route: '/pvp/battles/abc' },
    )

    expect(await screen.findByText('battle')).toBeInTheDocument()
    expect(screen.queryByText(/invited you/i)).not.toBeInTheDocument()
    expect(listMock).not.toHaveBeenCalled()
  })

})
