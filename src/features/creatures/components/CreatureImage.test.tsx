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

  it('shows a loading indicator and a transparent image until the artwork loads', () => {
    render(<CreatureImage src="https://example.test/loading.png" alt="Dragon" />)

    expect(screen.getByText('Loading image...')).toBeInTheDocument()
    expect(screen.getByAltText('Dragon')).toHaveClass('opacity-0')
    expect(screen.queryByRole('img', { name: /No artwork available/ })).not.toBeInTheDocument()
  })

  it('reveals the artwork and removes the loading indicator after a successful load', () => {
    render(<CreatureImage src="https://example.test/ok.png" alt="Dragon" />)

    fireEvent.load(screen.getByAltText('Dragon'))

    const image = screen.getByAltText('Dragon')
    expect(image).toHaveAttribute('src', 'https://example.test/ok.png')
    expect(image).toHaveClass('opacity-100')
    expect(image).not.toHaveClass('opacity-0')
    expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /No artwork available/ })).not.toBeInTheDocument()
  })

  it('uses lazy, async decoding for the artwork', () => {
    render(<CreatureImage src="https://example.test/ok.png" alt="Dragon" />)

    expect(screen.getByAltText('Dragon')).toHaveAttribute('loading', 'lazy')
    expect(screen.getByAltText('Dragon')).toHaveAttribute('decoding', 'async')
  })

  it('applies the provided className to the wrapper', () => {
    const { container } = render(<CreatureImage src={null} alt="Dragon" className="aspect-square custom-class" />)

    expect(container.firstElementChild).toHaveClass('aspect-square', 'custom-class')
  })

  it('restarts loading when the src changes after a failure', () => {
    const { rerender } = render(<CreatureImage src="https://example.test/broken.png" alt="Dragon" />)
    fireEvent.error(screen.getByAltText('Dragon'))
    expect(screen.queryByAltText('Dragon')).not.toBeInTheDocument()

    rerender(<CreatureImage src="https://example.test/fixed.png" alt="Dragon" />)

    expect(screen.getByAltText('Dragon')).toHaveAttribute('src', 'https://example.test/fixed.png')
    expect(screen.getByText('Loading image...')).toBeInTheDocument()
  })

  it('switches to the fallback when the src becomes empty', () => {
    const { rerender } = render(<CreatureImage src="https://example.test/ok.png" alt="Dragon" />)
    fireEvent.load(screen.getByAltText('Dragon'))

    rerender(<CreatureImage src={null} alt="Dragon" />)

    expect(screen.queryByAltText('Dragon')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'No artwork available for Dragon' })).toBeInTheDocument()
  })

  it.each([
    ['Mystic Beast', 'MB'],
    ['Charmander', 'C'],
    ['Mr Mime Jr', 'MM'],
    ['  ', 'BA'],
    ['', 'BA'],
  ])('derives the fallback initials for "%s" as "%s"', (alt, initials) => {
    render(<CreatureImage src={null} alt={alt} />)

    expect(screen.getByText(initials)).toBeInTheDocument()
  })
})
