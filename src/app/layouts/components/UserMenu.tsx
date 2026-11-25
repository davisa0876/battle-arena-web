import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { PlayerAvatar } from '../../../features/profile/components/PlayerAvatar'
import { withAvatarVersion } from '../../../features/profile/lib/avatarUrl'
import { menuLinkClass } from './navStyles'

/**
 * Compact avatar dropdown (disclosure pattern): button toggles a panel of plain links,
 * closes on Escape, outside click and navigation.
 */
export function UserMenu() {
  const { t } = useTranslation('navigation')
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const panelId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  // Remembering *which location* opened the menu closes it automatically on navigation.
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const open = openedAt === location.key

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenedAt(null)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenedAt(null)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    setOpenedAt(null)
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('userMenu.label')}
        onClick={() => setOpenedAt(open ? null : location.key)}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface/80 py-1 pl-1 pr-3 text-xs font-bold text-white shadow-card backdrop-blur transition hover:border-electric/60 focus-visible:outline-2 focus-visible:outline-electric"
      >
        <PlayerAvatar
          src={withAvatarVersion(user.profile.avatar_url)}
          alt=""
          initialsFrom={user.profile.display_name}
          className="size-8 text-xs"
        />
        <span className="font-display tracking-[0.08em] text-gold">
          {t('userMenu.level', { level: user.progress.level })}
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-30 mt-2 w-60 rounded-2xl border border-border bg-surface p-2 shadow-card"
        >
          <div className="border-b border-border/70 px-3 pb-2 pt-1">
            <p className="m-0 truncate text-sm font-semibold text-white">{user.profile.display_name}</p>
            <p className="m-0 truncate text-xs text-electric">@{user.profile.handle}</p>
          </div>
          <ul className="m-0 mt-2 flex list-none flex-col gap-0.5 p-0">
            <li>
              <Link to="/profile" className={menuLinkClass}>
                {t('profile')}
              </Link>
            </li>
            <li>
              <Link to="/my-collection" className={menuLinkClass}>
                {t('myCollection')}
              </Link>
            </li>
            <li>
              <Link to="/profile/edit" className={menuLinkClass}>
                {t('settings')}
              </Link>
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
          </ul>
        </div>
      )}
    </div>
  )
}
