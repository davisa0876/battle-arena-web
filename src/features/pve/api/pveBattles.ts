import { apiClient } from '../../../shared/lib/api/client'
import { unwrapData } from '../../../shared/lib/api/parse'
import type { AttackResponse, PveBattle } from '../types/battle'

function newKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function startPveBattle(ownedCreatureId: number, difficulty = 'normal'): Promise<PveBattle> {
  const payload = await apiClient.post<unknown>('/api/pve/battles', {
    owned_creature_id: ownedCreatureId,
    difficulty,
  })
  return unwrapData(payload) as PveBattle
}

export async function fetchPveBattle(battleId: string, signal?: AbortSignal): Promise<PveBattle> {
  const payload = await apiClient.get<unknown>(`/api/pve/battles/${encodeURIComponent(battleId)}`, signal)
  return unwrapData(payload) as PveBattle
}

export async function submitPveAttack(
  battleId: string,
  body: { move_id?: number; basic_strike?: boolean; recover?: boolean; expected_version: number },
): Promise<AttackResponse> {
  const payload = await apiClient.post<unknown>(`/api/pve/battles/${encodeURIComponent(battleId)}/attack`, {
    ...body,
    idempotency_key: newKey('atk'),
  })
  return unwrapData(payload) as AttackResponse
}

export async function submitPveDefense(
  battleId: string,
  body: { defense: string; expected_version: number },
): Promise<AttackResponse> {
  const payload = await apiClient.post<unknown>(`/api/pve/battles/${encodeURIComponent(battleId)}/defend`, {
    ...body,
    idempotency_key: newKey('def'),
  })
  return unwrapData(payload) as AttackResponse
}

export async function abandonPveBattle(battleId: string): Promise<AttackResponse> {
  const payload = await apiClient.post<unknown>(
    `/api/pve/battles/${encodeURIComponent(battleId)}/abandon`,
    {},
  )
  return unwrapData(payload) as AttackResponse
}
