import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLoading } from '../../../shared/components/feedback/PageLoading'
import { ApiError } from '../../../shared/lib/api/client'
import { toUserFacingMessage } from '../../../shared/lib/api/userFacingError'
import { getBattleBgmManager } from '../../../shared/lib/audio/battleBgmManager'
import { playAttackSfx, playOutcomeSfx } from '../../../shared/lib/audio/battleSfx'
import { Battlefield } from '../../pve/components/Battlefield'
import { BattleAudioControls } from '../../pve/components/BattleAudioControls'
import { DefenseSelectionPanel } from '../../pve/components/DefenseSelectionPanel'
import { MoveSelectionPanel } from '../../pve/components/MoveSelectionPanel'
import type { BattleCombatantView, BattleMove } from '../../pve/types/battle'
import {
  fetchPvpBattle,
  fetchPvpBattleEvents,
  newIdempotencyKey,
  submitPvpAttack,
  submitPvpDefend,
} from '../api/pvpBattles'
import { issuePvpRoomGrant, issueRealtimeTicket } from '../api/pvpLobbies'
import { attackFallback, myXp, viewerOutcome } from '../lib/pvpActionPolicy'
import { mergeEventsBySequence, narrativeFromEvents } from '../lib/pvpEventNarrative'
import { PvpRealtimeSession } from '../lib/pvpRealtimeSession'
import type { PvpBattle, PvpBattleEvent } from '../types/battle'

function toBattlefieldCombatant(c: NonNullable<PvpBattle['me']>, withMoves: boolean): BattleCombatantView {
  return {
    name: c.name,
    slug: c.slug,
    image_ref: c.image_ref,
    level: c.level,
    types: c.types,
    hp: c.hp,
    stamina: c.stamina,
    moves: withMoves
      ? (c.moves ?? []).map(
          (m): BattleMove => ({
            id: m.id,
            slug: m.slug ?? '',
            name: m.name ?? '',
            power: m.power ?? 0,
            accuracy: m.accuracy ?? 100,
            type: m.type_slug ?? '',
            damage_class: m.damage_class ?? 'physical',
            pp: m.pp,
            stamina_cost: m.stamina_cost,
            can_use: m.can_use,
          }),
        )
      : undefined,
  }
}

export function PvpBattlePage() {
  const { battleId = '' } = useParams()
  const { t } = useTranslation('pvp')
  const [battle, setBattle] = useState<PvpBattle | null>(null)
  const [events, setEvents] = useState<PvpBattleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'ready' | 'closed' | 'error'>('connecting')
  const battleRef = useRef<PvpBattle | null>(null)
  const pendingKeyRef = useRef<string | null>(null)
  const sessionRef = useRef<PvpRealtimeSession | null>(null)
  const introPlayedRef = useRef<string | null>(null)
  const hydrateInFlight = useRef(false)

  useEffect(() => {
    battleRef.current = battle
  }, [battle])

  const applyBattleIfNewer = useCallback((next: PvpBattle) => {
    setBattle((current) => {
      if (current && next.version < current.version) {
        return current
      }
      return next
    })
  }, [])

  const hydrate = useCallback(
    async (opts?: { forceEventsFrom?: number }) => {
      if (!battleId || hydrateInFlight.current) return
      hydrateInFlight.current = true
      try {
        const next = await fetchPvpBattle(battleId)
        applyBattleIfNewer(next)
        const after = opts?.forceEventsFrom ?? Math.max(0, (battleRef.current?.last_event_sequence ?? 0) - 5)
        const page = await fetchPvpBattleEvents(battleId, after)
        setEvents((prev) => {
          const merged = mergeEventsBySequence(prev, page)
          if (merged.gap) {
            void fetchPvpBattleEvents(battleId, 0).then((full) => {
              setEvents(full)
            })
          }
          return merged.events
        })
        setError('')
      } catch (err) {
        setError(toUserFacingMessage(err, t('errors.loadBattle')))
      } finally {
        hydrateInFlight.current = false
        setLoading(false)
      }
    },
    [applyBattleIfNewer, battleId, t],
  )

  useEffect(() => {
    void hydrate({ forceEventsFrom: 0 })
  }, [hydrate])

  useEffect(() => {
    if (!battle?.room_id) return
    const session = new PvpRealtimeSession({
      issueTicket: issueRealtimeTicket,
      issueGrant: issuePvpRoomGrant,
      onStatus: setRealtimeStatus,
      onHint: (hint) => {
        if (hint.type === 'pvp.battle.changed') {
          if (hint.battleId && hint.battleId !== battleId) return
          const current = battleRef.current
          if (current && hint.version !== undefined && hint.version <= current.version) return
          void hydrate()
          return
        }
        if (hint.type === 'pvp.room.changed' || hint.type === 'room.subscription.revoked') {
          void hydrate()
        }
      },
    })
    sessionRef.current = session
    void session
      .connect()
      .then(() => session.subscribeRoom(battle.room_id))
      .catch(() => setRealtimeStatus('error'))
    return () => {
      session.close()
      sessionRef.current = null
    }
  }, [battle?.room_id, battleId, hydrate])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void hydrate()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [hydrate])

  useEffect(() => {
    if (!battle || battle.phase === 'finished') return
    const timer = window.setInterval(() => {
      if (realtimeStatus !== 'ready') {
        void hydrate()
      }
    }, 15_000)
    return () => window.clearInterval(timer)
  }, [battle, hydrate, realtimeStatus])

  useEffect(() => {
    if (!battle) return
    if (introPlayedRef.current === battle.id) return
    introPlayedRef.current = battle.id
    void getBattleBgmManager().play()
  }, [battle])

  useEffect(() => {
    return () => {
      getBattleBgmManager().stop()
    }
  }, [])

  const fallback = useMemo(
    () => attackFallback(battle?.me?.moves, battle?.allowed_actions ?? []),
    [battle],
  )

  const runMutation = async (fn: (key: string) => Promise<PvpBattle>, sfx?: boolean) => {
    if (!battle || busy) return
    setBusy(true)
    setError('')
    if (sfx) void playAttackSfx()
    const key = pendingKeyRef.current ?? newIdempotencyKey('pvp-act')
    pendingKeyRef.current = key
    try {
      const next = await fn(key)
      pendingKeyRef.current = null
      applyBattleIfNewer(next)
      await hydrate()
      if (next.phase === 'finished') {
        void playOutcomeSfx(viewerOutcome(next))
        getBattleBgmManager().stop()
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        pendingKeyRef.current = null
        await hydrate()
        setError(toUserFacingMessage(err, t('errors.stale')))
      } else {
        // Keep same key for uncertain transport; clear on definite validation failure.
        if (err instanceof ApiError && (err.status === 422 || err.status === 403 || err.status === 404)) {
          pendingKeyRef.current = null
        }
        setError(toUserFacingMessage(err, t('errors.actionFailed')))
        await hydrate()
      }
    } finally {
      setBusy(false)
    }
  }

  const narrative = useMemo(() => narrativeFromEvents(events), [events])
  const outcome = battle ? viewerOutcome(battle) : null
  const xp = battle ? myXp(battle) : null

  if (loading && !battle) {
    return <PageLoading label={t('battle.loading')} />
  }

  if (!battle) {
    return (
      <div className="mx-auto w-[min(720px,calc(100%-2rem))] py-10">
        <p className="text-signal-bad" role="alert">
          {error || t('errors.loadBattle')}
        </p>
        <Link to="/pvp" className="mt-4 inline-block text-ember">
          {t('battle.backLobby')}
        </Link>
      </div>
    )
  }

  const meView = battle.me ? toBattlefieldCombatant(battle.me, true) : null
  const oppView = battle.opponent ? toBattlefieldCombatant(battle.opponent, false) : null
  const defending = battle.phase === 'awaiting_defense' && battle.allowed_actions.some((a) => ['endure', 'block', 'dodge', 'recover'].includes(a))
  const attacking = battle.phase === 'awaiting_attack' && (fallback.canAttackMove || fallback.canBasicStrike || fallback.canRecoverSkip)

  return (
    <div className="mx-auto flex w-[min(1180px,calc(100%-2rem))] flex-col gap-3 py-4 sm:gap-4 sm:py-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.18em] text-ember">{t('eyebrow')}</p>
          <h1 className="m-0 mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">{t('battle.title')}</h1>
          <p className="mt-2 text-sm text-arena-300" aria-live="polite">
            {t('battle.phase', { phase: battle.phase })} · {t('battle.turn', { turn: battle.turn_number })} ·{' '}
            {t('realtime.status', { status: realtimeStatus })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {meView && oppView ? <BattleAudioControls player={meView} opponent={oppView} /> : null}
          <button
            type="button"
            className="rounded border border-border px-3 py-2 text-sm text-white"
            onClick={() => void hydrate()}
            disabled={busy}
          >
            {t('actions.refresh')}
          </button>
          <Link to="/pvp" className="rounded border border-border px-3 py-2 text-sm text-white">
            {t('battle.backLobby')}
          </Link>
        </div>
      </header>

      {error ? (
        <p className="rounded border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}

      {battle.pending_attack && defending ? (
        <p className="rounded border border-electric/40 bg-electric/10 px-4 py-3 text-sm text-electric" aria-live="polite">
          {t('battle.pendingAttack', {
            move: battle.pending_attack.move_name ?? (battle.pending_attack.is_basic_strike ? t('battle.basicStrike') : '—'),
          })}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        {meView && oppView ? (
          <Battlefield player={meView} opponent={oppView} outcome={outcome} />
        ) : (
          <div className="rounded-[24px] border border-border bg-surface/60 p-6 text-arena-300">{t('battle.loading')}</div>
        )}
        <section
          className="flex h-[22rem] max-h-[22rem] min-h-0 w-full flex-col overflow-hidden rounded-[24px] border border-border bg-[#070d18]/90 p-4 font-mono text-sm"
          aria-live="polite"
        >
          <h3 className="m-0 mb-3 shrink-0 font-display text-base font-semibold tracking-wide text-white">{t('log.title')}</h3>
          {narrative.length === 0 ? (
            <p className="m-0 text-arena-300/70">{t('log.empty')}</p>
          ) : (
            <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-2 overflow-y-auto p-0 pr-1">
              {[...narrative].reverse().map((row) => (
                <li key={row.id} className="shrink-0 text-arena-100">
                  {t(row.textKey, row.params)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {battle.phase === 'finished' ? (
        <section className="rounded-[24px] border border-border bg-surface/70 p-5" aria-live="polite">
          <h2 className="font-display text-2xl text-white">
            {outcome === 'win' ? t('result.win') : outcome === 'loss' ? t('result.loss') : t('result.finished')}
          </h2>
          {typeof xp === 'number' ? <p className="mt-2 text-amber-300">{t('result.xp', { xp })}</p> : null}
          <Link to="/pvp" className="mt-4 inline-block rounded bg-ember px-4 py-2 font-semibold text-black">
            {t('battle.backLobby')}
          </Link>
        </section>
      ) : attacking ? (
        <MoveSelectionPanel
          moves={meView?.moves ?? []}
          disabled={busy}
          canBasicStrike={fallback.canBasicStrike}
          canRecoverSkip={fallback.canRecoverSkip}
          onAttack={(moveId) =>
            void runMutation(
              (key) => submitPvpAttack(battle.id, { move_id: moveId, expected_version: battle.version }, key),
              true,
            )
          }
          onBasicStrike={() =>
            void runMutation(
              (key) => submitPvpAttack(battle.id, { basic_strike: true, expected_version: battle.version }, key),
              true,
            )
          }
          onRecoverSkip={() =>
            void runMutation((key) =>
              submitPvpAttack(battle.id, { recover: true, expected_version: battle.version }, key),
            )
          }
        />
      ) : defending ? (
        <DefenseSelectionPanel
          disabled={busy}
          onDefend={(defense) =>
            void runMutation(async (key) => {
              const result = await submitPvpDefend(
                battle.id,
                { defense, expected_version: battle.version },
                key,
              )
              if (result.rewards) {
                applyBattleIfNewer({ ...result.battle, rewards: result.rewards })
              }
              return result.battle
            })
          }
        />
      ) : (
        <p className="rounded border border-border bg-surface/50 px-4 py-3 text-sm text-arena-300" aria-live="polite">
          {t('battle.waitingOpponent')}
        </p>
      )}
    </div>
  )
}
