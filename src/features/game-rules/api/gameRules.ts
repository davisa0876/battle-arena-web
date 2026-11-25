import { apiClient } from '../../../shared/lib/api/client'
import { normalizeGameRules } from '../lib/normalizeRules'
import type { GameRules } from '../types'

export async function fetchGameRules(signal?: AbortSignal): Promise<GameRules> {
  return normalizeGameRules(await apiClient.get<unknown>('/api/game/rules', signal))
}
