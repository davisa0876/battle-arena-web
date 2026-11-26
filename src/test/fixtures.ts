import type { OwnedCreature } from '../features/collection/types'
import type { Creature } from '../features/creatures/types'
import type { GameRules } from '../features/game-rules/types'

export function makeCreature(id: number, name: string, typeName = 'Fire'): Creature {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    height_cm: 60,
    weight_g: 8500,
    image_ref: null,
    image_url: null,
    evolution_stage: 1,
    types: [{ id: 1, name: typeName, slug: typeName.toLowerCase() }],
    base_stats: { hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 },
  }
}

export function makeOwned(id: number, name: string, overrides: Partial<OwnedCreature> = {}): OwnedCreature {
  return {
    id,
    creature: makeCreature(id, name),
    level: 5,
    total_xp: 1234,
    is_active: false,
    acquired_at: '2026-03-01T12:00:00Z',
    evolution_options: [],
    ...overrides,
  }
}

const emptyStage = {
  unlock_level: null,
  allowance_cap: null,
  allowance_at_unlock: null,
  increment_per_level: null,
  defined_through_level: null,
}

/** Minimal valid GameRules; tests override only what they assert on. */
export function makeRules(overrides: Partial<GameRules> = {}): GameRules {
  return {
    version: '3.1.0',
    progression: {
      formula: null,
      starting_level: null,
      starting_xp: null,
      xp_increment_per_level: null,
      max_level: null,
      curve_samples: [],
    },
    selection: { stage_1: emptyStage, stage_2: emptyStage, stage_3: emptyStage, samples: [] },
    battle: {
      pve_min_trainer_level: null,
      pvp_min_trainer_level: null,
      pvp_online_presence: null,
      rewards: { pve: null, pvp: null },
      playable: false,
    },
    starter_slugs: [],
    features: {},
    ...overrides,
  }
}