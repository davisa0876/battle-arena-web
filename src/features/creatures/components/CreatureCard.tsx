import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { buttonClassName } from '../../../shared/components/ui/Button'
import type { Creature } from '../types'
import { AddToCollectionButton } from './AddToCollectionButton'
import { CreatureImage } from './CreatureImage'
import { CreatureTypeBadge } from './CreatureTypeBadge'

interface CreatureCardProps {
  creature: Creature
  onCollectionChanged?: () => void
}

export function CreatureCard({ creature, onCollectionChanged }: CreatureCardProps) {
  const { t } = useTranslation('creatures')
  const owned = creature.is_owned === true

  return (
    <article
      className={`group relative flex h-full flex-col rounded-[24px] border p-4 shadow-card transition duration-200 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none ${
        owned
          ? 'border-neon bg-black shadow-neon hover:border-neon hover:shadow-neon'
          : 'border-border bg-linear-to-br from-surface/95 to-background/95 hover:border-ember/55 hover:shadow-ember'
      }`}
    >
      {owned && (
        <span className="absolute right-4 top-4 z-10 rounded-full border border-neon/50 bg-neon/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-neon">
          {t('catalog.ownedBadge')}
        </span>
      )}
      <Link to={`/creatures/${creature.slug}`} className="block min-w-0 flex-1 text-inherit no-underline">
        <CreatureImage
          src={creature.image_url ?? creature.image_ref}
          alt={creature.name}
          className="mb-4 aspect-4/3 w-full"
        />
        <h2 className="m-0 font-display text-xl font-semibold tracking-[-0.02em] text-white">
          {creature.name}
        </h2>
        <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
          {creature.types.map((creatureType) => (
            <li key={creatureType.id}>
              <CreatureTypeBadge name={creatureType.name} />
            </li>
          ))}
        </ul>
      </Link>
      <div className="mt-4 flex flex-col gap-2">
        <Link
          to={`/creatures/${creature.slug}`}
          className={`${buttonClassName('secondary')} px-3 py-1.5 text-xs`}
        >
          {t('catalog.viewDetails')}
        </Link>
        <AddToCollectionButton
          creature={creature}
          size="sm"
          onSelected={onCollectionChanged}
        />
      </div>
    </article>
  )
}
