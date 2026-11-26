import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { menuLinkClass } from './navStyles'

/**
 * Small-screen navigation as a disclosure: a toggle button reveals a panel of links.
 * The panel is only in the DOM while open, and closes on Escape / navigation.
 */
export function MobileMenu() {
  const { t } = useTranslation('navigation')
  const { status, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const open = openedAt === location.key

  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenedAt(null)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const handleLogout = async () => {
    setOpenedAt(null)
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  const linkClass = ({ isActive }: { isActive: boolean }) => `${menuLinkClass} ${isActive ? 'bg-background text-white' : ''}`

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t('menu.close') : t('menu.open')}
        onClick={() => setOpenedAt(open ? null : location.key)}
        className="grid size-10 cursor-pointer place-items-center rounded-full border border-border bg-surface/80 text-white shadow-card backdrop-blur focus-visible:outline-2 focus-visible:outline-electric"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full z-30 mt-1 rounded-2xl border border-border bg-surface p-2 shadow-card"
        >
          {status === 'authenticated' && user && (
            <div className="border-b border-border/70 px-3 pb-2 pt-1">
              <p className="m-0 truncate text-sm font-semibold text-white">{user.profile.display_name}</p>
              <p className="m-0 text-xs font-bold text-gold">{t('userMenu.level', { level: user.progress.level })}</p>
            </div>
          )}
          <ul className="m-0 mt-1 flex list-none flex-col gap-0.5 p-0">
            {status === 'authenticated' ? (
              <>
                <li>
                  <NavLink to="/creatures" className={linkClass}>
                    {t('creatures')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/pve" className={linkClass}>
                    {t('pve')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/pvp" className={linkClass}>
                    {t('pvp')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/game-rules" className={linkClass}>
                    {t('gameRules')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/my-collection" className={linkClass}>
                    {t('myCollection')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/profile" end className={linkClass}>
                    {t('profile')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/profile/edit" className={linkClass}>
                    {t('settings')}
                  </NavLink>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className={`${menuLinkClass} w-full cursor-pointer border-0 bg-transparent text-left text-signal-bad`}
                  >
                    {t('logout')}
                  </button>
                </li>
              </>
            ) : (
              status === 'guest' && (
                <>
                  <li>
                    <NavLink to="/game-rules" className={linkClass}>
                      {t('gameRules')}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/login" className={linkClass}>
                      {t('login')}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/register" className={linkClass}>
                      {t('register')}
                    </NavLink>
                  </li>
                </>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
