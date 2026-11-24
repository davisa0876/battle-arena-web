interface CreaturePlaceholderProps {
  name: string
  className?: string
}

/** Neutral original placeholder. No copyrighted artwork. */
export function CreaturePlaceholder({ name, className = '' }: CreaturePlaceholderProps) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={`grid place-items-center rounded-[18px] border border-arena-700 bg-[radial-gradient(circle_at_30%_20%,rgba(255,138,76,0.22),transparent_55%),linear-gradient(160deg,#16192a,#07080f)] text-ember-300 ${className}`}
      aria-hidden="true"
    >
      <span className="font-display text-2xl font-bold tracking-wide">{initials || 'BA'}</span>
    </div>
  )
}
