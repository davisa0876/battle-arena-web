import { describe, expect, it } from 'vitest'
import { mergeEventsBySequence, narrativeFromEvents } from './pvpEventNarrative'

describe('pvpEventNarrative', () => {
  it('merges by sequence and detects gaps', () => {
    const merged = mergeEventsBySequence(
      [{ sequence: 1, type: 'battle_started', actor: null, target: null, payload: {}, occurred_at: null }],
      [{ sequence: 3, type: 'damage_applied', actor: 'player', target: 'opponent', payload: { damage: 5 }, occurred_at: null }],
    )
    expect(merged.gap).toBe(true)
    expect(merged.events.map((e) => e.sequence)).toEqual([1, 3])
  })

  it('builds narrative keys without inventing combat math', () => {
    const rows = narrativeFromEvents([
      { sequence: 1, type: 'battle_started', actor: null, target: null, payload: {}, occurred_at: null },
      {
        sequence: 2,
        type: 'damage_applied',
        actor: 'player',
        target: 'opponent',
        payload: { damage: 8, hp_before: 20, hp_after: 12 },
        occurred_at: null,
      },
    ])
    expect(rows[0].textKey).toBe('log.started')
    expect(rows[1].textKey).toBe('log.damage')
    expect(rows[1].params.damage).toBe(8)
  })
})
