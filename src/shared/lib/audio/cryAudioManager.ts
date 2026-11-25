import { getBattleBgmManager } from './battleBgmManager'
import { readBattleAudioSettings, writeBattleAudioSettings, type BattleAudioSettings } from './battleAudioSettings'

type AudioFactory = (src: string) => HTMLAudioElement

export interface CryPlaybackOptions {
  url: string | null | undefined
  signal?: AbortSignal
}

/**
 * Browser cry player with mute/volume, sequential playback, and cleanup.
 * Uses HTMLAudioElement; failures are swallowed so battles never block.
 */
export class CryAudioManager {
  private current: HTMLAudioElement | null = null
  private settings: BattleAudioSettings
  private queue: Promise<void> = Promise.resolve()
  private disposed = false
  private readonly createAudio: AudioFactory

  constructor(createAudio: AudioFactory = (src) => new Audio(src)) {
    this.createAudio = createAudio
    this.settings = readBattleAudioSettings()
  }

  getSettings(): BattleAudioSettings {
    return { ...this.settings }
  }

  setMuted(muted: boolean): void {
    this.settings = writeBattleAudioSettings({ muted })
    if (muted) this.stop()
    else if (this.current) this.current.volume = this.settings.volume
    getBattleBgmManager().syncFromSettings()
  }

  setVolume(volume: number): void {
    this.settings = writeBattleAudioSettings({ volume })
    if (this.current && !this.settings.muted) {
      this.current.volume = this.settings.volume
    }
    getBattleBgmManager().syncFromSettings()
  }

  markUnlocked(): void {
    this.settings = writeBattleAudioSettings({ unlocked: true })
  }

  isUnlocked(): boolean {
    return this.settings.unlocked
  }

  stop(): void {
    if (!this.current) return
    try {
      this.current.pause()
      this.current.src = ''
    } catch {
      // ignore
    }
    this.current = null
  }

  dispose(): void {
    this.disposed = true
    this.stop()
  }

  /**
   * Unlock audio after a user gesture (e.g. Start battle).
   * Plays a silent buffer when possible; always marks unlocked.
   */
  async unlockFromGesture(): Promise<void> {
    this.markUnlocked()
    try {
      const silent = this.createAudio(
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      )
      silent.volume = 0.001
      await silent.play().catch(() => undefined)
      silent.pause()
    } catch {
      // still unlocked for future attempts
    }
  }

  playCry(options: CryPlaybackOptions): Promise<void> {
    const run = async () => {
      if (this.disposed || this.settings.muted) return
      const url = options.url?.trim()
      if (!url) return
      if (options.signal?.aborted) return

      this.stop()
      const audio = this.createAudio(url)
      audio.volume = this.settings.volume
      this.current = audio

      const aborted = () => {
        this.stop()
      }
      options.signal?.addEventListener('abort', aborted, { once: true })

      try {
        await new Promise<void>((resolve) => {
          const finish = () => resolve()
          audio.addEventListener('ended', finish, { once: true })
          audio.addEventListener('error', finish, { once: true })
          void audio.play().then(undefined, finish)
        })
      } finally {
        options.signal?.removeEventListener('abort', aborted)
        if (this.current === audio) this.current = null
      }
    }

    this.queue = this.queue.then(run, run)
    return this.queue
  }

  async playSequential(urls: Array<string | null | undefined>, signal?: AbortSignal): Promise<void> {
    for (const url of urls) {
      if (signal?.aborted || this.disposed) return
      await this.playCry({ url, signal })
    }
  }
}

let shared: CryAudioManager | null = null

export function getCryAudioManager(): CryAudioManager {
  if (!shared) shared = new CryAudioManager()
  return shared
}

export function resetCryAudioManagerForTests(manager?: CryAudioManager | null): void {
  shared?.dispose()
  shared = manager ?? null
}
