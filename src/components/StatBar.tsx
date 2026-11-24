interface StatBarProps {
  label: string
  value: number
  max?: number
}

export function StatBar({ label, value, max = 160 }: StatBarProps) {
  const width = Math.max(4, Math.min(100, Math.round((value / max) * 100)))

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-arena-400">{label}</span>
        <span className="font-display font-semibold text-white">{value}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-arena-800"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-ember-400 to-ember-300 transition-[width] duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}
