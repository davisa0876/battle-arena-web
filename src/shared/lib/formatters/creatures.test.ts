import { describe, expect, it } from 'vitest'
import { formatHeight, formatWeight } from './creatures'

describe('formatHeight', () => {
  it.each([
    [0, '0.00 m'],
    [70, '0.70 m'],
    [155, '1.55 m'],
    [1, '0.01 m'],
    [1000, '10.00 m'],
  ])('formats %s cm as "%s"', (value, expected) => {
    expect(formatHeight(value, '—')).toBe(expected)
  })

  it('returns the fallback for null', () => {
    expect(formatHeight(null, '—')).toBe('—')
    expect(formatHeight(null, 'n/a')).toBe('n/a')
  })

  it('does not use the fallback for zero', () => {
    expect(formatHeight(0, 'fallback')).not.toBe('fallback')
  })
})

describe('formatWeight', () => {
  it.each([
    [0, '0.0 kg'],
    [6900, '6.9 kg'],
    [8500, '8.5 kg'],
    [100, '0.1 kg'],
    [100000, '100.0 kg'],
  ])('formats %s g as "%s"', (value, expected) => {
    expect(formatWeight(value, '—')).toBe(expected)
  })

  it('returns the fallback for null', () => {
    expect(formatWeight(null, '—')).toBe('—')
    expect(formatWeight(null, 'n/a')).toBe('n/a')
  })

  it('does not use the fallback for zero', () => {
    expect(formatWeight(0, 'fallback')).not.toBe('fallback')
  })
})
