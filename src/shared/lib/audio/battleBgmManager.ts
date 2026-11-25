import { readBattleAudioSettings, writeBattleAudioSettings } from './battleAudioSettings'

export const ARENA_BGM_SRC = '/pve/arena-bgm.m4a'

/** Looping PvE arena music. Separate from cry SFX; respects mute + musicEnabled. */
export class BattleBgmManager {
  private audio: HTMLAudioElement | null = null
  private wanted = false

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      const el = new Audio(ARENA_BGM_SRC)
      el.loop = true
      el.preload = 'auto'
      this.audio = el
    }
    return this.audio
  }

  private effectiveVolume(): number {
    const settings = readBattleAudioSettings()
    if (settings.muted || !settings.musicEnabled) return 0
    return Math.max(0, Math.min(1, settings.volume * 0.55))
  }

  /** Start or resume looping BGM when allowed by settings. */
  async play(): Promise<void> {
    this.wanted = true
    const settings = readBattleAudioSettings()
    if (settings.muted || !settings.musicEnabled) {
      this.pause()
      return
    }

    const el = this.ensureAudio()
    el.volume = this.effectiveVolume()
    try {
      await el.play()
    } catch {
      // Autoplay may fail until a gesture unlocks audio.
    }
  }

  pause(): void {
    if (!this.audio) return
    try {
      this.audio.pause()
    } catch {
      // ignore
    }
  }

  stop(): void {
    this.wanted = false
    if (!this.audio) return
    try {
      this.audio.pause()
      this.audio.currentTime = 0
    } catch {
      // ignore
    }
  }

  /** Re-apply mute / music / volume after settings change. */
  syncFromSettings(): void {
    if (!this.wanted) return
    const settings = readBattleAudioSettings()
    if (settings.muted || !settings.musicEnabled) {
      this.pause()
      return
    }
    if (this.audio) {
      this.audio.volume = this.effectiveVolume()
    }
    void this.play()
  }

  setMusicEnabled(enabled: boolean): void {
    writeBattleAudioSettings({ musicEnabled: enabled })
    this.syncFromSettings()
  }

  isMusicEnabled(): boolean {
    return readBattleAudioSettings().musicEnabled
  }
}

let shared: BattleBgmManager | null = null

export function getBattleBgmManager(): BattleBgmManager {
  if (!shared) shared = new BattleBgmManager()
  return shared
}

export function resetBattleBgmManagerForTests(): void {
  shared?.stop()
  shared = null
}
