import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '../../../i18n'
import { makeProgress } from '../../../test/authTestUtils'
import { PlayerLevelBadge } from './PlayerLevelBadge'
import { XpProgressBar } from './XpProgressBar'

describe('XpProgressBar', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('exposes API progress as an accessible progressbar', () => {
    render(<XpProgressBar progress={makeProgress({ xp_into_level: 1250, xp_for_next_level: 2250, progress_percent: 55.5 })} />)

    const bar = screen.getByRole('progressbar', { name: 'Progress to the next level' })
    expect(bar).toHaveAttribute('aria-valuenow', '56')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(screen.getByText('1,250 / 2,250 XP')).toBeInTheDocument()
    expect(screen.getByText('100 XP to level 4')).toBeInTheDocument()
  })

  it('shows "max level" instead of a target at the cap', () => {
    render(
      <XpProgressBar
        progress={makeProgress({
          level: 100,
          is_max_level: true,
          xp_for_next_level: null,
          xp_to_next_level: null,
          progress_percent: 100,
        })}
      />,
    )

    expect(screen.getByText('Max level reached')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    expect(screen.queryByText(/XP to level/)).not.toBeInTheDocument()
  })
})

describe('PlayerLevelBadge', () => {
  it('renders full and short level labels', () => {
    const { rerender } = render(<PlayerLevelBadge level={7} />)
    expect(screen.getByText('Level 7')).toBeInTheDocument()

    rerender(<PlayerLevelBadge level={7} variant="short" />)
    expect(screen.getByText('Lv. 7')).toBeInTheDocument()
  })
})
