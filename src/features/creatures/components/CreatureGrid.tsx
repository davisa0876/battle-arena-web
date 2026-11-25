import type { Creature } from '../types'
import { CreatureCard } from './CreatureCard'

interface CreatureGridProps {
  creatures: Creature[]
  onCollectionChanged?: () => void
}

export function CreatureGrid({ creatures, onCollectionChanged }: CreatureGridProps) {
  return (
    <ul className="m-0 grid list-none grid-cols-3 gap-4 p-0 max-lg:grid-cols-2 max-sm:grid-cols-1">
      {creatures.map((creature) => (
        <li key={creature.id}>
          <CreatureCard creature={creature} onCollectionChanged={onCollectionChanged} />
        </li>
      ))}
    </ul>
  )
}
