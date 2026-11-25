export function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `rounded-full px-3 py-2 text-sm font-semibold no-underline transition hover:text-white focus-visible:outline-2 focus-visible:outline-electric ${
    isActive ? 'bg-surface text-white shadow-card' : 'text-arena-300/80'
  }`
}

export const menuLinkClass =
  'block rounded-xl px-3 py-2.5 text-sm font-semibold text-arena-300 no-underline transition hover:bg-background hover:text-white focus-visible:outline-2 focus-visible:outline-electric'
