const STORAGE_KEY = 'battle-arena.audio'

export interface BattleAudioSettings {
  muted: boolean
  volume: number
  unlocked: boolean
  /** Arena BGM; defaults on. */
  musicEnabled: boolean
}

const DEFAULTS: BattleAudioSettings = {
  muted: false,
  volume: 0.7,
  unlocked: false,
  musicEnabled: true,
}

function clampVolume(value: number): number {
  if (Number.isNaN(value)) return DEFAULTS.volume
  return Math.max(0, Math.min(1, value))
}

export function readBattleAudioSettings(): BattleAudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<BattleAudioSettings>
    return {
      muted: Boolean(parsed.muted),
      volume: clampVolume(typeof parsed.volume === 'number' ? parsed.volume : DEFAULTS.volume),
      unlocked: Boolean(parsed.unlocked),
      musicEnabled: parsed.musicEnabled === undefined ? DEFAULTS.musicEnabled : Boolean(parsed.musicEnabled),
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function writeBattleAudioSettings(patch: Partial<BattleAudioSettings>): BattleAudioSettings {
  const next = {
    ...readBattleAudioSettings(),
    ...patch,
  }
  next.volume = clampVolume(next.volume)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function resolveCryUrl(latest?: string | null, legacy?: string | null, preferred?: string | null): string | null {
  const candidates = [preferred, latest, legacy]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      try {
        const url = new URL(candidate)
        if (url.protocol !== 'https:') continue
        if (!url.hostname.endsWith('githubusercontent.com')) continue
        if (!url.pathname.includes('/PokeAPI/cries/')) continue
        return url.toString()
      } catch {
        continue
      }
    }
  }
  return null
}
