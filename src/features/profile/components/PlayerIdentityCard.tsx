import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { withAvatarVersion } from '../lib/avatarUrl'
import type { PlayerProfile, TrainerProgress } from '../types'
import { PlayerAvatar } from './PlayerAvatar'
import { PlayerLevelBadge } from './PlayerLevelBadge'
import { XpProgressBar } from './XpProgressBar'

interface PlayerIdentityCardProps {
  profile: PlayerProfile
  progress: TrainerProgress
  /** Optional line under the handle, e.g. email verification status. */
  meta?: ReactNode
  actions?: ReactNode
}

export function PlayerIdentityCard({ profile, progress, meta, actions }: PlayerIdentityCardProps) {
  const { t } = useTranslation('profile')

  return (
    <article className="rounded-[24px] border border-border bg-linear-to-br from-surface/95 to-background/95 p-8 shadow-card max-sm:p-6">
      <div className="flex flex-wrap items-center gap-6">
        <PlayerAvatar
          src={withAvatarVersion(profile.avatar_url)}
          alt={t('identity.avatarAlt', { name: profile.display_name })}
          initialsFrom={profile.display_name}
          className="size-28"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 break-words font-display text-3xl font-semibold tracking-[-0.03em] text-white">
              {profile.display_name}
            </h2>
            <PlayerLevelBadge level={progress.level} />
          </div>
          <p className="mb-0 mt-1 text-sm font-semibold text-electric">
            {t('identity.handle', { handle: profile.handle })}
          </p>
          {meta && <div className="mt-2 text-xs text-arena-300/70">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
      <p className="mb-6 mt-6 whitespace-pre-line text-arena-300/80">{profile.bio ?? t('identity.noBio')}</p>
      <XpProgressBar progress={progress} />
    </article>
  )
}
