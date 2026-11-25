import { describe, expect, it, vi } from 'vitest'
import type { CryAudioManager } from '../../../shared/lib/audio/cryAudioManager'
import { initialIntroState, runBattleIntro } from './battleIntroController'
import type { BattleCombatantView } from '../types/battle'

function combatant(name: string, id: number): BattleCombatantView {
  return {
    name,
    slug: name.toLowerCase(),
    level: 1,
    types: ['grass'],
    hp: { current: 10, max: 10 },
    stamina: { current: 100, max: 100 },
    cry_url: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`,
    cry_latest_url: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`,
    cry_legacy_url: null,
  }
}

describe('runBattleIntro', () => {
  it('runs sequential enter + cry phases and enables controls', async () => {
    const playCry = vi.fn(async () => undefined)
    const audio = { playCry } as unknown as CryAudioManager
    const updates: string[] = []
    const controller = new AbortController()

    await runBattleIntro({
      audio,
      opponent: combatant('Caterpie', 10),
      player: combatant('Bulbasaur', 1),
      signal: controller.signal,
      startedMessage: 'Battle started! Your turn!',
      onUpdate: (state) => updates.push(state.phase),
    })

    expect(updates).toEqual([
      'arena',
      'opponent_enter',
      'opponent_cry',
      'player_enter',
      'player_cry',
      'ready',
    ])
    expect(playCry).toHaveBeenCalledTimes(2)
    expect(initialIntroState(true).controlsEnabled).toBe(true)
  })
})
