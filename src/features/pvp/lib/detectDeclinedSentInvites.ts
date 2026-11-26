import type { PvpInvitation } from '../types'

export type DeclinedSentInvite = {
  invitationId: string
  handle: string
}

/**
 * Track outbound pending invites and surface decline toasts.
 * Inbox is pending-only: use `declinedHint` from WS `pvp.invitation.changed` status,
 * or an explicit declined row if the API ever returns one.
 */
export function detectDeclinedSentInvites(input: {
  sent: PvpInvitation[]
  previousPending: Map<string, string>
  primed: boolean
  dismissedIds: Set<string>
  declinedHint?: { invitationId: string; status?: string } | null
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

  const hintId = input.declinedHint?.invitationId
  const hintStatus = input.declinedHint?.status
  if (
    hintId &&
    hintStatus === 'declined' &&
    !input.dismissedIds.has(hintId) &&
    input.previousPending.has(hintId)
  ) {
    declined.push({
      invitationId: hintId,
      handle: input.previousPending.get(hintId) ?? 'trainer',
    })
  }

  for (const [id, handle] of input.previousPending) {
    if (nextPending.has(id) || input.dismissedIds.has(id)) {
      continue
    }
    if (declined.some((item) => item.invitationId === id)) {
      continue
    }
    const latest = input.sent.find((invite) => invite.id === id)
    if (latest?.status === 'declined') {
      declined.push({ invitationId: id, handle })
    }
  }

  return { nextPending, primed: true, declined }
}
