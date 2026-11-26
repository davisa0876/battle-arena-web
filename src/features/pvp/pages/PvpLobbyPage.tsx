import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLoading } from '../../../shared/components/feedback/PageLoading'
import { toUserFacingMessage } from '../../../shared/lib/api/userFacingError'
import { fetchMyCreatures } from '../../collection/api/collection'
import type { OwnedCreature } from '../../collection/types'
import { CreatureImage } from '../../creatures/components/CreatureImage'
import { readyPvpRoom, selectPvpCreature } from '../api/pvpBattles'
import {
  acceptPvpInvitation,
  cancelPvpInvitation,
  createPvpRoom,
  declinePvpInvitation,
  fetchPvpRoom,
  issuePvpRoomGrant,
  issueRealtimeTicket,
  leavePvpRoom,
  listPvpInvitations,
} from '../api/pvpLobbies'
import { PvpRealtimeSession } from '../lib/pvpRealtimeSession'
import type { PvpInvitation, PvpRoom } from '../types'

export function PvpLobbyPage() {
  const { t } = useTranslation('pvp')
  const navigate = useNavigate()
  const [handle, setHandle] = useState('')
  const [received, setReceived] = useState<PvpInvitation[]>([])
  const [sent, setSent] = useState<PvpInvitation[]>([])
  const [room, setRoom] = useState<PvpRoom | null>(null)
  const [creatures, setCreatures] = useState<OwnedCreature[]>([])
  const [selectedOwnedId, setSelectedOwnedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'ready' | 'closed' | 'error'>('connecting')
  const roomRef = useRef<PvpRoom | null>(null)
  const sessionRef = useRef<PvpRealtimeSession | null>(null)
  const readyKeyRef = useRef<string | null>(null)

  useEffect(() => {
    roomRef.current = room
  }, [room])

  const refresh = useCallback(async () => {
    setError('')
    const [inbox, outbox] = await Promise.all([
      listPvpInvitations('received'),
      listPvpInvitations('sent'),
    ])
    setReceived(inbox)
    setSent(outbox)
  }, [])

  const rehydrateRoom = useCallback(async (roomId: string) => {
    try {
      const next = await fetchPvpRoom(roomId)
      setRoom(next.status === 'closed' ? null : next)
      if (next.status !== 'closed' && sessionRef.current) {
        await sessionRef.current.subscribeRoom(next.id)
      }
    } catch {
      setRoom(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [owned] = await Promise.all([fetchMyCreatures(), refresh()])
        if (!cancelled) {
          setCreatures(owned)
          setSelectedOwnedId(owned.find((c) => c.is_active)?.id ?? owned[0]?.id ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(toUserFacingMessage(err, t('errors.loadFailed')))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh, t])

  useEffect(() => {
    const session = new PvpRealtimeSession({
      issueTicket: issueRealtimeTicket,
      issueGrant: issuePvpRoomGrant,
      onStatus: setRealtimeStatus,
      onHint: (hint) => {
        void (async () => {
          try {
            if (hint.type === 'pvp.invitation.changed') {
              await refresh()
              return
            }
            if (hint.type === 'room.subscription.revoked') {
              setRoom(null)
              await refresh()
              return
            }
            if ((hint.type === 'pvp.room.changed' || hint.type === 'pvp.battle.changed') && hint.roomId) {
              const current = roomRef.current
              if (
                hint.type === 'pvp.room.changed' &&
                current &&
                hint.version !== undefined &&
                hint.version <= current.version
              ) {
                return
              }
              await rehydrateRoom(hint.roomId)
              await refresh()
            }
          } catch {
            // REST rehydrate failures surface on next explicit action.
          }
        })()
      },
    })
    sessionRef.current = session
    void session.connect().catch(() => {
      setRealtimeStatus('error')
    })
    return () => {
      session.close()
      sessionRef.current = null
    }
  }, [refresh, rehydrateRoom])

  useEffect(() => {
    if (!room || realtimeStatus !== 'ready' || !sessionRef.current) {
      return
    }
    void sessionRef.current.subscribeRoom(room.id).catch(() => {
      // Grant failures are non-fatal; REST still works.
    })
  }, [room, realtimeStatus])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await createPvpRoom(handle.trim())
      setRoom(result.room)
      setHandle('')
      await refresh()
    } catch (err) {
      setError(toUserFacingMessage(err, t('errors.createFailed')))
    } finally {
      setBusy(false)
    }
  }

  async function onAccept(id: string) {
    setBusy(true)
    setError('')
    try {
      const next = await acceptPvpInvitation(id)
      setRoom(next)
      await refresh()
    } catch (err) {
      setError(toUserFacingMessage(err, t('errors.actionFailed')))
    } finally {
      setBusy(false)
    }
  }

  async function onDecline(id: string) {
    setBusy(true)
    setError('')
    try {
      await declinePvpInvitation(id)
      await refresh()
    } catch (err) {
      setError(toUserFacingMessage(err, t('errors.actionFailed')))
    } finally {
      setBusy(false)
    }
  }

  async function onCancel(id: string) {
    setBusy(true)
    setError('')
    try {
      await cancelPvpInvitation(id)
      setRoom(null)
      await refresh()
    } catch (err) {
      setError(toUserFacingMessage(err, t('errors.actionFailed')))
    } finally {
      setBusy(false)
    }
  }

  async function onLeave() {
    if (!room) return
    setBusy(true)
    setError('')
    try {
      await leavePvpRoom(room.id)
      setRoom(null)
      await refresh()
    } catch (err) {
      setError(toUserFacingMessage(err, t('errors.actionFailed')))
    } finally {
      setBusy(false)
    }
  }

  async function onRefreshRoom() {
    if (!room) return
    setBusy(true)
    setError('')
    try {
      await rehydrateRoom(room.id)
    } catch (err) {
      setError(toUserFacingMessage(err, t('errors.loadFailed')))
    } finally {
      setBusy(false)
    }
  }

  async function onSelectCreature(ownedId: number) {
    if (!room || busy) return
    setBusy(true)
    setError('')
    setSelectedOwnedId(ownedId)
    try {
      const next = await selectPvpCreature(room.id, {
        owned_creature_id: ownedId,
        expected_room_version: room.version,
      })
      await rehydrateRoom(next.id)
    } catch (err) {
      setError(toUserFacingMessage(err, t('errors.actionFailed')))
      await rehydrateRoom(room.id)
    } finally {
      setBusy(false)
    }
  }

  async function onReady() {
    if (!room || busy) return
    setBusy(true)
    setError('')
    const key = readyKeyRef.current ?? `pvp-ready-${room.id}`
    readyKeyRef.current = key
    try {
      const next = await readyPvpRoom(room.id, { expected_room_version: room.version }, key)
      readyKeyRef.current = null
      await rehydrateRoom(next.id)
      const battleId = next.battle_id ?? next.battle?.id
      if (battleId) {
        navigate(`/pvp/battles/${encodeURIComponent(battleId)}`)
      }
    } catch (err) {
      setError(toUserFacingMessage(err, t('errors.actionFailed')))
      await rehydrateRoom(room.id)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <PageLoading label={t('loading')} />
  }

  return (
    <div className="mx-auto w-[min(720px,calc(100%-2rem))] pb-24 pt-10">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ember">{t('eyebrow')}</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3rem)] font-bold tracking-[-0.04em] text-white">
        {t('title')}
      </h1>
      <p className="mt-3 text-arena-300/80">{t('subtitle')}</p>
      <p className="mt-2 text-sm text-arena-400">{t('phaseNote')}</p>
      <p className="mt-2 text-xs text-arena-500" aria-live="polite">
        {t('realtime.status', { status: realtimeStatus })}
      </p>

      {error ? (
        <p className="mt-6 rounded border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={onCreate} className="mt-8 space-y-3">
        <label className="block text-sm text-arena-200" htmlFor="invitee-handle">
          {t('form.handleLabel')}
        </label>
        <input
          id="invitee-handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-white"
          placeholder={t('form.handlePlaceholder')}
          minLength={3}
          maxLength={24}
          required
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || handle.trim().length < 3}
          className="rounded bg-ember px-4 py-2 font-semibold text-black disabled:opacity-50"
        >
          {t('form.submit')}
        </button>
      </form>

      <section className="mt-10">
        <h2 className="font-display text-xl text-white">{t('inbox.received')}</h2>
        <InvitationList
          items={received}
          empty={t('inbox.emptyReceived')}
          busy={busy}
          onAccept={onAccept}
          onDecline={onDecline}
          labels={{ accept: t('actions.accept'), decline: t('actions.decline') }}
        />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl text-white">{t('inbox.sent')}</h2>
        <InvitationList
          items={sent}
          empty={t('inbox.emptySent')}
          busy={busy}
          onCancel={onCancel}
          labels={{ cancel: t('actions.cancel') }}
        />
      </section>

      {room ? (
        <section className="mt-10 rounded border border-border bg-surface/60 p-5">
          <h2 className="font-display text-xl text-white">{t('lobby.title')}</h2>
          <p className="mt-2 text-sm text-arena-300">
            {t('lobby.status', { status: room.status })} · v{room.version}
          </p>
          <p className="mt-1 text-xs text-arena-400">{room.phase_note}</p>
          <ul className="mt-4 space-y-2">
            {room.members.map((member) => (
              <li key={`${member.user_id}-${member.role}`} className="text-arena-100">
                {member.player?.display_name ?? member.player?.handle ?? member.user_id}{' '}
                <span className="text-arena-400">({member.role})</span>
              </li>
            ))}
          </ul>

          {room.status === 'ready' || room.status === 'in_battle' ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-arena-200">{t('lobby.selectCreature')}</h3>
              {room.my_selection?.locked ? (
                <p className="mt-2 text-sm text-signal-ok">{t('lobby.locked')}</p>
              ) : (
                <ul className="mt-3 grid list-none gap-2 p-0">
                  {creatures.map((owned) => (
                    <li key={owned.id}>
                      <button
                        type="button"
                        disabled={busy || Boolean(room.my_selection?.locked)}
                        onClick={() => void onSelectCreature(owned.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${
                          (selectedOwnedId ?? room.my_selection?.owned_creature_id) === owned.id
                            ? 'border-ember bg-ember/10'
                            : 'border-border bg-surface/40'
                        }`}
                      >
                        <CreatureImage
                          src={owned.creature.image_url ?? owned.creature.image_ref}
                          alt={owned.creature.name}
                          className="aspect-square w-14 shrink-0"
                        />
                        <span className="text-white">{owned.creature.name}</span>
                        <span className="text-xs text-arena-400">Lv {owned.level}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-arena-300">
                {room.my_selection?.locked ? <span>{t('lobby.myReady')}</span> : null}
                {room.selections_revealed && room.selections_revealed.length >= 2 ? (
                  <span>{t('lobby.opponentReady')}</span>
                ) : room.my_selection?.locked ? (
                  <span>{t('lobby.waitingReady')}</span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="rounded border border-border px-3 py-2 text-sm" onClick={() => void onRefreshRoom()} disabled={busy}>
              {t('actions.refresh')}
            </button>
            {room.allowed_actions.includes('ready') ? (
              <button
                type="button"
                className="rounded bg-ember px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
                onClick={() => void onReady()}
                disabled={busy || !room.my_selection}
              >
                {t('lobby.ready')}
              </button>
            ) : null}
            {(room.battle_id || room.status === 'in_battle') && room.battle_id ? (
              <Link
                to={`/pvp/battles/${encodeURIComponent(room.battle_id)}`}
                className="rounded bg-ember px-3 py-2 text-sm font-semibold text-black"
              >
                {t('lobby.enterBattle')}
              </Link>
            ) : null}
            {room.allowed_actions.includes('leave') ? (
              <button type="button" className="rounded border border-border px-3 py-2 text-sm" onClick={() => void onLeave()} disabled={busy}>
                {t('actions.leave')}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function InvitationList(props: {
  items: PvpInvitation[]
  empty: string
  busy: boolean
  onAccept?: (id: string) => void
  onDecline?: (id: string) => void
  onCancel?: (id: string) => void
  labels: { accept?: string; decline?: string; cancel?: string }
}) {
  if (props.items.length === 0) {
    return <p className="mt-3 text-sm text-arena-400">{props.empty}</p>
  }

  return (
    <ul className="mt-3 space-y-3">
      {props.items.map((item) => (
        <li key={item.id} className="rounded border border-border bg-surface/40 px-4 py-3">
          <p className="text-sm text-white">
            {item.inviter?.handle} → {item.invitee?.handle}
          </p>
          <p className="text-xs text-arena-400">{item.status}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.allowed_actions.includes('accept') && props.onAccept ? (
              <button type="button" disabled={props.busy} className="rounded bg-ember px-3 py-1 text-xs font-semibold text-black" onClick={() => props.onAccept?.(item.id)}>
                {props.labels.accept}
              </button>
            ) : null}
            {item.allowed_actions.includes('decline') && props.onDecline ? (
              <button type="button" disabled={props.busy} className="rounded border border-border px-3 py-1 text-xs" onClick={() => props.onDecline?.(item.id)}>
                {props.labels.decline}
              </button>
            ) : null}
            {item.allowed_actions.includes('cancel') && props.onCancel ? (
              <button type="button" disabled={props.busy} className="rounded border border-border px-3 py-1 text-xs" onClick={() => props.onCancel?.(item.id)}>
                {props.labels.cancel}
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
