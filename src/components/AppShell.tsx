import { Link, Outlet } from 'react-router-dom'
import { SystemStatus } from './SystemStatus'

export function AppShell() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_50%_8%,rgba(255,138,76,0.16),transparent_34rem),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[auto,48px_48px,48px_48px] bg-arena-950">
      <nav
        className="mx-auto flex w-[min(1120px,calc(100%-2.5rem))] items-center justify-between gap-4 py-6 max-md:w-[min(1120px,calc(100%-1.75rem))]"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-6">
          <Link
            className="flex items-center gap-3 font-display text-base font-bold tracking-wide text-white no-underline max-md:text-[0]"
            to="/"
            aria-label="Battle Arena home"
          >
            <span
              className="grid size-9 place-items-center rounded-[10px] border border-ember-400/50 bg-ember-400/10 font-sans text-xs tracking-[0.08em] text-ember-300"
              aria-hidden="true"
            >
              BA
            </span>
            Battle Arena
          </Link>
          <Link
            to="/creatures"
            className="text-sm font-semibold text-arena-300 no-underline transition hover:text-ember-300"
          >
            Creatures
          </Link>
        </div>
        <SystemStatus />
      </nav>

      <Outlet />

      <footer className="border-t border-arena-800 px-5 py-7 text-center text-xs text-arena-400/70">
        © {new Date().getFullYear()} Battle Arena · Prepare for battle
      </footer>
    </div>
  )
}
