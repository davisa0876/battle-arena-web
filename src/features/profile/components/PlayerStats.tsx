import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../../shared/lib/formatters/numbers'
import type { OwnedCreature } from '../../collection/types'
import type { TrainerProgress } from '../types'

interface PlayerStatsProps {
  progress: TrainerProgress
  collectionIsPublic: boolean
  /** Null while unknown/unavailable; never guessed. */
  creatures: OwnedCreature[] | null
}

export function PlayerStats({ progress, collectionIsPublic, creatures }: PlayerStatsProps) {
  const { t } = useTranslation('profile')
  const active = creatures?.find((owned) => owned.is_active)

  const stats = [
    { label: t('stats.level'), value: formatNumber(progress.level) },
    { label: t('stats.totalXp'), value: formatNumber(progress.total_xp) },
    {
      label: t('stats.creatures'),
      value: creatures === null ? t('stats.unavailable') : formatNumber(creatures.length),
    },
    {
      label: t('stats.activeCreature'),
      value: creatures === null ? t('stats.unavailable') : (active?.creature.name ?? t('stats.noActiveCreature')),
    },
    {
      label: t('stats.collection'),
      value: collectionIsPublic ? t('stats.collectionPublic') : t('stats.collectionPrivate'),
    },
  ]

  return (
    <section aria-labelledby="player-stats-heading">
      <h2 id="player-stats-heading" className="mb-4 mt-0 font-display text-xl font-semibold text-white">
        {t('stats.title')}
      </h2>
      <dl className="m-0 grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-surface/70 p-4">
            <dt className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-arena-300/60">{stat.label}</dt>
            <dd className="m-0 mt-1 break-words font-display text-lg font-semibold text-white">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
