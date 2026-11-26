export interface XpCurveSample {
  level: number
  /** XP needed to advance from this level to the next one. */
  xp_to_next_level: number
  /** Cumulative XP a trainer must have to reach this level; null when the API does not publish it. */
  total_xp_required: number | null
}

/** Selection quota rule for one creature evolution stage. Every field is server-defined. */
export interface StageSelectionRule {
  /** Trainer level at which selections of this stage open; null = not defined yet. */
  unlock_level: number | null
  allowance_cap: number | null
  allowance_at_unlock: number | null
  increment_per_level: number | null
  defined_through_level: number | null
}

export interface SelectionSample {
  trainer_level: number
  stage_1_allowance: number
  stage_2_allowance: number
}

export interface SelectionRules {
  stage_1: StageSelectionRule
  stage_2: StageSelectionRule
  stage_3: StageSelectionRule
  samples: SelectionSample[]
}

export interface BattleReward {
  win: number
  loss: number
}

export interface PvpOnlinePresenceRules {
  while_authenticated: boolean
  requires_pvp_min_level: boolean
  /** When false, trainers appear online on any screen — not only `/pvp`. */
  requires_pvp_screen: boolean
}

export interface BattleRules {
  pve_min_trainer_level: number | null
  pvp_min_trainer_level: number | null
  pvp_online_presence: PvpOnlinePresenceRules | null
  /** Trainer XP rewards per mode. Null when the API did not publish the mode. */
  rewards: {
    pve: BattleReward | null
    pvp: BattleReward | null
  }
  /** True only once battles can actually be played and rewards earned. */
  playable: boolean
}

export interface GameRules {
  version: string
  progression: {
    formula: string | null
    /** Published by the API; frontends must not invent defaults for balancing. */
    starting_level: number | null
    starting_xp: number | null
    /** Arithmetic progression step; null for older API versions. */
    xp_increment_per_level: number | null
    max_level: number | null
    curve_samples: XpCurveSample[]
  }
  selection: SelectionRules
  battle: BattleRules
  /** Slugs of the stage-1 creatures a new trainer may pick. */
  starter_slugs: string[]
  /** Server-controlled feature flags, keyed by flag name. */
  features: Record<string, boolean>
}
