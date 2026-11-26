import type { PvpBattle, PvpBattleMove } from '../types/battle'

export function attackFallback(moves: PvpBattleMove[] | undefined, allowed: string[]) {
  const list = moves ?? []
  const anyUsable = list.some((move) => move.can_use)
  const anyPp = list.some((move) => move.pp.current > 0)
  return {
    canBasicStrike: allowed.includes('basic_strike') && !anyUsable && !anyPp,
    canRecoverSkip: allowed.includes('recover') && !anyUsable && anyPp,
    canAttackMove: allowed.includes('attack') && anyUsable,
  }
}

export function viewerOutcome(battle: PvpBattle): 'win' | 'loss' | null {
  const meId = battle.me?.user_id
  if (!battle.outcome || meId == null) return null
  if (battle.outcome.winner_user_id === meId) return 'win'
  if (battle.outcome.loser_user_id === meId) return 'loss'
  return null
}

export function myXp(battle: PvpBattle): number | null {
  const meId = battle.me?.user_id
  if (meId == null || !battle.rewards) return null
  const row = battle.rewards.find((r) => r.user_id === meId)
  return row ? row.xp_awarded : null
}

export function canSubmitAction(battle: PvpBattle, action: string): boolean {
  return battle.phase !== 'finished' && battle.allowed_actions.includes(action)
}
