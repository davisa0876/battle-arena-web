/** Display-only countdown from server UTC deadline. Never decides forfeit/timeout locally. */
export function formatDeadlineCountdown(deadlineIso: string | null | undefined, nowMs = Date.now()): string | null {
  if (!deadlineIso) return null
  const end = Date.parse(deadlineIso)
  if (Number.isNaN(end)) return null
  const remaining = Math.max(0, Math.floor((end - nowMs) / 1000))
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
