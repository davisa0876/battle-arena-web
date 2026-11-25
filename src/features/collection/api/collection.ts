import { apiClient } from '../../../shared/lib/api/client'
import { normalizeOwnedCreature, normalizeOwnedCreatureList } from '../lib/normalizeCollection'
import { unwrapData } from '../../../shared/lib/api/parse'
import type { OwnedCreature } from '../types'

export async function fetchMyCreatures(signal?: AbortSignal): Promise<OwnedCreature[]> {
  return normalizeOwnedCreatureList(await apiClient.get<unknown>('/api/me/creatures', signal))
}

export async function fetchMyCreature(id: number, signal?: AbortSignal): Promise<OwnedCreature | null> {
  const payload = await apiClient.get<unknown>(`/api/me/creatures/${encodeURIComponent(String(id))}`, signal)
  return normalizeOwnedCreature(unwrapData(payload))
}

export async function selectStarter(creatureSlug: string): Promise<void> {
  await apiClient.post<unknown>('/api/me/starter', { creature_slug: creatureSlug })
}

/** Acquires an eligible catalog creature, consuming a stage selection entitlement. */
export async function acquireCreature(creatureSlug: string, idempotencyKey: string): Promise<void> {
  await apiClient.post<unknown>('/api/me/creatures/acquire', {
    creature_slug: creatureSlug,
    idempotency_key: idempotencyKey,
  })
}

export async function setActiveCreature(id: number): Promise<void> {
  await apiClient.patch<unknown>(`/api/me/creatures/${encodeURIComponent(String(id))}/select`)
}
