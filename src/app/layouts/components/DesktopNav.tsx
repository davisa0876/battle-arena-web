import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { navLinkClass } from './navStyles'
import { UserMenu } from './UserMenu'

/** App links next to the brand. Game rules are public; the creature catalog is for signed-in trainers. */
export function DesktopPrimaryLinks() {
  const { t } = useTranslation('navigation')
  const { status } = useAuth()

  if (status === 'loading') {
    return null
  }

  return (
    <div className="hidden items-center gap-1 md:flex">
      {status === 'authenticated' && (
        <NavLink to="/creatures" className={navLinkClass}>
          {t('creatures')}
        </NavLink>
      )}
      {status === 'authenticated' && (
        <NavLink to="/pve" className={navLinkClass}>
          {t('pve')}
        </NavLink>
      )}
      {status === 'authenticated' && (
        <NavLink to="/pvp" className={navLinkClass}>
          {t('pvp')}
        </NavLink>
      )}
      <NavLink to="/game-rules" className={navLinkClass}>
        {t('gameRules')}
      </NavLink>
      {status === 'authenticated' && (
        <NavLink to="/my-collection" className={navLinkClass}>
          {t('myCollection')}
        </NavLink>
      )}
    </div>
  )
}

/** Login/Register for guests, avatar dropdown for trainers. Hidden on small screens (see MobileMenu). */
export function DesktopAccountNav() {
  const { t } = useTranslation('navigation')
  const { status } = useAuth()

  if (status === 'loading') {
    return <span className="hidden size-9 rounded-full border border-border bg-surface/60 md:block" aria-hidden="true" />
  }

  if (status === 'authenticated') {
    return (
      <div className="hidden md:block">
        <UserMenu />
      </div>
    )
  }

  return (
    <div className="hidden items-center gap-1 md:flex">
      <NavLink to="/login" className={navLinkClass}>
        {t('login')}
      </NavLink>
      <NavLink
        to="/register"
        className="rounded-full border border-ember bg-ember px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-ember/90 focus-visible:outline-2 focus-visible:outline-electric"
      >
        {t('register')}
      </NavLink>
    </div>
  )
}
