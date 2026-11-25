import type { ReactNode } from 'react'
import { useId } from 'react'
import { PageSection } from '../../../shared/components/layout/PageSection'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Centered card shell shared by every auth page. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  const headingId = useId()

  return (
    <PageSection size="narrow" labelledBy={headingId}>
      <div className="rounded-[24px] border border-border bg-linear-to-br from-surface/95 to-background/95 p-8 shadow-card max-sm:p-6">
        <h1
          id={headingId}
          className="m-0 font-display text-[clamp(1.6rem,4vw,2.2rem)] font-semibold tracking-[-0.04em] text-white"
        >
          {title}
        </h1>
        {subtitle && <p className="mb-0 mt-2 text-sm text-arena-300/80">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-arena-300/80">{footer}</div>}
      </div>
    </PageSection>
  )
}
