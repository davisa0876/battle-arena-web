export type PvpBattlePhase = 'awaiting_attack' | 'awaiting_defense' | 'finished'

export type ResourceBar = { current: number; max: number }

export type PvpBattleMove = {
  id: number | null
  slot: number
  slug: string | null
  name: string | null
  power: number | null
  accuracy: number | null
  type_slug: string | null
  damage_class: string | null
  pp: ResourceBar
  stamina_cost: number
  can_use: boolean
}

export type PvpCombatant = {
  user_id: number
  name: string
  slug: string
  image_ref?: string | null
  level: number
  types: string[]
  hp: ResourceBar
  stamina: ResourceBar
  stats?: Record<string, unknown>
  moves?: PvpBattleMove[]
}

export type PvpPendingAttack = {
  move_name: string | null
  move_slug: string | null
  is_basic_strike: boolean
} | null

export type PvpBattleOutcome = {
  winner_user_id: number | null
  loser_user_id: number | null
  end_reason: string | null
  forfeiting_user_id?: number | null
  timed_out_user_id?: number | null
} | null

export type PvpRewardRow = {
  user_id: number
  outcome: string
  xp_awarded: number
}

export type PvpBattle = {
  id: string
  room_id: string
  mode: 'pvp'
  phase: PvpBattlePhase
  status: string
  version: number
  turn_number: number
  rules_version: string
  current_attacker_user_id: number
  current_defender_user_id: number
  pending_attack: PvpPendingAttack
  action_deadline_at?: string | null
  deadline_actor_user_id?: number | null
  me: PvpCombatant | null
  opponent: PvpCombatant | null
  allowed_actions: string[]
  last_event_sequence: number
  outcome: PvpBattleOutcome
  rewards?: PvpRewardRow[] | null
}

export type PvpBattleEvent = {
  sequence: number
  type: string
  actor: string | null
  target: string | null
  payload: Record<string, unknown> | null
  occurred_at: string | null
}

export type PvpLobbyCombatState = {
  id: string
  status: string
  version: number
  my_selection: { owned_creature_id: number; locked: boolean } | null
  selections_revealed: Array<{ user_id: number; owned_creature_id: number; locked: boolean }> | null
  battle_id: string | null
  battle?: PvpBattle
  phase_note?: string
}
