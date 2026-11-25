import type { ReactNode } from 'react'

type AlertVariant = 'error' | 'success' | 'info'

const variantClass: Record<AlertVariant, string> = {
  error: 'border-signal-bad/40 bg-signal-bad/10 text-signal-bad',
  success: 'border-signal-ok/40 bg-signal-ok/10 text-signal-ok',
  info: 'border-electric/30 bg-electric/10 text-arena-300',
}

interface AlertProps {
  variant?: AlertVariant
  children: ReactNode
  className?: string
}

export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${variantClass[variant]} ${className}`}
    >
      {children}
    </div>
  )
}
