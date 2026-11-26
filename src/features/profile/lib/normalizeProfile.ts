import {
  asRecord,
  readBoolean,
  readNullableString,
  readNumber,
  readString,
  unwrapData,
} from '../../../shared/lib/api/parse'
import { normalizeOwnedCreatureList } from '../../collection/lib/normalizeCollection'
import type {
  AuthUser,
  PlayerProfile,
  PublicPlayer,
  PveRecord,
  PvpRecord,
  SelectionAllowance,
  TrainerProgress,
} from '../types'

function normalizePveRecord(raw: unknown): PveRecord | undefined {
  const source = asRecord(raw)
  if (Object.keys(source).length === 0) return undefined
  return {
    wins: Math.max(0, readNumber(source.wins, 0)),
    losses: Math.max(0, readNumber(source.losses, 0)),
    give_ups: Math.max(0, readNumber(source.give_ups, 0)),
  }
}

function normalizePvpRecord(raw: unknown): PvpRecord | undefined {
  const source = asRecord(raw)
  if (Object.keys(source).length === 0) return undefined
  return {
    wins: Math.max(0, readNumber(source.wins, 0)),
    losses: Math.max(0, readNumber(source.losses, 0)),
    forfeits: Math.max(0, readNumber(source.forfeits, 0)),
  }
}

/**
 * The API exposes progress either as a nested `progress` object or flat on the resource.
 * Missing derived fields (percent, next-level size) are computed from the raw numbers.
 */
export function normalizeProgress(raw: unknown, fallbackFlat: Record<string, unknown> = {}): TrainerProgress {
  const source = Object.keys(asRecord(raw)).length > 0 ? asRecord(raw) : fallbackFlat

  const level = Math.max(1, readNumber(source.level, 1))
  const totalXp = readNumber(source.total_xp ?? source.totalXp, 0)
  const xpIntoLevel = readNumber(source.xp_into_level, 0)
  const isMaxLevel = readBoolean(source.is_max_level)
  const xpToNextRaw = source.xp_to_next_level ?? source.xp_to_next
  const xpForNextRaw = source.xp_for_next_level ?? source.xp_required
  const xpToNext = isMaxLevel || xpToNextRaw == null ? null : readNumber(xpToNextRaw)
  const xpForNext =
    isMaxLevel || xpForNextRaw == null
      ? xpToNext !== null
        ? xpIntoLevel + xpToNext
        : null
      : readNumber(xpForNextRaw)

  const computedPercent = xpForNext && xpForNext > 0 ? (xpIntoLevel / xpForNext) * 100 : isMaxLevel ? 100 : 0
  const percent = readNumber(source.progress_percent, computedPercent)

  const progress: TrainerProgress = {
    level,
    total_xp: totalXp,
    xp_into_level: xpIntoLevel,
    xp_to_next_level: xpToNext,
    xp_for_next_level: xpForNext,
    progress_percent: Math.min(100, Math.max(0, percent)),
    is_max_level: isMaxLevel,
  }

  // Owner-only fields: keep them absent (not defaulted) when the API did not send them.
  if (Array.isArray(source.selection_allowances)) {
    progress.selection_allowances = normalizeAllowances(source.selection_allowances)
  }
  if (typeof source.pvp_level_unlocked === 'boolean') {
    progress.pvp_level_unlocked = source.pvp_level_unlocked
  }

  return progress
}

function normalizeAllowances(raw: unknown[]): SelectionAllowance[] {
  return raw
    .map((entry): SelectionAllowance | null => {
      const record = asRecord(entry)
      const stage = readNumber(record.evolution_stage, Number.NaN)
      if (Number.isNaN(stage)) {
        return null
      }
      const total = Math.max(0, readNumber(record.total))
      const used = Math.max(0, readNumber(record.used))
      return {
        evolution_stage: stage,
        total,
        used,
        remaining: Math.max(0, readNumber(record.remaining, total - used)),
      }
    })
    .filter((allowance): allowance is SelectionAllowance => allowance !== null)
    .sort((left, right) => left.evolution_stage - right.evolution_stage)
}

function normalizeProfile(raw: Record<string, unknown>, fallbackName: string): PlayerProfile {
  return {
    handle: readString(raw.handle),
    display_name: readString(raw.display_name, fallbackName) || fallbackName,
    bio: readNullableString(raw.bio),
    avatar_url: readNullableString(raw.avatar_url ?? raw.avatar),
    collection_is_public: readBoolean(raw.collection_is_public),
  }
}

export function normalizeAuthUser(payload: unknown): AuthUser | null {
  const raw = asRecord(unwrapData(payload))
  const maybeUser = Object.keys(raw).length > 0 && 'user' in raw ? asRecord(raw.user) : raw

  if (typeof maybeUser.id !== 'number' && typeof maybeUser.id !== 'string') {
    return null
  }

  const profileSource = Object.keys(asRecord(maybeUser.profile)).length > 0 ? asRecord(maybeUser.profile) : maybeUser
  const email = readString(maybeUser.email)

  const pveRecord = normalizePveRecord(maybeUser.pve_record)
  const pvpRecord = normalizePvpRecord(maybeUser.pvp_record)

  return {
    id: readNumber(maybeUser.id),
    email,
    email_verified_at: readNullableString(
      maybeUser.email_verified_at ?? (maybeUser.email_verified === true ? 'verified' : null),
    ),
    profile: normalizeProfile(profileSource, readString(maybeUser.name, email)),
    progress: normalizeProgress(
      maybeUser.progress ?? maybeUser.trainer ?? maybeUser.trainer_progress,
      maybeUser,
    ),
    ...(pveRecord ? { pve_record: pveRecord } : {}),
    ...(pvpRecord ? { pvp_record: pvpRecord } : {}),
  }
}

export function normalizePublicPlayer(payload: unknown): PublicPlayer | null {
  const raw = asRecord(unwrapData(payload))
  const profileSource = Object.keys(asRecord(raw.profile)).length > 0 ? asRecord(raw.profile) : raw

  if (readString(profileSource.handle) === '') {
    return null
  }

  const profile = normalizeProfile(profileSource, readString(profileSource.handle))
  const collectionSource = raw.collection ?? raw.creatures

  return {
    ...profile,
    progress: normalizeProgress(raw.progress ?? raw.trainer ?? raw.trainer_progress, raw),
    collection:
      profile.collection_is_public && collectionSource != null
        ? normalizeOwnedCreatureList(collectionSource)
        : null,
  }
}
