import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLoading } from '../../../shared/components/feedback/PageLoading'
import { toUserFacingMessage } from '../../../shared/lib/api/userFacingError'
import { getBattleBgmManager } from '../../../shared/lib/audio/battleBgmManager'
import { playAttackSfx, playOutcomeSfx } from '../../../shared/lib/audio/battleSfx'
import { getCryAudioManager } from '../../../shared/lib/audio/cryAudioManager'
import { fetchMyCreatures } from '../../collection/api/collection'
import type { OwnedCreature } from '../../collection/types'
import { CreatureImage } from '../../creatures/components/CreatureImage'
import {
  abandonPveBattle,
  fetchPveBattle,
  startPveBattle,
  submitPveAttack,
  submitPveDefense,
} from '../api/pveBattles'
import { fetchMe } from '../../auth/api/auth'
import { XpProgressBar } from '../../profile/components/XpProgressBar'
import type { TrainerProgress } from '../../profile/types'
import { BattleAudioControls } from '../components/BattleAudioControls'
import { Battlefield } from '../components/Battlefield'
import { CombatExchangeLog } from '../components/CombatExchangeLog'
import { DefenseSelectionPanel } from '../components/DefenseSelectionPanel'
import { MoveSelectionPanel } from '../components/MoveSelectionPanel'
import { PveRecordSummary } from '../components/PveRecordSummary'
import { initialIntroState, runBattleIntro, type BattleIntroState } from '../lib/battleIntroController'
import type { PveBattle, PveRecord } from '../types/battle'

type Screen =
  | {
      status: 'pick'
      creatures: OwnedCreature[]
      selectedId: number | null
      record: PveRecord | null
      progress: TrainerProgress | null
    }
  | { status: 'loading' }
  | { status: 'ready'; battle: PveBattle; busy: boolean; error: string | null; playIntro: boolean }
  | { status: 'error'; message: string }

export function PveBattlePage() {
  const { t } = useTranslation('pve')
  const [params] = useSearchParams()
  const resumeId = params.get('battle')
  const [screen, setScreen] = useState<Screen>({ status: 'loading' })
  const [intro, setIntro] = useState<BattleIntroState>(() => initialIntroState(true))
  const introRanFor = useRef<string | null>(null)

  const loadPicker = useCallback(async () => {
    setScreen({ status: 'loading' })
    try {
      const [creatures, me] = await Promise.all([fetchMyCreatures(), fetchMe().catch(() => null)])
      setScreen({
        status: 'pick',
        creatures,
        selectedId: creatures.find((c) => c.is_active)?.id ?? creatures[0]?.id ?? null,
        record: me?.pve_record ?? null,
        progress: me?.progress ?? null,
      })
    } catch (error) {
      setScreen({
        status: 'error',
        message: toUserFacingMessage(error, t('errors.loadCollection')),
      })
    }
  }, [t])

  const hydrateBattle = useCallback(async (battleId: string) => {
    setScreen({ status: 'loading' })
    try {
      const battle = await fetchPveBattle(battleId)
      introRanFor.current = battle.id
      setIntro(initialIntroState(true))
      setScreen({ status: 'ready', battle, busy: false, error: null, playIntro: false })
    } catch (error) {
      setScreen({
        status: 'error',
        message: toUserFacingMessage(error, t('errors.loadBattle')),
      })
    }
  }, [t])

  useEffect(() => {
    if (resumeId) {
      void hydrateBattle(resumeId)
      return
    }
    void loadPicker()
  }, [hydrateBattle, loadPicker, resumeId])

  useEffect(() => {
    if (screen.status !== 'ready' || !screen.playIntro) return
    if (introRanFor.current === screen.battle.id) return

    introRanFor.current = screen.battle.id
    const audio = getCryAudioManager()
    const controller = new AbortController()
    setIntro(initialIntroState(false))

    void runBattleIntro({
      audio,
      opponent: screen.battle.opponent,
      player: screen.battle.player,
      signal: controller.signal,
      startedMessage: t('intro.started'),
      onUpdate: setIntro,
    }).then(() => {
      setScreen((current) =>
        current.status === 'ready' ? { ...current, playIntro: false } : current,
      )
    })

    return () => {
      controller.abort()
      audio.stop()
    }
  }, [screen, t])

  useEffect(() => {
    return () => {
      getCryAudioManager().stop()
      getBattleBgmManager().stop()
    }
  }, [])

  useEffect(() => {
    if (screen.status !== 'ready') {
      getBattleBgmManager().stop()
      return
    }
    void getBattleBgmManager().play()
  }, [screen.status])

  const start = async () => {
    if (screen.status !== 'pick' || screen.selectedId == null) return
    setScreen({ status: 'loading' })
    try {
      await getCryAudioManager().unlockFromGesture()
      const battle = await startPveBattle(screen.selectedId, 'normal')
      void getBattleBgmManager().play()
      introRanFor.current = null
      setIntro(initialIntroState(false))
      setScreen({ status: 'ready', battle, busy: false, error: null, playIntro: true })
      window.history.replaceState(null, '', `/pve?battle=${encodeURIComponent(battle.id)}`)
    } catch (error) {
      setScreen({
        status: 'error',
        message: toUserFacingMessage(error, t('errors.start')),
      })
    }
  }

  const withBusy = async (
    action: () => Promise<{ battle: PveBattle }>,
    opts?: { attackSfx?: boolean },
  ) => {
    if (screen.status !== 'ready' || screen.busy || !intro.controlsEnabled) return
    const previousPhase = screen.battle.phase
    setScreen({ ...screen, busy: true, error: null })
    if (opts?.attackSfx) {
      void playAttackSfx()
    }
    try {
      const result = await action()
      setScreen({ status: 'ready', battle: result.battle, busy: false, error: null, playIntro: false })
      if (previousPhase !== 'finished' && result.battle.phase === 'finished') {
        void playOutcomeSfx(result.battle.outcome)
        if (result.battle.outcome === 'win' || result.battle.outcome === 'loss') {
          getBattleBgmManager().stop()
        }
      }
    } catch (error) {
      setScreen((current) =>
        current.status === 'ready'
          ? {
              ...current,
              busy: false,
              error: toUserFacingMessage(error, t('errors.action')),
            }
          : current,
      )
    }
  }

  const attackFallback = useMemo(() => {
    if (screen.status !== 'ready') {
      return { canBasicStrike: false, canRecoverSkip: false }
    }
    const moves = screen.battle.player.moves ?? []
    const anyUsable = moves.some((move) => move.can_use)
    const anyPp = moves.some((move) => move.pp.current > 0)
    return {
      canBasicStrike: !anyUsable && !anyPp,
      canRecoverSkip: !anyUsable && anyPp,
    }
  }, [screen])

  const leaveBattle = async () => {
    if (screen.status !== 'ready') {
      void loadPicker()
      return
    }
    const battleId = screen.battle.id
    const wasActive = screen.battle.phase !== 'finished'
    getCryAudioManager().stop()
    getBattleBgmManager().stop()
    if (wasActive) {
      try {
        await abandonPveBattle(battleId)
      } catch {
        // Best-effort: starting a new battle also forfeits any leftover active match.
      }
    }
    window.history.replaceState(null, '', '/pve')
    introRanFor.current = null
    void loadPicker()
  }

  useEffect(() => {
    if (screen.status !== 'ready' || screen.battle.phase === 'finished') return
    const battleId = screen.battle.id
    const onLeave = () => {
      void abandonPveBattle(battleId).catch(() => undefined)
    }
    window.addEventListener('pagehide', onLeave)
    return () => {
      window.removeEventListener('pagehide', onLeave)
    }
  }, [screen])

  if (screen.status === 'loading') {
    return <PageLoading label={t('loading')} />
  }

  if (screen.status === 'error') {
    return (
      <div className="mx-auto w-[min(720px,calc(100%-2rem))] py-10">
        <p className="text-signal-bad">{screen.message}</p>
        <button type="button" className="mt-4 text-ember" onClick={() => void loadPicker()}>
          {t('retry')}
        </button>
      </div>
    )
  }

  if (screen.status === 'pick') {
    return (
      <div className="mx-auto w-[min(720px,calc(100%-2rem))] py-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ember">{t('eyebrow')}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-white">{t('title')}</h1>
        <p className="mt-3 text-arena-300/80">{t('pickDescription')}</p>
        {screen.progress ? (
          <div className="mt-4 rounded-[20px] border border-border bg-surface/70 p-4">
            <XpProgressBar progress={screen.progress} />
          </div>
        ) : null}
        <div className="mt-4">
          <PveRecordSummary record={screen.record} />
        </div>
        {screen.creatures.length === 0 ? (
          <p className="mt-6 text-arena-300">
            {t('emptyCollection')}{' '}
            <Link to="/my-collection" className="text-ember">
              {t('goCollection')}
            </Link>
          </p>
        ) : (
          <>
            <ul className="mt-6 grid list-none gap-3 p-0">
              {screen.creatures.map((owned) => (
                <li key={owned.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-3 ${
                      screen.selectedId === owned.id ? 'border-ember bg-ember/10' : 'border-border bg-surface/70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="owned"
                      className="shrink-0"
                      checked={screen.selectedId === owned.id}
                      onChange={() => setScreen({ ...screen, selectedId: owned.id })}
                    />
                    <CreatureImage
                      src={owned.creature.image_url ?? owned.creature.image_ref}
                      alt={owned.creature.name}
                      className="aspect-square w-20 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block font-display text-lg text-white">{owned.creature.name}</span>
                      <span className="mt-1 block text-sm text-arena-300/80">
                        {t('level', { level: owned.level })}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={screen.selectedId == null}
              onClick={() => void start()}
              className="mt-6 rounded-xl border border-ember bg-ember px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t('start')}
            </button>
          </>
        )}
      </div>
    )
  }

  const { battle, busy, error } = screen
  const actionsLocked = busy || !intro.controlsEnabled
  const phaseTone =
    battle.phase === 'awaiting_player_attack'
      ? 'border-signal-ok/40 bg-signal-ok/15 text-signal-ok'
      : battle.phase === 'awaiting_player_defense'
        ? 'border-electric/40 bg-electric/15 text-electric'
        : 'border-border bg-surface text-arena-300'

  return (
    <div className="mx-auto flex w-[min(1180px,calc(100%-2rem))] flex-col gap-3 py-4 sm:gap-4 sm:py-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.18em] text-ember">{t('eyebrow')}</p>
          <h1 className="m-0 mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">{t('title')}</h1>
          <div className="mt-3">
            <PveRecordSummary record={battle.record} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-electric/35 bg-electric/10 px-3 py-1 text-xs font-bold text-electric">
            {t('badge.round', { round: battle.round })}
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${phaseTone}`}>
            {t(`phases.${battle.phase}`)}
          </span>
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-sm font-semibold text-ember"
            onClick={() => void leaveBattle()}
          >
            {t('leave')}
          </button>
        </div>
      </header>

      <BattleAudioControls player={battle.player} opponent={battle.opponent} />

      {intro.message && (
        <p className="m-0 rounded-xl border border-signal-ok/30 bg-signal-ok/10 px-3 py-2 text-sm font-semibold text-signal-ok">
          {intro.message}
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)] lg:items-start lg:gap-4">
        <Battlefield
          player={battle.player}
          opponent={battle.opponent}
          showOpponent={intro.showOpponent}
          showPlayer={intro.showPlayer}
          outcome={battle.phase === 'finished' ? battle.outcome : null}
        />
        <CombatExchangeLog entries={battle.combat_log ?? []} />
      </div>

      {/* In-flow dock: always visible after the arena, never covers HP/sprites. */}
      <div className="sticky bottom-0 z-20 rounded-[20px] border border-border bg-surface/95 p-3 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-4">
        {battle.phase === 'awaiting_player_attack' && (
          <MoveSelectionPanel
            moves={battle.player.moves ?? []}
            disabled={actionsLocked}
            canBasicStrike={attackFallback.canBasicStrike}
            canRecoverSkip={attackFallback.canRecoverSkip}
            onAttack={(moveId) =>
              void withBusy(
                () => submitPveAttack(battle.id, { move_id: moveId, expected_version: battle.version }),
                { attackSfx: true },
              )
            }
            onBasicStrike={() =>
              void withBusy(
                () =>
                  submitPveAttack(battle.id, { basic_strike: true, expected_version: battle.version }),
                { attackSfx: true },
              )
            }
            onRecoverSkip={() =>
              void withBusy(() =>
                submitPveAttack(battle.id, { recover: true, expected_version: battle.version }),
              )
            }
          />
        )}
        {battle.phase === 'awaiting_player_defense' && (
          <DefenseSelectionPanel
            disabled={actionsLocked}
            onDefend={(defense) =>
              void withBusy(() =>
                submitPveDefense(battle.id, { defense, expected_version: battle.version }),
              )
            }
          />
        )}
        {battle.phase === 'finished' && (
          <div>
            <h3 className="m-0 font-display text-2xl text-white">
              {battle.outcome === 'win'
                ? t('result.win')
                : battle.end_reason === 'abandoned'
                  ? t('result.gaveUp')
                  : t('result.loss')}
            </h3>
            {battle.reward && (
              <p className="mt-2 text-arena-300">{t('result.xp', { xp: battle.reward.xp_awarded })}</p>
            )}
            <div className="mt-3">
              <PveRecordSummary record={battle.record} />
            </div>
            <button
              type="button"
              className="mt-4 rounded-xl border border-ember bg-ember px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                window.history.replaceState(null, '', '/pve')
                introRanFor.current = null
                void loadPicker()
              }}
            >
              {t('result.again')}
            </button>
          </div>
        )}
        {!intro.controlsEnabled && battle.phase !== 'finished' && (
          <p className="mt-2 text-sm text-arena-300/70">{t('intro.preparing')}</p>
        )}
        {error && (
          <p className="mt-3 text-sm text-signal-bad" role="alert">
            {error}
          </p>
        )}
        {busy && <p className="mt-3 text-sm text-arena-300/70">{t('resolving')}</p>}
      </div>
    </div>
  )
}
