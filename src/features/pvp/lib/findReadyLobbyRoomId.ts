import type { PvpInvitation } from '../types'

/** Prefer an accepted invite's room so accept-from-anywhere can open creature select. */
export function findReadyLobbyRoomId(
  received: PvpInvitation[],
  sent: PvpInvitation[],
): string | null {
  for (const invite of [...received, ...sent]) {
    if (invite.status === 'accepted' && invite.room_id) {
      return invite.room_id
    }
  }
  return null
}
