import type { Creature } from '../../creatures/types'

export interface EvolutionOption {
  creature: Creature
  eligible: boolean
  locked: boolean
  reason_code: string | null
}

export interface OwnedCreature {
  id: number
  creature: Creature
  level: number
  total_xp: number
  is_active: boolean
  acquired_at: string | null
  evolution_options: EvolutionOption[]
}
