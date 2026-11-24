import { useTranslation } from 'react-i18next'
import { StatBar } from '../../../shared/components/ui/StatBar'
import { formatHeight, formatWeight } from '../../../shared/lib/formatters/creatures'
import type { Creature } from '../types'

interface CreatureStatsProps {
  creature: Creature
}

export function CreatureStats({ creature }: CreatureStatsProps) {
  const { t } = useTranslation('creatures')
  const unavailable = t('detail.stats.unavailable')

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1">
        <div className="rounded-2xl border border-border bg-surface/70 p-5 shadow-card">
          <dt className="text-arena-300/70">{t('detail.stats.height')}</dt>
          <dd className="m-0 mt-1 font-display text-lg text-white">
            {formatHeight(creature.height_cm, unavailable)}
          </dd>
        </div>
        <div className="rounded-2xl border border-border bg-surface/70 p-5 shadow-card">
          <dt className="text-arena-300/70">{t('detail.stats.weight')}</dt>
          <dd className="m-0 mt-1 font-display text-lg text-white">
            {formatWeight(creature.weight_g, unavailable)}
          </dd>
        </div>
      </dl>

      <div className="rounded-2xl border border-border bg-surface/70 p-5 shadow-card">
        <h2 className="m-0 mb-5 font-display text-xl text-white">{t('detail.stats.baseStats')}</h2>
        <div className="grid gap-4">
          <StatBar label={t('detail.stats.hp')} value={creature.base_stats.hp} />
          <StatBar label={t('detail.stats.attack')} value={creature.base_stats.attack} />
          <StatBar label={t('detail.stats.defense')} value={creature.base_stats.defense} />
          <StatBar label={t('detail.stats.specialAttack')} value={creature.base_stats.special_attack} />
          <StatBar label={t('detail.stats.specialDefense')} value={creature.base_stats.special_defense} />
          <StatBar label={t('detail.stats.speed')} value={creature.base_stats.speed} />
        </div>
      </div>
    </section>
  )
}
