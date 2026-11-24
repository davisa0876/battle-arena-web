import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logoHorizontal from '../../assets/brand/logo_horizontal.svg'
import logoIcon from '../../assets/brand/logo_icon.svg'
import { LanguageSelector } from '../../shared/components/layout/LanguageSelector'
import { SystemStatus } from '../../shared/components/feedback/SystemStatus'

export function AppShell() {
  const { t } = useTranslation('navigation')

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-arena-300">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(39,201,236,0.13),transparent_30rem),radial-gradient(circle_at_82%_18%,rgba(255,101,66,0.12),transparent_24rem),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[auto,auto,48px_48px,48px_48px]"
        aria-hidden="true"
      />
      <div className="relative z-10 flex min-h-svh flex-col">
        <nav
          className="mx-auto flex w-[min(1180px,calc(100%-2rem))] items-center justify-between gap-4 py-5 max-sm:w-[min(1180px,calc(100%-1.25rem))]"
          aria-label={t('mainNavigation')}
        >
          <div className="flex min-w-0 items-center gap-5">
            <Link className="flex shrink-0 items-center gap-3 no-underline" to="/" aria-label={t('homeAria')}>
              <img src={logoIcon} alt="" className="size-10 sm:hidden" aria-hidden="true" />
              <img src={logoHorizontal} alt="" className="hidden h-10 w-auto sm:block" aria-hidden="true" />
            </Link>
            <NavLink
              to="/creatures"
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-semibold no-underline transition hover:text-white ${
                  isActive ? 'bg-surface text-white shadow-card' : 'text-arena-300/80'
                }`
              }
            >
              {t('creatures')}
            </NavLink>
          </div>
          <div className="flex items-center gap-2">
            <SystemStatus />
            <LanguageSelector />
          </div>
        </nav>

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="relative border-t border-border/70 px-5 py-7 text-center text-xs text-arena-300/60">
          {t('footer', { year: new Date().getFullYear() })}
        </footer>
      </div>
    </div>
  )
}
