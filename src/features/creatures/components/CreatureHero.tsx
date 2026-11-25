import { useTranslation } from 'react-i18next'
import type { Creature } from '../types'
import { AddToCollectionButton } from './AddToCollectionButton'
import { CreatureImage } from './CreatureImage'
import { CreatureTypeBadge } from './CreatureTypeBadge'

interface CreatureHeroProps {
  creature: Creature
  onCollectionChanged?: () => void
}

export function CreatureHero({ creature, onCollectionChanged }: CreatureHeroProps) {
  const { t } = useTranslation('creatures')
  const owned = creature.is_owned === true

  return (
    <header
      className={`grid gap-8 rounded-[32px] border p-5 shadow-card backdrop-blur md:grid-cols-[320px_minmax(0,1fr)] md:p-7 ${
        owned
          ? 'border-neon bg-black shadow-neon'
          : 'border-border bg-surface/70'
      }`}
    >
      <CreatureImage
        src={creature.image_url ?? creature.image_ref}
        alt={creature.name}
        className="aspect-square w-full min-h-64"
      />
      <div className="flex min-w-0 flex-col justify-center">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.18em] text-ember">
            {t('detail.eyebrow')}
          </p>
          {owned && (
            <span className="rounded-full border border-neon/50 bg-neon/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-neon">
              {t('detail.ownedBadge')}
            </span>
          )}
        </div>
        <h1 className="m-0 font-display text-[clamp(2rem,5vw,3.6rem)] font-semibold tracking-[-0.04em] text-white">
          {creature.name}
        </h1>
        <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
          {creature.types.map((creatureType) => (
            <li key={creatureType.id}>
              <CreatureTypeBadge name={creatureType.name} />
            </li>
          ))}
        </ul>
        <AddToCollectionButton
          creature={creature}
          className="mt-6"
          onSelected={onCollectionChanged}
        />
      </div>
    </header>
  )
}
