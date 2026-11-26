export interface CreatureType {
  id: number
  name: string
  slug: string
}

export interface CreatureBaseStats {
  hp: number
  attack: number
  defense: number
  special_attack: number
  special_defense: number
  speed: number
}

export interface CreatureCombatAttack {
  id: number
  slug: string
  name: string
  power: number
  accuracy: number
  pp: number
  stamina_cost: number
  damage_class: string
  type_slug: string
}

export interface CreatureCombatDefense {
  slug: string
  name: string
  stamina_cost: number
  damage_multiplier?: number | null
  success_chance?: number | null
  stamina_restore?: number | null
}

export interface CreatureCombatPreview {
  attacks: CreatureCombatAttack[]
  defenses: CreatureCombatDefense[]
  note?: string
}

export interface Creature {
  id: number
  name: string
  slug: string
  height_cm: number | null
  weight_g: number | null
  image_ref: string | null
  image_url?: string | null
  evolution_stage?: number
  /** True when the signed-in trainer already owns this catalog form. */
  is_owned?: boolean
  /** Authoritative: whether the Add button may run a selection right now. */
  can_select?: boolean
  /** Which API to call when can_select is true. */
  selection_action?: 'starter' | 'acquire' | null
  /** Why the Add button is disabled when can_select is false. */
  selection_blocked_reason?:
    | 'unauthenticated'
    | 'owned'
    | 'starter_required'
    | 'no_allowance'
    | 'stage_locked'
    | 'unavailable'
    | null
  types: CreatureType[]
  base_stats: CreatureBaseStats
  evolves_from?: Creature | null
  evolutions?: Creature[]
  /** Present on detail endpoint only. */
  combat?: CreatureCombatPreview | null
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedCreatures {
  data: Creature[]
  meta: PaginationMeta
}

export interface CreatureDetailResponse {
  data: Creature
}

export interface CreatureTypesResponse {
  data: CreatureType[]
}

export interface CreatureListParams {
  search?: string
  type?: string
  page?: number
  per_page?: number
}
