interface CreatureTypeBadgeProps {
  name: string
}

export function CreatureTypeBadge({ name }: CreatureTypeBadgeProps) {
  return (
    <span className="rounded-full border border-electric/25 bg-electric/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-electric">
      {name}
    </span>
  )
}
