import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatBar } from './StatBar'

function fillOf(meter: HTMLElement): HTMLElement {
  return meter.firstElementChild as HTMLElement
}

describe('StatBar', () => {
  it('renders the label, the value and an accessible meter', () => {
    render(<StatBar label="Attack" value={52} />)

    expect(screen.getByText('Attack')).toBeInTheDocument()
    expect(screen.getByText('52')).toBeInTheDocument()

    const meter = screen.getByRole('meter', { name: 'Attack' })
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '160')
    expect(meter).toHaveAttribute('aria-valuenow', '52')
  })

  it.each([
    [80, '50%'],
    [160, '100%'],
    [40, '25%'],
    [100, '63%'], // 62.5 rounds to 63
  ])('fills value %s to %s of the default max (160)', (value, width) => {
    render(<StatBar label="Stat" value={value} />)

    expect(fillOf(screen.getByRole('meter')).style.width).toBe(width)
  })

  it('clamps the fill to a 4% minimum so empty/tiny stats stay visible', () => {
    const { rerender } = render(<StatBar label="Stat" value={0} />)
    expect(fillOf(screen.getByRole('meter')).style.width).toBe('4%')

    rerender(<StatBar label="Stat" value={1} />)
    expect(fillOf(screen.getByRole('meter')).style.width).toBe('4%')

    rerender(<StatBar label="Stat" value={-50} />)
    expect(fillOf(screen.getByRole('meter')).style.width).toBe('4%')
  })

  it('clamps the fill to 100% when the value exceeds max', () => {
    render(<StatBar label="Stat" value={255} />)

    expect(fillOf(screen.getByRole('meter')).style.width).toBe('100%')
    // The reported value is not clamped, only the visual width.
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '255')
  })

  it('respects a custom max for both fill and aria-valuemax', () => {
    render(<StatBar label="Stat" value={50} max={100} />)

    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
    expect(fillOf(meter).style.width).toBe('50%')
  })

  it('updates the fill when the value changes', () => {
    const { rerender } = render(<StatBar label="Speed" value={40} />)
    expect(fillOf(screen.getByRole('meter')).style.width).toBe('25%')

    rerender(<StatBar label="Speed" value={120} />)
    expect(fillOf(screen.getByRole('meter')).style.width).toBe('75%')
    expect(screen.getByText('120')).toBeInTheDocument()
  })
})
