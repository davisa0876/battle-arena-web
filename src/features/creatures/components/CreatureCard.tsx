import { Link } from 'react-router-dom'
import type { Creature } from '../types'
import { CreatureImage } from './CreatureImage'
import { CreatureTypeBadge } from './CreatureTypeBadge'

interface CreatureCardProps {
  creature: Creature
}

export function CreatureCard({ creature }: CreatureCardProps) {
  return (
    <Link
      to={`/creatures/${creature.slug}`}
      className="group block h-full rounded-[24px] border border-border bg-linear-to-br from-surface/95 to-background/95 p-4 text-inherit no-underline shadow-card transition duration-200 hover:-translate-y-1 hover:border-ember/55 hover:shadow-ember motion-reduce:transform-none motion-reduce:transition-none"
    >
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
  )
}
