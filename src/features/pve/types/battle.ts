export type BattlePhase = 'awaiting_player_attack' | 'awaiting_player_defense' | 'finished'

export interface ResourceBar {
  current: number
  max: number
}

export interface BattleMove {
  id: number | null
  slug: string
  name: string
  power: number
  accuracy: number
  type: string
  damage_class: string
  pp: ResourceBar
  stamina_cost: number
  can_use: boolean
}

export interface BattleCombatantView {
  owned_creature_id?: number | null
  name: string
  slug: string
  image_ref?: string | null
  cry_latest_url?: string | null
  cry_legacy_url?: string | null
  cry_url?: string | null
  level: number
  types: string[]
  hp: ResourceBar
  stamina: ResourceBar
  moves?: BattleMove[]
  intent?: { type_slug: string; damage_class: string; is_basic_strike: boolean } | null
}

export interface BattleReward {
  xp_awarded: number
  trainer_levels_gained?: number
  duplicate?: boolean
}

export interface CombatExchangeEntry {
  kind: 'exchange'
  id: string
  round: number
  attacker: { side: string; name: string }
  defender: { side: string; name: string }
  attack: {
    name: string
    slug: string
    stamina_spent: number
    pp_spent: number
  }
  defense: {
    type: string
    stamina_cost: number
    multiplier: number | null
  } | null
  result: {
    hit: 'miss' | 'dodged' | 'hit' | 'blocked' | 'immune'
    damage: number
    hp_before: number | null
    hp_after: number | null
  } | null
  fainted: string | null
  battle_outcome: 'win' | 'loss' | null
}

export interface CombatStartedEntry {
  kind: 'started'
  id: string
}

export interface CombatFinishedEntry {
  kind: 'finished'
  id: string
  outcome: 'win' | 'loss' | null
  xp_awarded?: number
}

export interface CombatRecoverSkipEntry {
  kind: 'recover_skip'
  id: string
  round: number
  actor: { side: string; name: string }
  stamina_gained: number
}

export type CombatLogEntry =
  | CombatStartedEntry
  | CombatExchangeEntry
  | CombatFinishedEntry
  | CombatRecoverSkipEntry

export interface PveRecord {
  wins: number
  losses: number
  give_ups: number
}

export interface PveBattle {
  id: string
  mode: 'pve'
  status: string
  phase: BattlePhase
  round: number
  version: number
  rules_version: string
  difficulty: string
  outcome: 'win' | 'loss' | null
  end_reason?: 'combat' | 'abandoned' | null
  player: BattleCombatantView
  opponent: BattleCombatantView
  allowed_actions: string[]
  last_event_sequence: number
  combat_log?: CombatLogEntry[]
  record?: PveRecord
  reward?: BattleReward | null
}

export interface AttackResponse {
  battle: PveBattle
  events: unknown[]
  reward: BattleReward | null
}
