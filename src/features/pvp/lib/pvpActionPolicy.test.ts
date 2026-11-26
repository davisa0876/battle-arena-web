import { describe, expect, it } from 'vitest'
import { attackFallback, canSubmitAction, viewerOutcome } from './pvpActionPolicy'
import type { PvpBattle } from '../types/battle'

function baseBattle(overrides: Partial<PvpBattle> = {}): PvpBattle {
  return {
    id: 'b1',
    room_id: 'r1',
    mode: 'pvp',
    phase: 'awaiting_attack',
    status: 'active',
    version: 1,
    turn_number: 1,
    rules_version: 'v1',
    current_attacker_user_id: 1,
    current_defender_user_id: 2,
    pending_attack: null,
    me: {
      user_id: 1,
      name: 'Me',
      slug: 'me',
      level: 5,
      types: ['fire'],
      hp: { current: 20, max: 20 },
      stamina: { current: 100, max: 100 },
      moves: [],
    },
    opponent: {
      user_id: 2,
      name: 'Opp',
      slug: 'opp',
      level: 5,
      types: ['water'],
      hp: { current: 20, max: 20 },
      stamina: { current: 100, max: 100 },
    },
    allowed_actions: ['attack'],
    last_event_sequence: 1,
    outcome: null,
    ...overrides,
  }
}

describe('pvpActionPolicy', () => {
  it('maps viewer outcome from durable winner/loser ids', () => {
    const battle = baseBattle({
      phase: 'finished',
      outcome: { winner_user_id: 1, loser_user_id: 2, end_reason: 'combat' },
    })
    expect(viewerOutcome(battle)).toBe('win')
    expect(viewerOutcome({ ...battle, me: { ...battle.me!, user_id: 2 } })).toBe('loss')
  })

  it('only enables recover-skip / basic strike when server allows and moves gate matches', () => {
    expect(
      attackFallback(
        [{ id: 1, slot: 1, slug: 'a', name: 'A', power: 40, accuracy: 100, type_slug: 'fire', damage_class: 'special', pp: { current: 5, max: 5 }, stamina_cost: 200, can_use: false }],
        ['attack', 'recover', 'basic_strike'],
      ),
    ).toEqual({ canBasicStrike: false, canRecoverSkip: true, canAttackMove: false })

    expect(
      attackFallback(
        [{ id: 1, slot: 1, slug: 'a', name: 'A', power: 40, accuracy: 100, type_slug: 'fire', damage_class: 'special', pp: { current: 0, max: 5 }, stamina_cost: 10, can_use: false }],
        ['attack', 'recover', 'basic_strike'],
      ),
    ).toEqual({ canBasicStrike: true, canRecoverSkip: false, canAttackMove: false })
  })

  it('blocks submissions when action not in allowed_actions', () => {
    expect(canSubmitAction(baseBattle({ allowed_actions: [] }), 'attack')).toBe(false)
    expect(canSubmitAction(baseBattle({ allowed_actions: ['attack'] }), 'attack')).toBe(true)
  })
})
