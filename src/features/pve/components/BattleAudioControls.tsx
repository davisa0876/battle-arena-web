import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getBattleBgmManager } from '../../../shared/lib/audio/battleBgmManager'
import { getCryAudioManager } from '../../../shared/lib/audio/cryAudioManager'
import { resolveCryUrl } from '../../../shared/lib/audio/battleAudioSettings'
import type { BattleCombatantView } from '../types/battle'

interface BattleAudioControlsProps {
  player: BattleCombatantView
  opponent: BattleCombatantView
}

export function BattleAudioControls({ player, opponent }: BattleAudioControlsProps) {
  const { t } = useTranslation('pve')
  const audio = getCryAudioManager()
  const bgm = getBattleBgmManager()
  const [settings, setSettings] = useState(() => audio.getSettings())

  useEffect(() => {
    setSettings(audio.getSettings())
  }, [audio])

  const refresh = () => setSettings(audio.getSettings())

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-arena-300">
      {!settings.unlocked && (
        <button
          type="button"
          className="rounded-lg border border-electric/40 bg-electric/10 px-3 py-1.5 text-xs font-semibold text-electric"
          onClick={() => {
            void audio.unlockFromGesture().then(() => {
              void bgm.play()
              refresh()
            })
          }}
        >
          {t('audio.enable')}
        </button>
      )}
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={!settings.muted}
          onChange={(event) => {
            audio.setMuted(!event.target.checked)
            refresh()
          }}
        />
        <span>{t('audio.sound')}</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.musicEnabled}
          disabled={settings.muted}
          onChange={(event) => {
            bgm.setMusicEnabled(event.target.checked)
            refresh()
          }}
        />
        <span>{t('audio.music')}</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <span>{t('audio.volume')}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(settings.volume * 100)}
          disabled={settings.muted}
          onChange={(event) => {
            audio.setVolume(Number(event.target.value) / 100)
            refresh()
          }}
        />
      </label>
      <button
        type="button"
        className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40"
        disabled={settings.muted}
        onClick={() => {
          void audio.playCry({
            url: resolveCryUrl(player.cry_latest_url, player.cry_legacy_url, player.cry_url),
          })
        }}
      >
        {t('audio.replayPlayer')}
      </button>
      <button
        type="button"
        className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40"
        disabled={settings.muted}
        onClick={() => {
          void audio.playCry({
            url: resolveCryUrl(opponent.cry_latest_url, opponent.cry_legacy_url, opponent.cry_url),
          })
        }}
      >
        {t('audio.replayOpponent')}
      </button>
    </div>
  )
}
