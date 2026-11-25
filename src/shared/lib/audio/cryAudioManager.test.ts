import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CryAudioManager, resetCryAudioManagerForTests } from './cryAudioManager'
import { writeBattleAudioSettings } from './battleAudioSettings'

function mockAudio() {
  const listeners = new Map<string, Set<() => void>>()
  const audio = {
    volume: 1,
    src: '',
    pause: vi.fn(),
    play: vi.fn(async () => undefined),
    addEventListener: vi.fn((event: string, handler: () => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(handler)
    }),
    removeEventListener: vi.fn((event: string, handler: () => void) => {
      listeners.get(event)?.delete(handler)
    }),
    emit(event: string) {
      listeners.get(event)?.forEach((handler) => handler())
    },
  }
  return audio
}

describe('CryAudioManager', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCryAudioManagerForTests(null)
    writeBattleAudioSettings({ muted: false, volume: 0.5, unlocked: true })
  })

  it('plays cries sequentially without overlapping current sound', async () => {
    const created: Array<ReturnType<typeof mockAudio>> = []
    const manager = new CryAudioManager((src) => {
      const audio = mockAudio()
      audio.src = src
      created.push(audio)
      queueMicrotask(() => audio.emit('ended'))
      return audio as unknown as HTMLAudioElement
    })

    await manager.playSequential([
      'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/1.ogg',
      'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/2.ogg',
    ])

    expect(created.map((audio) => audio.src)).toEqual([
      'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/1.ogg',
      'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/2.ogg',
    ])
  })

  it('skips playback when muted', async () => {
    const create = vi.fn(() => mockAudio() as unknown as HTMLAudioElement)
    const manager = new CryAudioManager(create)
    manager.setMuted(true)
    await manager.playCry({ url: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/1.ogg' })
    expect(create).not.toHaveBeenCalled()
  })

  it('handles missing urls and play failures without throwing', async () => {
    const audio = mockAudio()
    audio.play.mockRejectedValueOnce(new Error('blocked'))
    const manager = new CryAudioManager(() => audio as unknown as HTMLAudioElement)
    await expect(manager.playCry({ url: null })).resolves.toBeUndefined()
    await expect(
      manager.playCry({
        url: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/1.ogg',
      }),
    ).resolves.toBeUndefined()
  })
})
