import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'
import { formatDate, formatNumber } from '../../../shared/lib/formatters/numbers'
import { CreatureImage } from '../../creatures/components/CreatureImage'
import { CreatureTypeBadge } from '../../creatures/components/CreatureTypeBadge'
import type { OwnedCreature } from '../types'
import { EvolutionStatus } from './EvolutionStatus'

interface OwnedCreatureCardProps {
  owned: OwnedCreature
  /** Omit for read-only views (public collections). */
  onSetActive?: (owned: OwnedCreature) => void
  busy?: boolean
}

export function OwnedCreatureCard({ owned, onSetActive, busy = false }: OwnedCreatureCardProps) {
  const { t } = useTranslation(['collection', 'progression'])
  const { creature } = owned
  const acquired = formatDate(owned.acquired_at)

  return (
    <article
      className={`flex h-full flex-col rounded-[24px] border bg-linear-to-br from-surface/95 to-background/95 p-4 shadow-card ${
        owned.is_active ? 'border-ember/70 shadow-ember' : 'border-border'
      }`}
    >
      <CreatureImage
        src={creature.image_url ?? creature.image_ref}
        alt={creature.name}
        className="mb-4 aspect-4/3 w-full"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 font-display text-xl font-semibold tracking-[-0.02em] text-white">{creature.name}</h2>
        {owned.is_active && (
          <span className="rounded-full border border-ember/50 bg-ember/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ember">
            {t('collection:owned.active')}
          </span>
        )}
      </div>
      <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
        {creature.types.map((creatureType) => (
          <li key={creatureType.id}>
            <CreatureTypeBadge name={creatureType.name} />
          </li>
        ))}
      </ul>
      <p className="mb-0 mt-3 flex flex-wrap gap-x-3 text-sm text-arena-300/80">
        <span className="font-display font-bold text-gold">{t('progression:levelShort', { level: owned.level })}</span>
        <span>{t('collection:owned.xp', { xp: formatNumber(owned.total_xp) })}</span>
        {acquired && <span>{t('collection:owned.acquired', { date: acquired })}</span>}
      </p>
      <EvolutionStatus options={owned.evolution_options} />
      <div className="mt-auto flex flex-wrap gap-3 pt-4">
        {onSetActive && !owned.is_active && (
          <Button variant="secondary" disabled={busy} onClick={() => onSetActive(owned)}>
            {busy ? t('collection:owned.settingActive') : t('collection:owned.setActive')}
          </Button>
        )}
        <Link
          to={`/creatures/${creature.slug}`}
          className="self-center text-sm font-semibold text-ember no-underline hover:text-gold"
        >
          {t('collection:owned.details')}
        </Link>
      </div>
    </article>
  )
}
