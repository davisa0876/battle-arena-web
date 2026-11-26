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
import type {
  BattleReward,
  BattleRules,
  GameRules,
  SelectionRules,
  SelectionSample,
  StageSelectionRule,
  XpCurveSample,
} from '../types'

function readNullableNumber(value: unknown): number | null {
  if (value == null) {
    return null
  }
  const parsed = readNumber(value, Number.NaN)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeSamples(raw: unknown): XpCurveSample[] {
  const entries: unknown[] = Array.isArray(raw)
    ? raw
    : isRecord(raw)
      ? Object.entries(raw).map(([level, xp]) => (isRecord(xp) ? { level, ...xp } : { level, xp_to_next_level: xp }))
      : []

  return entries
    .map((entry): XpCurveSample | null => {
      const record = asRecord(entry)
      const level = readNumber(record.level, Number.NaN)
      const xp = readNumber(
        record.xp_to_next_level ??
          record.xp_to_advance ??
          record.xp_to_next ??
          record.xp_required ??
          record.xp_for_next_level ??
          record.xp,
        Number.NaN,
      )
      return Number.isNaN(level) || Number.isNaN(xp)
        ? null
        : {
            level,
            xp_to_next_level: xp,
            total_xp_required: readNullableNumber(record.total_xp_required ?? record.total_xp),
          }
    })
    .filter((sample): sample is XpCurveSample => sample !== null)
    .sort((left, right) => left.level - right.level)
}

function normalizeStarterSlugs(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw
    : isRecord(raw)
      ? asArray(raw.creature_slugs ?? raw.slugs ?? raw.creatures)
      : []

  return list
    .map((item) => (typeof item === 'string' ? item : readString(asRecord(item).slug)))
    .filter((slug) => slug !== '')
}

function normalizeFeatures(raw: unknown): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(asRecord(raw)).map(([name, enabled]) => [name, readBoolean(enabled)]),
  )
}

function normalizeStageRule(raw: unknown): StageSelectionRule {
  const record = asRecord(raw)
  return {
    unlock_level: readNullableNumber(record.unlock_level),
    allowance_cap: readNullableNumber(record.allowance_cap),
    allowance_at_unlock: readNullableNumber(record.allowance_at_unlock),
    increment_per_level: readNullableNumber(record.increment_per_level),
    defined_through_level: readNullableNumber(record.defined_through_level),
  }
}

function normalizeSelectionSamples(raw: unknown): SelectionSample[] {
  return asArray(raw)
    .map((entry): SelectionSample | null => {
      const record = asRecord(entry)
      const level = readNumber(record.trainer_level ?? record.level, Number.NaN)
      return Number.isNaN(level)
        ? null
        : {
            trainer_level: level,
            stage_1_allowance: readNumber(record.stage_1_allowance),
            stage_2_allowance: readNumber(record.stage_2_allowance),
          }
    })
    .filter((sample): sample is SelectionSample => sample !== null)
    .sort((left, right) => left.trainer_level - right.trainer_level)
}

function normalizeSelection(raw: unknown): SelectionRules {
  const record = asRecord(raw)
  return {
    stage_1: normalizeStageRule(record.stage_1),
    stage_2: normalizeStageRule(record.stage_2),
    stage_3: normalizeStageRule(record.stage_3),
    samples: normalizeSelectionSamples(record.samples),
  }
}

function normalizeReward(raw: unknown): BattleReward | null {
  const record = asRecord(raw)
  if (record.win == null && record.loss == null) {
    return null
  }
  return { win: readNumber(record.win), loss: readNumber(record.loss) }
}

function normalizePvpOnlinePresence(raw: unknown): BattleRules['pvp_online_presence'] {
  if (!isRecord(raw)) {
    return null
  }
  return {
    while_authenticated: readBoolean(raw.while_authenticated, true),
    requires_pvp_min_level: readBoolean(raw.requires_pvp_min_level, true),
    requires_pvp_screen: readBoolean(raw.requires_pvp_screen, false),
  }
}

function normalizeBattle(raw: unknown): BattleRules {
  const record = asRecord(raw)
  const rewards = asRecord(record.rewards)
  return {
    pve_min_trainer_level: readNullableNumber(record.pve_min_trainer_level),
    pvp_min_trainer_level: readNullableNumber(record.pvp_min_trainer_level),
    pvp_online_presence: normalizePvpOnlinePresence(record.pvp_online_presence),
    rewards: { pve: normalizeReward(rewards.pve), pvp: normalizeReward(rewards.pvp) },
    playable: readBoolean(record.playable),
  }
}

/** Turns `GET /api/game/rules` into a stable shape; tolerant of small naming variations. */
export function normalizeGameRules(payload: unknown): GameRules {
  const raw = asRecord(unwrapData(payload))
  const trainer = asRecord(raw.trainer)
  const explicit = asRecord(raw.progression ?? raw.trainer_progression ?? raw.xp)
  const progression = Object.keys(explicit).length > 0 ? explicit : trainer
  const maxLevel = progression.max_level ?? raw.max_level
  const increment = progression.xp_increment_per_level ?? trainer.xp_increment_per_level ?? progression.xp_base
  const startingLevel = progression.starting_level ?? trainer.starting_level
  const startingXp = progression.starting_xp ?? trainer.starting_xp

  return {
    version: readString(raw.version ?? raw.rules_version),
    progression: {
      formula: readNullableString(progression.formula),
      starting_level: startingLevel == null ? null : readNumber(startingLevel),
      starting_xp: startingXp == null ? null : readNumber(startingXp),
      xp_increment_per_level: readNullableNumber(increment),
      max_level: maxLevel == null ? null : readNumber(maxLevel),
      curve_samples: normalizeSamples(
        progression.curve_samples ??
          progression.curve ??
          progression.curve_sample ??
          progression.xp_curve ??
          progression.samples ??
          trainer.curve ??
          raw.xp_curve ??
          raw.xp_curve_samples,
      ),
    },
    selection: normalizeSelection(raw.selection),
    battle: normalizeBattle(raw.battle),
    starter_slugs: normalizeStarterSlugs(raw.starters ?? raw.starter_creatures),
    features: normalizeFeatures(raw.features ?? raw.feature_flags),
  }
}
