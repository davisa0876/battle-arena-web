import { describe, expect, it } from 'vitest'
import { normalizeOwnedCreatureList } from './normalizeCollection'

const creature = {
  id: 4,
  name: 'Charmander',
  slug: 'charmander',
  height_cm: 60,
  weight_g: 8500,
  image_ref: 'https://example.test/c.png',
  image_url: 'https://example.test/c.png',
  evolution_stage: 1,
  types: [{ id: 1, name: 'Fire', slug: 'fire' }],
  base_stats: { hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 },
}

describe('normalizeOwnedCreatureList', () => {
  it('maps owned creatures with nested creature and evolution options', () => {
    const [owned] = normalizeOwnedCreatureList({
      data: [
        {
          id: 10,
          level: 3,
          total_xp: 250,
          is_active: true,
          acquired_at: '2026-01-01T00:00:00Z',
          creature,
          evolution_options: [
            {
              creature: { ...creature, id: 5, name: 'Charmeleon', slug: 'charmeleon' },
              eligible: false,
              locked: true,
              reason_code: 'requirements_not_defined',
            },
          ],
        },
      ],
    })

    expect(owned.id).toBe(10)
    expect(owned.is_active).toBe(true)
    expect(owned.creature.name).toBe('Charmander')
    expect(owned.creature.types[0].name).toBe('Fire')
    expect(owned.evolution_options).toEqual([
      expect.objectContaining({ eligible: false, locked: true, reason_code: 'requirements_not_defined' }),
    ])
    expect(owned.evolution_options[0].creature.slug).toBe('charmeleon')
  })

  it('accepts plain evolution creatures as locked options', () => {
    const [owned] = normalizeOwnedCreatureList({
      data: [{ id: 1, creature, evolutions: [{ ...creature, id: 5, slug: 'charmeleon', name: 'Charmeleon' }] }],
    })

    expect(owned.evolution_options).toHaveLength(1)
    expect(owned.evolution_options[0]).toMatchObject({ eligible: false, locked: true, reason_code: null })
  })

  it('skips malformed entries and tolerates unexpected payloads', () => {
    expect(normalizeOwnedCreatureList({ data: [{ id: 1 }, null, 'x'] })).toEqual([])
    expect(normalizeOwnedCreatureList(null)).toEqual([])
    expect(normalizeOwnedCreatureList({ data: {} })).toEqual([])
  })
})
