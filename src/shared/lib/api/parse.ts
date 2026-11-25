/**
 * Tiny, dependency-free helpers for turning `unknown` API payloads into typed values.
 * Feature normalizers use them so a slightly different backend shape degrades gracefully
 * instead of crashing the UI (no `any`).
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function readNullableString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

export function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return fallback
}

export function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/** Laravel API resources wrap payloads in `{ data: ... }`; unwrap when present. */
export function unwrapData(payload: unknown): unknown {
  return isRecord(payload) && 'data' in payload ? payload.data : payload
}
