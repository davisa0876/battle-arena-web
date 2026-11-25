import { useTranslation } from 'react-i18next'

interface PlayerLevelBadgeProps {
  level: number
  /** "short" renders "Lv. 7"; "full" renders "Level 7". */
  variant?: 'short' | 'full'
}

export function PlayerLevelBadge({ level, variant = 'full' }: PlayerLevelBadgeProps) {
  const { t } = useTranslation('progression')

  return (
    <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-display text-xs font-bold uppercase tracking-[0.12em] text-gold">
      {variant === 'short' ? t('levelShort', { level }) : t('level', { level })}
    </span>
  )
}
