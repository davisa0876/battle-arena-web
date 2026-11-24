import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Creature } from '../types'
import { CreatureImage } from './CreatureImage'
import { CreatureTypeBadge } from './CreatureTypeBadge'

interface CreatureEvolutionsProps {
  creature: Creature
}

function EvolutionBranch({ evolutions }: { evolutions: Creature[] }) {
  const { t } = useTranslation('creatures')

  if (evolutions.length === 0) {
    return null
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {evolutions.map((evolution) => (
        <li key={evolution.id}>
          <Link
            to={`/creatures/${evolution.slug}`}
            className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-border bg-surface/60 p-3 text-inherit no-underline transition hover:border-ember/50 hover:bg-surface/90"
          >
            <CreatureImage
              src={evolution.image_url ?? evolution.image_ref}
              alt={evolution.name}
              className="aspect-square w-full"
            />
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-arena-300/70">
                {t('detail.evolutions.stage', { stage: evolution.evolution_stage ?? '—' })}
              </p>
              <h3 className="m-0 mt-1 font-display text-xl font-semibold text-white">{evolution.name}</h3>
              <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
                {evolution.types.map((type) => (
                  <li key={type.id}>
                    <CreatureTypeBadge name={type.name} />
                  </li>
                ))}
              </ul>
            </div>
          </Link>
          {evolution.evolutions && evolution.evolutions.length > 0 && (
            <div className="mt-3 border-l border-border/80 pl-4">
              <EvolutionBranch evolutions={evolution.evolutions} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export function CreatureEvolutions({ creature }: CreatureEvolutionsProps) {
  const { t } = useTranslation('creatures')
  const evolutions = creature.evolutions ?? []

  if (evolutions.length === 0) {
    return null
  }

  return (
    <section className="mt-10" aria-labelledby="creature-evolutions-heading">
      <h2 id="creature-evolutions-heading" className="m-0 font-display text-2xl font-semibold text-white">
        {t('detail.evolutions.title')}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-arena-300/80">{t('detail.evolutions.description')}</p>
      <div className="mt-5">
        <EvolutionBranch evolutions={evolutions} />
      </div>
    </section>
  )
}
