import { describe, expect, it } from 'vitest'

import { detectDeclinedSentInvites } from './detectDeclinedSentInvites'
import type { PvpInvitation } from '../types'

function invite(partial: Partial<PvpInvitation> & Pick<PvpInvitation, 'id' | 'status'>): PvpInvitation {
  return {
    room_id: 'room-1',
    expires_at: null,
    responded_at: null,
    created_at: null,
    inviter: { id: 1, handle: 'bombom', display_name: 'Bombom', avatar_url: null },
    invitee: { id: 2, handle: 'ahahahah', display_name: 'Ahahahah', avatar_url: null },
    allowed_actions: [],
    ...partial,
  }
}

describe('detectDeclinedSentInvites', () => {
  it('primes without alerting on first snapshot', () => {
    const result = detectDeclinedSentInvites({
      sent: [invite({ id: 'a', status: 'pending' })],
      previousPending: new Map(),
      primed: false,
      dismissedIds: new Set(),
    })
    expect(result.declined).toEqual([])
    expect(result.primed).toBe(true)
    expect(result.nextPending.get('a')).toBe('ahahahah')
  })

  it('alerts when WS reports declined for a known pending invite', () => {
    const result = detectDeclinedSentInvites({
      sent: [],
      previousPending: new Map([['a', 'ahahahah']]),
      primed: true,
      dismissedIds: new Set(),
      declinedHint: { invitationId: 'a', status: 'declined' },
    })
    expect(result.declined).toEqual([{ invitationId: 'a', handle: 'ahahahah' }])
  })

  it('does not treat cancel/accept disappearance as decline without hint', () => {
    const result = detectDeclinedSentInvites({
      sent: [],
      previousPending: new Map([['a', 'ahahahah']]),
      primed: true,
      dismissedIds: new Set(),
    })
    expect(result.declined).toEqual([])
  })

  it('still detects an explicit declined row in the list', () => {
    const result = detectDeclinedSentInvites({
      sent: [invite({ id: 'a', status: 'declined' })],
      previousPending: new Map([['a', 'ahahahah']]),
      primed: true,
      dismissedIds: new Set(),
    })
    expect(result.declined).toEqual([{ invitationId: 'a', handle: 'ahahahah' }])
  })
})
