import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '../../../i18n'
import type { Creature } from '../types'
import { CreatureStats } from './CreatureStats'

const creature: Creature = {
  id: 1,
  name: 'Bulbasaur',
  slug: 'bulbasaur',
  height_cm: 70,
  weight_g: 6900,
  image_ref: null,
  image_url: null,
  types: [{ id: 2, name: 'Grass', slug: 'grass' }],
  base_stats: {
    hp: 45,
    attack: 49,
    defense: 49,
    special_attack: 65,
    special_defense: 65,
    speed: 45,
  },
}

describe('CreatureStats', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('shows formatted height and weight', () => {
    render(<CreatureStats creature={creature} />)

    expect(screen.getByText('Height').nextElementSibling).toHaveTextContent('0.70 m')
    expect(screen.getByText('Weight').nextElementSibling).toHaveTextContent('6.9 kg')
  })

  it('shows the unavailable placeholder for null height and weight', () => {
    render(<CreatureStats creature={{ ...creature, height_cm: null, weight_g: null }} />)

    expect(screen.getByText('Height').nextElementSibling).toHaveTextContent('—')
    expect(screen.getByText('Weight').nextElementSibling).toHaveTextContent('—')
  })

  it('formats zero height and weight instead of using the placeholder', () => {
    render(<CreatureStats creature={{ ...creature, height_cm: 0, weight_g: 0 }} />)

    expect(screen.getByText('Height').nextElementSibling).toHaveTextContent('0.00 m')
    expect(screen.getByText('Weight').nextElementSibling).toHaveTextContent('0.0 kg')
  })

  it('renders one meter per base stat with the right label and value', () => {
    render(<CreatureStats creature={creature} />)

    expect(screen.getByRole('heading', { name: 'Base stats' })).toBeInTheDocument()
    const meters = screen.getAllByRole('meter')
    expect(meters).toHaveLength(6)

    expect(meters.map((meter) => [meter.getAttribute('aria-label'), meter.getAttribute('aria-valuenow')])).toEqual([
      ['HP', '45'],
      ['Attack', '49'],
      ['Defense', '49'],
      ['Special Attack', '65'],
      ['Special Defense', '65'],
      ['Speed', '45'],
    ])
  })

  it('maps special_attack and special_defense to their own meters', () => {
    render(
      <CreatureStats
        creature={{ ...creature, base_stats: { ...creature.base_stats, special_attack: 111, special_defense: 22 } }}
      />,
    )

    expect(screen.getByRole('meter', { name: 'Special Attack' })).toHaveAttribute('aria-valuenow', '111')
    expect(screen.getByRole('meter', { name: 'Special Defense' })).toHaveAttribute('aria-valuenow', '22')
  })

  it('shows each stat value as visible text next to its label', () => {
    render(<CreatureStats creature={creature} />)

    const section = screen.getByRole('heading', { name: 'Base stats' }).parentElement as HTMLElement
    expect(within(section).getAllByText('45')).toHaveLength(2) // HP and Speed
    expect(within(section).getAllByText('65')).toHaveLength(2) // both special stats
  })

  it('formats height and weight with the active locale', async () => {
    await i18n.changeLanguage('fr')
    render(<CreatureStats creature={creature} />)

    const normalize = (text: string | null) => (text ?? '').replace(/[\u00a0\u202f]/g, ' ')
    expect(normalize(screen.getByText(i18n.t('creatures:detail.stats.height')).nextElementSibling?.textContent ?? null)).toBe('0,70 m')
    expect(normalize(screen.getByText(i18n.t('creatures:detail.stats.weight')).nextElementSibling?.textContent ?? null)).toBe('6,9 kg')
  })

  it('renders labels in the active language', async () => {
    await i18n.changeLanguage('fr')
    render(<CreatureStats creature={creature} />)

    expect(screen.getByRole('heading', { name: i18n.t('creatures:detail.stats.baseStats') })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Base stats' })).not.toBeInTheDocument()
  })
})
