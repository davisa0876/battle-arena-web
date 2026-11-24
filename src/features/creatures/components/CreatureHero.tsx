import { useTranslation } from 'react-i18next'
import type { Creature } from '../types'
import { CreatureImage } from './CreatureImage'
import { CreatureTypeBadge } from './CreatureTypeBadge'

interface CreatureHeroProps {
  creature: Creature
}

export function CreatureHero({ creature }: CreatureHeroProps) {
  const { t } = useTranslation('creatures')

  return (
    <header className="grid gap-8 rounded-[32px] border border-border bg-surface/70 p-5 shadow-card backdrop-blur md:grid-cols-[320px_minmax(0,1fr)] md:p-7">
      <CreatureImage
        src={creature.image_url ?? creature.image_ref}
        alt={creature.name}
        className="aspect-square w-full min-h-64"
      />
      <div className="flex min-w-0 flex-col justify-center">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-ember">
          {t('detail.eyebrow')}
        </p>
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
      </div>
    </header>
  )
}
