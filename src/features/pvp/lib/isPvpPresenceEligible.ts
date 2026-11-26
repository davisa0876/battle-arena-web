import type { AuthUser } from '../../auth'

const DEFAULT_PVP_MIN_LEVEL = 6

/**
 * PvP online presence is for signed-in trainers who already meet the PvP level gate.
 * Being on `/pvp` is NOT required — any authenticated screen counts.
 */
export function isPvpPresenceEligible(user: AuthUser | null | undefined): boolean {
  if (!user) {
    return false
  }

  const unlocked = user.progress?.pvp_level_unlocked
  if (typeof unlocked === 'boolean') {
    return unlocked
  }

  return (user.progress?.level ?? 1) >= DEFAULT_PVP_MIN_LEVEL
}
