import { apiClient } from '../../../shared/lib/api/client'
import type {
  CreatureDetailResponse,
  CreatureListParams,
  CreatureTypesResponse,
  PaginatedCreatures,
} from '../types'

function toQuery(params: CreatureListParams): string {
  const searchParams = new URLSearchParams()

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim())
  }
  if (params.type?.trim()) {
    searchParams.set('type', params.type.trim())
  }
  if (params.page && params.page > 0) {
    searchParams.set('page', String(params.page))
  }
  if (params.per_page && params.per_page > 0) {
    searchParams.set('per_page', String(params.per_page))
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function fetchCreatures(
  params: CreatureListParams = {},
  signal?: AbortSignal,
): Promise<PaginatedCreatures> {
  return apiClient.get<PaginatedCreatures>(`/api/creatures${toQuery(params)}`, signal)
}

export async function fetchCreatureBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<CreatureDetailResponse> {
  return apiClient.get<CreatureDetailResponse>(`/api/creatures/${encodeURIComponent(slug)}`, signal)
}

export async function fetchCreatureTypes(signal?: AbortSignal): Promise<CreatureTypesResponse> {
  return apiClient.get<CreatureTypesResponse>('/api/creature-types', signal)
}
