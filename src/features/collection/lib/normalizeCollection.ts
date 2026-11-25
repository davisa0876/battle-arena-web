import {
  asArray,
  asRecord,
  isRecord,
  readBoolean,
  readNullableString,
  readNumber,
  readString,
  unwrapData,
} from '../../../shared/lib/api/parse'
import type { Creature, CreatureType } from '../../creatures/types'
import type { EvolutionOption, OwnedCreature } from '../types'

function normalizeType(raw: unknown): CreatureType | null {
  const record = asRecord(raw)
  const name = readString(record.name)
  return name === '' ? null : { id: readNumber(record.id), name, slug: readString(record.slug, name.toLowerCase()) }
}

export function normalizeCreature(raw: unknown): Creature | null {
  const record = asRecord(raw)
  const slug = readString(record.slug)

  if (slug === '') {
    return null
  }

  const stats = asRecord(record.base_stats)

  return {
    id: readNumber(record.id),
    name: readString(record.name, slug),
    slug,
    height_cm: record.height_cm == null ? null : readNumber(record.height_cm),
    weight_g: record.weight_g == null ? null : readNumber(record.weight_g),
    image_ref: readNullableString(record.image_ref),
    image_url: readNullableString(record.image_url),
    evolution_stage: readNumber(record.evolution_stage, 1),
    types: asArray(record.types).map(normalizeType).filter((type): type is CreatureType => type !== null),
    base_stats: {
      hp: readNumber(stats.hp),
      attack: readNumber(stats.attack),
      defense: readNumber(stats.defense),
      special_attack: readNumber(stats.special_attack),
      special_defense: readNumber(stats.special_defense),
      speed: readNumber(stats.speed),
    },
  }
}

function normalizeEvolutionOption(raw: unknown): EvolutionOption | null {
  const record = asRecord(raw)
  const nested = normalizeCreature(record.creature)
  // Tolerate evolution lists that are plain creatures (always locked for now).
  const creature = nested ?? normalizeCreature(record)

  if (!creature) {
    return null
  }

  const eligible = readBoolean(record.eligible)

  return {
    creature,
    eligible,
    locked: readBoolean(record.locked, !eligible),
    reason_code: readNullableString(record.reason_code ?? record.reason),
  }
}

export function normalizeOwnedCreature(raw: unknown): OwnedCreature | null {
  const record = asRecord(raw)
  const creature = normalizeCreature(record.creature)

  if (!creature) {
    return null
  }

  const optionsSource = record.evolution_options ?? record.evolutions ?? asRecord(record.evolution).options

  return {
    id: readNumber(record.id),
    creature,
    level: Math.max(1, readNumber(record.level, 1)),
    total_xp: readNumber(record.total_xp),
    is_active: readBoolean(record.is_active),
    acquired_at: readNullableString(record.acquired_at),
    evolution_options: asArray(optionsSource)
      .map(normalizeEvolutionOption)
      .filter((option): option is EvolutionOption => option !== null),
  }
}

export function normalizeOwnedCreatureList(payload: unknown): OwnedCreature[] {
  const data = unwrapData(payload)
  const list = Array.isArray(data) ? data : isRecord(data) ? asArray(data.creatures ?? data.items) : []

  return list.map(normalizeOwnedCreature).filter((item): item is OwnedCreature => item !== null)
}
