import type { OwnedCreature } from '../../collection/types'

/** Selection quota for one creature evolution stage, as computed by the server (owner-only). */
export interface SelectionAllowance {
  /** Original evolution_stage of the creatures this quota applies to (not trainer level). */
  evolution_stage: number
  total: number
  used: number
  remaining: number
}

export interface TrainerProgress {
  /** Trainer (account) level. Distinct from creature evolution_stage and owned-creature level. */
  level: number
  total_xp: number
  xp_into_level: number
  /** XP still needed to reach the next level; null at max level. */
  xp_to_next_level: number | null
  /** Size of the current level in XP; null at max level. */
  xp_for_next_level: number | null
  /** 0-100 */
  progress_percent: number
  is_max_level: boolean
  /** Owner-only; absent on public profiles and older API versions. */
  selection_allowances?: SelectionAllowance[]
  /** Owner-only; whether the trainer level meets the server's PvP minimum. */
  pvp_level_unlocked?: boolean
}

export interface PlayerProfile {
  handle: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  collection_is_public: boolean
}

export interface PveRecord {
  wins: number
  losses: number
  give_ups: number
}

export interface AuthUser {
  id: number
  email: string
  email_verified_at: string | null
  profile: PlayerProfile
  progress: TrainerProgress
  /** Career PvE totals; present on /api/me for the signed-in trainer. */
  pve_record?: PveRecord
}

/** What anyone can see about another trainer. */
export interface PublicPlayer {
  handle: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  collection_is_public: boolean
  progress: TrainerProgress
  /** Null when the collection is private (or the API did not include it). */
  collection: OwnedCreature[] | null
}

export interface UpdateProfilePayload {
  display_name?: string
  bio?: string | null
  handle?: string
  collection_is_public?: boolean
}

export interface UpdatePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}
