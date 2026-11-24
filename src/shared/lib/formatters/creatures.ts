export function formatHeight(value: number | null, fallback: string): string {
  return value == null ? fallback : `${(value / 100).toFixed(2)} m`
}

export function formatWeight(value: number | null, fallback: string): string {
  return value == null ? fallback : `${(value / 1000).toFixed(1)} kg`
}
