import { describe, expect, it } from 'vitest'
import { detectDeclinedSentInvites } from './detectDeclinedSentInvites'
import type { PvpInvitation } from '../types'

function invite(partial: Partial<PvpInvitation> & Pick<PvpInvitation, 'id' | 'status'>): PvpInvitation {
  return {
    room_id: 'room-1',
    expires_at: null,
    inviter: { id: 1, handle: 'host', display_name: 'Host', avatar_url: null },
    invitee: { id: 2, handle: 'ahahahah', display_name: 'Ahahahah', avatar_url: null },
    allowed_actions: [],
    ...partial,
  }
}

describe('detectDeclinedSentInvites', () => {
  it('does not alert on the first snapshot', () => {
    const previousPending = new Map<string, string>()
    const result = detectDeclinedSentInvites({
      sent: [invite({ id: 'a', status: 'pending' })],
      previousPending,
      primed: false,
      dismissedIds: new Set(),
    })

    expect(result.declined).toEqual([])
    expect(result.primed).toBe(true)
    expect(result.nextPending.get('a')).toBe('ahahahah')
  })

  it('alerts when a tracked pending invite becomes declined', () => {
    const previousPending = new Map([['a', 'ahahahah']])
    const result = detectDeclinedSentInvites({
      sent: [invite({ id: 'a', status: 'declined' })],
      previousPending,
      primed: true,
      dismissedIds: new Set(),
    })

    expect(result.declined).toEqual([{ invitationId: 'a', handle: 'ahahahah' }])
    expect(result.nextPending.size).toBe(0)
  })

  it('ignores declined invites that were dismissed', () => {
    const previousPending = new Map([['a', 'ahahahah']])
    const result = detectDeclinedSentInvites({
      sent: [invite({ id: 'a', status: 'declined' })],
      previousPending,
      primed: true,
      dismissedIds: new Set(['a']),
    })

    expect(result.declined).toEqual([])
  })
})
