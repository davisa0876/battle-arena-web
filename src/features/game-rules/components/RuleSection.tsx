import type { ReactNode } from 'react'

interface RuleSectionProps {
  /** Stable section marker (A-F). Not translated: it is an identifier, not copy. */
  letter: string
  title: string
  intro?: string
  children?: ReactNode
}

export function RuleSection({ letter, title, intro, children }: RuleSectionProps) {
  const headingId = `rules-section-${letter.toLowerCase()}`

  return (
    <section
      id={headingId}
      aria-labelledby={`${headingId}-title`}
      className="rounded-[24px] border border-border bg-linear-to-br from-surface/95 to-background/95 p-8 shadow-card max-sm:p-6"
    >
      <div className="flex items-start gap-4">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-border bg-background font-display text-sm font-bold text-electric"
          aria-hidden="true"
        >
          {letter}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${headingId}-title`} className="m-0 font-display text-2xl font-semibold tracking-[-0.03em] text-white">
            {title}
          </h2>
          {intro && <p className="mb-0 mt-3 text-arena-300/80">{intro}</p>}
          {children && <div className="mt-4 flex flex-col gap-4">{children}</div>}
        </div>
      </div>
    </section>
  )
}

export function RuleList({ items }: { items: string[] }) {
  return (
    <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-arena-300/80 marker:text-ember">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  )
}
