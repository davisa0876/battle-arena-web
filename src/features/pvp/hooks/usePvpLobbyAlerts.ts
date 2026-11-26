import { useCallback, useEffect, useRef, useState } from 'react'
import {
  acceptPvpInvitation,
  declinePvpInvitation,
  fetchCurrentPvpLobby,
  issueRealtimeTicket,
  listPvpInvitations,
} from '../api/pvpLobbies'
import { detectDeclinedSentInvites } from '../lib/detectDeclinedSentInvites'
import { PvpRealtimeSession } from '../lib/pvpRealtimeSession'
import type { PvpInvitation, PvpRoom } from '../types'

export type IncomingInviteAlert = {
  kind: 'incoming'
  invite: PvpInvitation
}

export type AcceptedInviteAlert = {
  kind: 'accepted'
  roomId: string
  handle: string
  room: PvpRoom
}

export type DeclinedInviteAlert = {
  kind: 'declined'
  invitationId: string
  handle: string
}

export type PvpLobbyAlert = IncomingInviteAlert | AcceptedInviteAlert | DeclinedInviteAlert

function isActionableIncoming(invite: PvpInvitation): boolean {
  if (invite.status !== 'pending') {
    return false
  }
  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) {
    return false
  }
  return invite.allowed_actions.includes('accept')
}

function opponentHandle(room: PvpRoom, viewerId?: number): string {
  const other = room.members.find((member) => member.user_id !== viewerId)
  return other?.player?.handle ?? other?.player?.display_name ?? room.invitation?.invitee?.handle ?? 'trainer'
}

/**
 * Global PvP alerts:
 * - incoming pending invites (invitee; many allowed)
 * - accepted → ready lobby via GET /pvp/lobby (host)
 * - declined → ephemeral toast from WS status (inbox is pending-only)
 */
export function usePvpLobbyAlerts(enabled: boolean, viewerUserId?: number | null) {
  const [alerts, setAlerts] = useState<PvpLobbyAlert[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const sessionRef = useRef<PvpRealtimeSession | null>(null)
  const pendingSentRef = useRef<Map<string, string>>(new Map())
  const primedSentRef = useRef(false)
  const dismissedDeclinedRef = useRef<Set<string>>(new Set())
  const dismissedAcceptedRef = useRef<Set<string>>(new Set())
  const declinedRef = useRef<DeclinedInviteAlert[]>([])
  const pendingDeclineHintRef = useRef<{ invitationId: string; status?: string } | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setAlerts([])
      return
    }

    try {
      const declineHint = pendingDeclineHintRef.current
      pendingDeclineHintRef.current = null

      const [received, sent, lobby] = await Promise.all([
        listPvpInvitations('received'),
        listPvpInvitations('sent'),
        fetchCurrentPvpLobby(),
      ])

      const incoming: PvpLobbyAlert[] = received.filter(isActionableIncoming).map((invite) => ({
        kind: 'incoming',
        invite,
      }))

      const accepted: PvpLobbyAlert[] = []
      const isHost =
        viewerUserId != null &&
        (lobby?.host?.id === viewerUserId ||
          lobby?.members.some((member) => member.user_id === viewerUserId && member.role === 'host'))
      if (
        lobby &&
        isHost &&
        (lobby.status === 'ready' || lobby.status === 'in_battle') &&
        !dismissedAcceptedRef.current.has(lobby.id)
      ) {
        accepted.push({
          kind: 'accepted',
          roomId: lobby.id,
          handle: opponentHandle(lobby, viewerUserId),
          room: lobby,
        })
      }

      const detected = detectDeclinedSentInvites({
        sent,
        previousPending: pendingSentRef.current,
        primed: primedSentRef.current,
        dismissedIds: dismissedDeclinedRef.current,
        declinedHint: declineHint,
      })
      pendingSentRef.current = detected.nextPending
      primedSentRef.current = detected.primed
      for (const item of detected.declined) {
        if (!declinedRef.current.some((alert) => alert.invitationId === item.invitationId)) {
          declinedRef.current = [
            ...declinedRef.current,
            { kind: 'declined', invitationId: item.invitationId, handle: item.handle },
          ]
        }
      }
      declinedRef.current = declinedRef.current.filter(
        (alert) => !dismissedDeclinedRef.current.has(alert.invitationId),
      )

      setAlerts([...incoming, ...accepted, ...declinedRef.current])
      setError('')
    } catch {
      // Keep last known alerts; banner is best-effort.
    }
  }, [enabled, viewerUserId])

  useEffect(() => {
    if (!enabled) {
      setAlerts([])
      primedSentRef.current = false
      pendingSentRef.current = new Map()
      return
    }

    void refresh()
    const poll = window.setInterval(() => {
      void refresh()
    }, 15_000)

    const session = new PvpRealtimeSession({
      issueTicket: issueRealtimeTicket,
      issueGrant: async () => ({ grant: '' }),
      onHint: (hint) => {
        if (hint.type === 'pvp.invitation.changed' && hint.invitationId && hint.invitationStatus) {
          pendingDeclineHintRef.current = {
            invitationId: hint.invitationId,
            status: hint.invitationStatus,
          }
        }
        if (
          hint.type === 'pvp.invitation.changed' ||
          hint.type === 'pvp.room.changed' ||
          hint.type === 'pvp.battle.changed'
        ) {
          void refresh()
        }
      },
    })
    sessionRef.current = session
    void session.connect().catch(() => undefined)

    return () => {
      window.clearInterval(poll)
      session.close()
      sessionRef.current = null
    }
  }, [enabled, refresh])

  const accept = useCallback(
    async (id: string): Promise<PvpRoom | null> => {
      setBusyId(id)
      setError('')
      try {
        const room = await acceptPvpInvitation(id)
        await refresh()
        return room
      } catch (err) {
        setError(err instanceof Error ? err.message : 'accept_failed')
        await refresh()
        return null
      } finally {
        setBusyId(null)
      }
    },
    [refresh],
  )

  const decline = useCallback(
    async (id: string): Promise<boolean> => {
      setBusyId(id)
      setError('')
      try {
        await declinePvpInvitation(id)
        await refresh()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'decline_failed')
        await refresh()
        return false
      } finally {
        setBusyId(null)
      }
    },
    [refresh],
  )

  const dismissDeclined = useCallback((invitationId: string) => {
    dismissedDeclinedRef.current.add(invitationId)
    declinedRef.current = declinedRef.current.filter((alert) => alert.invitationId !== invitationId)
    setAlerts((current) =>
      current.filter((alert) => !(alert.kind === 'declined' && alert.invitationId === invitationId)),
    )
  }, [])

  const dismissAccepted = useCallback((roomId: string) => {
    dismissedAcceptedRef.current.add(roomId)
    setAlerts((current) => current.filter((alert) => !(alert.kind === 'accepted' && alert.roomId === roomId)))
  }, [])

  return { alerts, busyId, error, refresh, accept, decline, dismissDeclined, dismissAccepted }
}
