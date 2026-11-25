import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold no-underline transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none'

const variants: Record<ButtonVariant, string> = {
  primary: 'border border-ember bg-ember text-white shadow-ember hover:bg-ember/90',
  secondary: 'border border-border bg-surface/80 text-arena-300 hover:border-electric/60 hover:text-white',
  danger: 'border border-signal-bad/50 bg-signal-bad/10 text-signal-bad hover:bg-signal-bad/20',
}

/** Shared class list so links (`<Link>`) can look exactly like buttons. */
export function buttonClassName(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${base} ${variants[variant]} ${extra}`.trim()
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...props} />
}
