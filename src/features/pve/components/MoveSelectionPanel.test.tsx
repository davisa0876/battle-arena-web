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

  it('keeps fixed-width cards for large loadouts', async () => {
    await i18n.changeLanguage('en')
    const moves = Array.from({ length: 8 }, (_, index) =>
      move({ id: index + 1, name: `Move ${index + 1}`, type: 'dark' }),
    )

    const { container } = render(
      <div style={{ width: 420 }}>
        <MoveSelectionPanel
          moves={moves}
          disabled={false}
          canBasicStrike={false}
          canRecoverSkip={false}
          onAttack={() => undefined}
          onBasicStrike={() => undefined}
          onRecoverSkip={() => undefined}
        />
      </div>,
    )

    for (const item of moves) {
      expect(screen.getByRole('button', { name: new RegExp(`^${item.name}(?![0-9])`, 'i') })).toBeInTheDocument()
    }

    const card = screen.getByRole('button', { name: /^Move 1(?![0-9])/i })
    expect(card).toHaveStyle({ width: '152px', minWidth: '152px', maxWidth: '152px' })
    expect(container.querySelector('.overflow-x-auto')).not.toBeNull()
  })
})
