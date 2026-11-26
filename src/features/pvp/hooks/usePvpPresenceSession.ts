import { useEffect, useRef } from 'react'
import { issueRealtimeTicket } from '../api/pvpLobbies'
import { PvpRealtimeSession } from '../lib/pvpRealtimeSession'

/**
 * Keeps a ticket-authenticated WS open so battle-arena-realtime marks the trainer online.
 * Presence is account+eligibility based — not tied to the PvP lobby route.
 */
export function usePvpPresenceSession(enabled: boolean): void {
  const sessionRef = useRef<PvpRealtimeSession | null>(null)

  useEffect(() => {
    if (!enabled) {
      sessionRef.current?.close()
      sessionRef.current = null
      return
    }

    const session = new PvpRealtimeSession({
      issueTicket: issueRealtimeTicket,
      issueGrant: async () => ({ grant: '' }),
      onHint: () => {
        // Presence-only socket; lobby/battle screens own room subscriptions.
      },
    })
    sessionRef.current = session
    void session.connect().catch(() => undefined)

    return () => {
      session.close()
      if (sessionRef.current === session) {
        sessionRef.current = null
      }
    }
  }, [enabled])
}
