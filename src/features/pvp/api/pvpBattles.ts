import { apiClient } from '../../../shared/lib/api/client'
import { unwrapData } from '../../../shared/lib/api/parse'
import type { PvpBattle, PvpBattleEvent, PvpLobbyCombatState, PvpRewardRow } from '../types/battle'

export function newIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function selectPvpCreature(
  roomId: string,
  body: { owned_creature_id: number; expected_room_version: number },
  idempotencyKey = newIdempotencyKey('pvp-select'),
): Promise<PvpLobbyCombatState> {
  const payload = await apiClient.put<unknown>(`/api/pvp/rooms/${encodeURIComponent(roomId)}/selection`, {
    ...body,
    idempotency_key: idempotencyKey,
  })
  return unwrapData(payload) as PvpLobbyCombatState
}

export async function readyPvpRoom(
  roomId: string,
  body: { expected_room_version: number },
  idempotencyKey = newIdempotencyKey('pvp-ready'),
): Promise<PvpLobbyCombatState> {
  const payload = await apiClient.post<unknown>(`/api/pvp/rooms/${encodeURIComponent(roomId)}/ready`, {
    ...body,
    idempotency_key: idempotencyKey,
  })
  return unwrapData(payload) as PvpLobbyCombatState
}

export async function fetchPvpBattle(battleId: string, signal?: AbortSignal): Promise<PvpBattle> {
  const payload = await apiClient.get<unknown>(`/api/pvp/battles/${encodeURIComponent(battleId)}`, signal)
  return unwrapData(payload) as PvpBattle
}

export async function fetchPvpBattleEvents(
  battleId: string,
  afterSequence = 0,
  signal?: AbortSignal,
): Promise<PvpBattleEvent[]> {
  const payload = await apiClient.get<unknown>(
    `/api/pvp/battles/${encodeURIComponent(battleId)}/events?after_sequence=${afterSequence}`,
    signal,
  )
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: PvpBattleEvent[] }).data
  }
  return []
}

export type PvpAttackBody = {
  move_id?: number
  basic_strike?: boolean
  recover?: boolean
  expected_version: number
}

export async function submitPvpAttack(
  battleId: string,
  body: PvpAttackBody,
  idempotencyKey: string,
): Promise<PvpBattle> {
  const payload = await apiClient.post<unknown>(`/api/pvp/battles/${encodeURIComponent(battleId)}/attack`, {
    ...body,
    idempotency_key: idempotencyKey,
  })
  const data = unwrapData(payload) as PvpBattle | { battle: PvpBattle }
  return 'battle' in data ? data.battle : data
}

export async function submitPvpDefend(
  battleId: string,
  body: { defense: string; expected_version: number },
  idempotencyKey: string,
): Promise<{ battle: PvpBattle; rewards: PvpRewardRow[] | null }> {
  const payload = await apiClient.post<unknown>(`/api/pvp/battles/${encodeURIComponent(battleId)}/defend`, {
    ...body,
    idempotency_key: idempotencyKey,
  })
  const data = unwrapData(payload) as { battle: PvpBattle; rewards?: PvpRewardRow[] | null } | PvpBattle
  if (data && typeof data === 'object' && 'battle' in data) {
    return { battle: data.battle, rewards: data.rewards ?? null }
  }
  return { battle: data as PvpBattle, rewards: null }
}

export async function submitPvpForfeit(
  battleId: string,
  body: { expected_version: number },
  idempotencyKey: string,
): Promise<{ battle: PvpBattle; rewards: PvpRewardRow[] | null }> {
  const payload = await apiClient.post<unknown>(`/api/pvp/battles/${encodeURIComponent(battleId)}/forfeit`, {
    ...body,
    idempotency_key: idempotencyKey,
  })
  const data = unwrapData(payload) as { battle: PvpBattle; rewards?: PvpRewardRow[] | null } | PvpBattle
  if (data && typeof data === 'object' && 'battle' in data) {
    return { battle: data.battle, rewards: data.rewards ?? null }
  }
  return { battle: data as PvpBattle, rewards: null }
}
