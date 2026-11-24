import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../../../i18n'
import { CreatureImage } from './CreatureImage'

describe('CreatureImage', () => {
  it('shows a neutral fallback when no source is provided', () => {
    render(<CreatureImage src={null} alt="Mystic Beast" className="aspect-square" />)

    expect(screen.getByRole('img', { name: 'No artwork available for Mystic Beast' })).toBeInTheDocument()
    expect(screen.getByText('MB')).toBeInTheDocument()
  })

  it('hides broken artwork after an image error', () => {
    render(<CreatureImage src="https://example.test/missing.png" alt="Dragon" className="aspect-square" />)

    fireEvent.error(screen.getByAltText('Dragon'))

    expect(screen.getByRole('img', { name: 'No artwork available for Dragon' })).toBeInTheDocument()
    expect(screen.queryByAltText('Dragon')).not.toBeInTheDocument()
  })
})
