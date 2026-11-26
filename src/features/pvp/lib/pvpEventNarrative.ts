import type { PvpBattleEvent } from '../types/battle'

export type PvpNarrativeEntry = {
  id: string
  sequence: number
  textKey: string
  params: Record<string, string | number>
}

function payloadString(payload: Record<string, unknown> | null, key: string): string {
  const value = payload?.[key]
  return typeof value === 'string' ? value : ''
}

function payloadNumber(payload: Record<string, unknown> | null, key: string): number {
  const value = payload?.[key]
  return typeof value === 'number' ? value : Number(value ?? 0)
}

/** Transform structured server events into i18n-ready narrative rows. */
export function narrativeFromEvents(events: PvpBattleEvent[]): PvpNarrativeEntry[] {
  const rows: PvpNarrativeEntry[] = []
  for (const event of events) {
    const payload = event.payload
    const id = `${event.sequence}:${event.type}`
    switch (event.type) {
      case 'battle_started':
        rows.push({ id, sequence: event.sequence, textKey: 'log.started', params: {} })
        break
      case 'attack_started':
        rows.push({
          id,
          sequence: event.sequence,
          textKey: 'log.attackStarted',
          params: {
            move: payloadString(payload, 'move_name') || payloadString(payload, 'slug') || '—',
            actor: event.actor ?? 'attacker',
          },
        })
        break
      case 'attack_skipped':
        rows.push({
          id,
          sequence: event.sequence,
          textKey: 'log.recoverSkip',
          params: {
            actor: event.actor ?? 'trainer',
            stamina: payloadNumber(payload, 'stamina_gained') || payloadNumber(payload, 'amount'),
          },
        })
        break
      case 'defense_selected':
        rows.push({
          id,
          sequence: event.sequence,
          textKey: 'log.defense',
          params: { defense: payloadString(payload, 'defense') || payloadString(payload, 'type') || '—' },
        })
        break
      case 'attack_missed':
        rows.push({ id, sequence: event.sequence, textKey: 'log.miss', params: {} })
        break
      case 'defense_dodged':
        rows.push({ id, sequence: event.sequence, textKey: 'log.dodged', params: {} })
        break
      case 'damage_blocked':
        rows.push({
          id,
          sequence: event.sequence,
          textKey: 'log.blocked',
          params: { damage: payloadNumber(payload, 'damage') },
        })
        break
      case 'damage_applied':
        rows.push({
          id,
          sequence: event.sequence,
          textKey: 'log.damage',
          params: {
            damage: payloadNumber(payload, 'damage'),
            hpAfter: payloadNumber(payload, 'hp_after'),
            hpBefore: payloadNumber(payload, 'hp_before'),
          },
        })
        break
      case 'combatant_fainted':
        rows.push({
          id,
          sequence: event.sequence,
          textKey: 'log.fainted',
          params: { target: event.target ?? 'combatant' },
        })
        break
      case 'battle_finished':
        rows.push({ id, sequence: event.sequence, textKey: 'log.finished', params: {} })
        break
      case 'resources_spent':
        rows.push({
          id,
          sequence: event.sequence,
          textKey: 'log.resources',
          params: {
            pp: payloadNumber(payload, 'pp_spent'),
            stamina: payloadNumber(payload, 'stamina_spent'),
          },
        })
        break
      default:
        break
    }
  }
  return rows
}

export function mergeEventsBySequence(
  existing: PvpBattleEvent[],
  incoming: PvpBattleEvent[],
): { events: PvpBattleEvent[]; gap: boolean } {
  const map = new Map<number, PvpBattleEvent>()
  for (const event of existing) {
    map.set(event.sequence, event)
  }
  for (const event of incoming) {
    map.set(event.sequence, event)
  }
  const events = [...map.values()].sort((a, b) => a.sequence - b.sequence)
  let gap = false
  for (let i = 1; i < events.length; i += 1) {
    if (events[i].sequence !== events[i - 1].sequence + 1) {
      gap = true
      break
    }
  }
  return { events, gap }
}
