export interface CreatureType {
  id: number
  name: string
  slug: string
}

export interface CreatureBaseStats {
  hp: number
  attack: number
  defense: number
  special_attack: number
  special_defense: number
  speed: number
}

export interface Creature {
  id: number
  name: string
  slug: string
  height_cm: number | null
  weight_g: number | null
  image_ref: string | null
  image_url?: string | null
  types: CreatureType[]
  base_stats: CreatureBaseStats
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedCreatures {
  data: Creature[]
  meta: PaginationMeta
}

export interface CreatureDetailResponse {
  data: Creature
}

export interface CreatureTypesResponse {
  data: CreatureType[]
}

export interface CreatureListParams {
  search?: string
  type?: string
  page?: number
  per_page?: number
}
