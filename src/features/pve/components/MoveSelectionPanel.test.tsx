import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import type { BattleMove } from '../types/battle'
import { MoveSelectionPanel } from './MoveSelectionPanel'

function move(partial: Partial<BattleMove> & Pick<BattleMove, 'id' | 'name'>): BattleMove {
  return {
    slug: partial.name.toLowerCase(),
    power: 40,
    accuracy: 100,
    type: 'normal',
    damage_class: 'physical',
    pp: { current: 10, max: 10 },
    stamina_cost: 15,
    can_use: true,
    ...partial,
  }
}

describe('MoveSelectionPanel', () => {
  it('keeps a manually selected move after parent refreshes the moves array', async () => {
    await i18n.changeLanguage('en')
    const user = userEvent.setup()
    const onAttack = vi.fn()
    const moves = [
      move({ id: 1, name: 'Confusion', type: 'psychic' }),
      move({ id: 2, name: 'Psybeam', type: 'psychic' }),
    ]

    const { rerender } = render(
      <MoveSelectionPanel
        moves={moves}
        disabled={false}
        canBasicStrike={false}
        canRecoverSkip={false}
        onAttack={onAttack}
        onBasicStrike={() => undefined}
        onRecoverSkip={() => undefined}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Psybeam/i }))
    // New array identity (hydrate) must not snap selection back to Confusion.
    rerender(
      <MoveSelectionPanel
        moves={moves.map((item) => ({ ...item }))}
        disabled={false}
        canBasicStrike={false}
        canRecoverSkip={false}
        onAttack={onAttack}
        onBasicStrike={() => undefined}
        onRecoverSkip={() => undefined}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Use Psybeam/i }))
    expect(onAttack).toHaveBeenCalledWith(2)
  })
})
