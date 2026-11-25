import type { ReactNode } from 'react'

interface PageSectionProps {
  children: ReactNode
  /** Tailwind max width in px used by the clamp (defaults to the 1180px catalog width). */
  size?: 'narrow' | 'medium' | 'wide'
  labelledBy?: string
}

const widths = {
  narrow: 'w-[min(480px,calc(100%-2rem))] max-sm:w-[min(480px,calc(100%-1.25rem))]',
  medium: 'w-[min(980px,calc(100%-2rem))] max-sm:w-[min(980px,calc(100%-1.25rem))]',
  wide: 'w-[min(1180px,calc(100%-2rem))] max-sm:w-[min(1180px,calc(100%-1.25rem))]',
} as const

export function PageSection({ children, size = 'wide', labelledBy }: PageSectionProps) {
  return (
    <section className={`mx-auto pb-28 pt-8 ${widths[size]}`} aria-labelledby={labelledBy}>
      {children}
    </section>
  )
}

interface PageHeadingProps {
  id?: string
  eyebrow?: string
  title: string
  description?: string
}

export function PageHeading({ id, eyebrow, title, description }: PageHeadingProps) {
  return (
    <header className="mb-8">
      {eyebrow && (
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-ember">{eyebrow}</p>
      )}
      <h1
        id={id}
        className="m-0 font-display text-[clamp(2rem,5vw,3.4rem)] font-semibold tracking-[-0.05em] text-white"
      >
        {title}
      </h1>
      {description && <p className="mt-3 max-w-2xl text-arena-300/80">{description}</p>}
    </header>
  )
}
