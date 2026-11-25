import { getCryAudioManager } from './cryAudioManager'

/** Converted AAC copies of the root games/*.mp3 SFX (lighter for FE). */
export const BATTLE_SFX = {
  attacks: ['/pve/sfx/attack1.m4a', '/pve/sfx/attack2.m4a', '/pve/sfx/attack3.m4a'] as const,
  win: '/pve/sfx/crowd-cheering.m4a',
  loss: ['/pve/sfx/disappointment-reaction.m4a', '/pve/sfx/loose-cartoon.m4a'] as const,
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

/** One-shot attack SFX (random attack1–3). Respects mute/volume via cry manager. */
export function playAttackSfx(): Promise<void> {
  return getCryAudioManager().playCry({ url: pickRandom(BATTLE_SFX.attacks) })
}

/** Victory crowd cheer. */
export function playWinSfx(): Promise<void> {
  return getCryAudioManager().playCry({ url: BATTLE_SFX.win })
}

/** Defeat: disappointment then cartoon lose sting. */
export function playLossSfx(): Promise<void> {
  return getCryAudioManager().playSequential([...BATTLE_SFX.loss])
}

export function playOutcomeSfx(outcome: 'win' | 'loss' | null | undefined): Promise<void> {
  if (outcome === 'win') return playWinSfx()
  if (outcome === 'loss') return playLossSfx()
  return Promise.resolve()
}
