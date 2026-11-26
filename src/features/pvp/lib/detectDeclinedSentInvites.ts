import type { PvpInvitation } from '../types'

export type DeclinedSentInvite = {
  invitationId: string
  handle: string
}

/**
 * Detect pending → declined transitions for outbound invites.
 * First snapshot only seeds the pending map (no alerts for historical declines).
 */
export function detectDeclinedSentInvites(input: {
  sent: PvpInvitation[]
  previousPending: Map<string, string>
  primed: boolean
  dismissedIds: Set<string>
}): {
  nextPending: Map<string, string>
  primed: boolean
  declined: DeclinedSentInvite[]
} {
  const nextPending = new Map<string, string>()
  for (const invite of input.sent) {
    if (invite.status === 'pending') {
      nextPending.set(
        invite.id,
        invite.invitee?.handle ?? invite.invitee?.display_name ?? 'trainer',
      )
    }
  }

  if (!input.primed) {
    return { nextPending, primed: true, declined: [] }
  }

  const declined: DeclinedSentInvite[] = []
  for (const [id, handle] of input.previousPending) {
    if (nextPending.has(id) || input.dismissedIds.has(id)) {
      continue
    }
    const latest = input.sent.find((invite) => invite.id === id)
    if (latest?.status === 'declined') {
      declined.push({ invitationId: id, handle })
    }
  }

  return { nextPending, primed: true, declined }
}
