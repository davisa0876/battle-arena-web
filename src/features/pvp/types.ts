export type PublicPlayer = {
  id: number
  handle: string | null
  display_name: string | null
  avatar_url: string | null
}

export type PvpInvitation = {
  id: string
  room_id: string
  status: string
  expires_at: string | null
  inviter: PublicPlayer | null
  invitee: PublicPlayer | null
  allowed_actions: string[]
  room?: { id: string; status: string; version: number } | null
}

export type PvpRoom = {
  id: string
  status: string
  version: number
  closed_reason: string | null
  host: PublicPlayer | null
  members: Array<{
    user_id: number
    role: string
    joined_at: string | null
    player: PublicPlayer | null
  }>
  invitation: PvpInvitation | null
  allowed_actions: string[]
  phase_note: string
  my_selection?: { owned_creature_id: number; locked: boolean } | null
  selections_revealed?: Array<{ user_id: number; owned_creature_id: number; locked: boolean }> | null
  battle_id?: string | null
}
