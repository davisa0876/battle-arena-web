import { describe, expect, it } from 'vitest'

import { findReadyLobbyRoomId } from './findReadyLobbyRoomId'
import type { PvpRoom } from '../types'

function room(partial: Partial<PvpRoom> & Pick<PvpRoom, 'id' | 'status'>): PvpRoom {
  return {
    version: 1,
    closed_reason: null,
    closed_at: null,
    created_at: null,
    host: null,
    members: [],
    invitation: null,
    allowed_actions: [],
    my_selection: null,
    selections_revealed: null,
    battle_id: null,
    phase_note: '',
    ...partial,
  }
}

describe('findReadyLobbyRoomId', () => {
  it('returns ready or in_battle lobby id', () => {
    expect(findReadyLobbyRoomId(room({ id: 'r-ready', status: 'ready' }))).toBe('r-ready')
    expect(findReadyLobbyRoomId(room({ id: 'r-battle', status: 'in_battle' }))).toBe('r-battle')
  })

  it('ignores waiting lobbies and null', () => {
    expect(findReadyLobbyRoomId(room({ id: 'r-wait', status: 'waiting_for_guest' }))).toBeNull()
    expect(findReadyLobbyRoomId(null)).toBeNull()
  })
})
