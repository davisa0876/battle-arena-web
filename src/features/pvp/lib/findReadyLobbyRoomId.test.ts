import { describe, expect, it } from 'vitest'
import { findReadyLobbyRoomId } from './findReadyLobbyRoomId'
import type { PvpInvitation } from '../types'

function invite(partial: Partial<PvpInvitation> & Pick<PvpInvitation, 'id' | 'status'>): PvpInvitation {
  return {
    room_id: '',
    expires_at: null,
    inviter: { id: 1, handle: 'a', display_name: 'A', avatar_url: null },
    invitee: { id: 2, handle: 'b', display_name: 'B', avatar_url: null },
    allowed_actions: [],
    ...partial,
  }
}

describe('findReadyLobbyRoomId', () => {
  it('returns the first accepted invitation room id', () => {
    expect(
      findReadyLobbyRoomId(
        [invite({ id: '1', status: 'pending', room_id: 'r-pending' })],
        [invite({ id: '2', status: 'accepted', room_id: 'r-ready' })],
      ),
    ).toBe('r-ready')
  })

  it('returns null when nothing is accepted', () => {
    expect(findReadyLobbyRoomId([invite({ id: '1', status: 'pending', room_id: 'r1' })], [])).toBeNull()
  })
})
