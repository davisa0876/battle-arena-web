import { describe, expect, it } from 'vitest'
import { normalizeGameRules } from './normalizeRules'

const stage = (overrides: Record<string, number | null> = {}) => ({
  unlock_level: null,
  allowance_cap: null,
  allowance_at_unlock: null,
  increment_per_level: null,
  defined_through_level: null,
  ...overrides,
})

describe('normalizeGameRules', () => {
  it('reads the 3.1.0 shape: arithmetic XP, selection quotas and battle rules', () => {
    const rules = normalizeGameRules({
      data: {
        rules_version: '3.1.0',
        version: '3.1.0',
        features: { battles: false, creature_selection: true },
        trainer: {
          xp_increment_per_level: 100,
          curve: [{ level: 1, xp_to_advance: 100, total_xp_required: 0 }],
        },
        progression: {
          xp_increment_per_level: 100,
          xp_base: 100,
          xp_growth: null,
          max_level: 100,
          formula: 'xp_to_next = xp_increment_per_level * current_level',
          curve: [
            { level: 2, xp_to_advance: 200, total_xp_required: 100 },
            { level: 1, xp_to_advance: 100, total_xp_required: 0 },
            { level: 3, xp_to_advance: 300, total_xp_required: 300 },
          ],
        },
        selection: {
          stage_1: { unlock_level: 1, allowance_cap: 10 },
          stage_2: { unlock_level: 10, allowance_at_unlock: 1, increment_per_level: 1, defined_through_level: 20 },
          stage_3: { unlock_level: null },
          samples: [
            { trainer_level: 2, stage_1_allowance: 2, stage_2_allowance: 0 },
            { trainer_level: 1, stage_1_allowance: 1, stage_2_allowance: 0 },
          ],
        },
        battle: {
          pve_min_trainer_level: 1,
          pvp_min_trainer_level: 6,
          rewards: { pve: { win: 10, loss: 5 }, pvp: { win: 20, loss: 10 } },
          playable: false,
        },
        starters: { creature_slugs: ['bulbasaur', 'charmander'] },
      },
    })

    expect(rules).toEqual({
      version: '3.1.0',
      progression: {
        formula: 'xp_to_next = xp_increment_per_level * current_level',
        starting_level: null,
        starting_xp: null,
        xp_increment_per_level: 100,
        max_level: 100,
        curve_samples: [
          { level: 1, xp_to_next_level: 100, total_xp_required: 0 },
          { level: 2, xp_to_next_level: 200, total_xp_required: 100 },
          { level: 3, xp_to_next_level: 300, total_xp_required: 300 },
        ],
      },
      selection: {
        stage_1: stage({ unlock_level: 1, allowance_cap: 10 }),
        stage_2: stage({
          unlock_level: 10,
          allowance_at_unlock: 1,
          increment_per_level: 1,
          defined_through_level: 20,
        }),
        stage_3: stage(),
        samples: [
          { trainer_level: 1, stage_1_allowance: 1, stage_2_allowance: 0 },
          { trainer_level: 2, stage_1_allowance: 2, stage_2_allowance: 0 },
        ],
      },
      battle: {
        pve_min_trainer_level: 1,
        pvp_min_trainer_level: 6,
        rewards: { pve: { win: 10, loss: 5 }, pvp: { win: 20, loss: 10 } },
        playable: false,
      },
      starter_slugs: ['bulbasaur', 'charmander'],
      features: { battles: false, creature_selection: true },
    })
  })

  it('keeps a trainer level of 0 and distinguishes null from 0', () => {
    const rules = normalizeGameRules({
      selection: { stage_2: { unlock_level: 10, allowance_at_unlock: 0 } },
      battle: { pve_min_trainer_level: 0 },
    })

    expect(rules.selection.stage_2.allowance_at_unlock).toBe(0)
    expect(rules.selection.stage_2.increment_per_level).toBeNull()
    expect(rules.battle.pve_min_trainer_level).toBe(0)
    expect(rules.battle.pvp_min_trainer_level).toBeNull()
  })

  it('falls back to the trainer block, legacy aliases and object-map samples (older shapes)', () => {
    const rules = normalizeGameRules({
      rules_version: '3.0.0',
      trainer: { xp_base: 100, curve: [{ level: 1, xp_to_next_level: 100 }] },
      starters: [{ slug: 'pikachu' }, 'eevee', {}],
      feature_flags: { rankings: true },
    })

    expect(rules.version).toBe('3.0.0')
    expect(rules.progression.xp_increment_per_level).toBe(100)
    expect(rules.progression.curve_samples).toEqual([{ level: 1, xp_to_next_level: 100, total_xp_required: null }])
    expect(rules.starter_slugs).toEqual(['pikachu', 'eevee'])
    expect(rules.features).toEqual({ rankings: true })

    const legacy = normalizeGameRules({ progression: { xp_curve: { '1': 100, '5': { xp_required: 506 } } } })
    expect(legacy.progression.curve_samples).toEqual([
      { level: 1, xp_to_next_level: 100, total_xp_required: null },
      { level: 5, xp_to_next_level: 506, total_xp_required: null },
    ])
  })

  it('degrades to empty values for an unexpected payload', () => {
    const rules = normalizeGameRules(null)

    expect(rules.version).toBe('')
    expect(rules.progression).toEqual({
      formula: null,
      starting_level: null,
      starting_xp: null,
      xp_increment_per_level: null,
      max_level: null,
      curve_samples: [],
    })
    expect(rules.selection).toEqual({ stage_1: stage(), stage_2: stage(), stage_3: stage(), samples: [] })
    expect(rules.battle).toEqual({
      pve_min_trainer_level: null,
      pvp_min_trainer_level: null,
      rewards: { pve: null, pvp: null },
      playable: false,
    })
    expect(rules.starter_slugs).toEqual([])
    expect(rules.features).toEqual({})
  })
})
