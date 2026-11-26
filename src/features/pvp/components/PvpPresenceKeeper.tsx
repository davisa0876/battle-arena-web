import { useAuth } from '../../auth'
import { usePvpPresenceSession } from '../hooks/usePvpPresenceSession'
import { isPvpPresenceEligible } from '../lib/isPvpPresenceEligible'

/**
 * Global PvP presence heartbeat for any authenticated, PvP-eligible trainer.
 * Mount once in the app shell — not only on `/pvp`.
 */
export function PvpPresenceKeeper() {
  const { status, user } = useAuth()
  const enabled = status === 'authenticated' && isPvpPresenceEligible(user)
  usePvpPresenceSession(enabled)
  return null
}
