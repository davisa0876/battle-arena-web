import { afterEach, describe, expect, it } from 'vitest'
import i18n from '../../../i18n'
import { formatHeight, formatWeight } from './creatures'

/** Intl may use non-breaking spaces between number and unit; normalize for stable assertions. */
const plain = (value: string) => value.replace(/[\u00a0\u202f]/g, ' ')

describe('formatHeight', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it.each([
    [0, '0.00 m'],
    [70, '0.70 m'],
    [155, '1.55 m'],
    [1, '0.01 m'],
    [1000, '10.00 m'],
  ])('formats %s cm as "%s" in English', (value, expected) => {
    expect(plain(formatHeight(value, '—', 'en'))).toBe(expected)
  })

  it('returns the fallback for null', () => {
    expect(formatHeight(null, '—')).toBe('—')
    expect(formatHeight(null, 'n/a')).toBe('n/a')
  })

  it('does not use the fallback for zero', () => {
    expect(formatHeight(0, 'fallback')).not.toBe('fallback')
  })

  it.each([
    ['fr', '1,55 m'],
    ['pt-BR', '1,55 m'],
    ['it', '1,55 m'],
    ['es', '1,55 m'],
  ])('uses locale decimal separators for %s', (locale, expected) => {
    expect(plain(formatHeight(155, '—', locale))).toBe(expected)
  })

  it('defaults to the current i18n language', async () => {
    await i18n.changeLanguage('fr')

    expect(plain(formatHeight(155, '—'))).toBe('1,55 m')
  })
})

describe('formatWeight', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it.each([
    [0, '0.0 kg'],
    [6900, '6.9 kg'],
    [8500, '8.5 kg'],
    [100, '0.1 kg'],
    [100000, '100.0 kg'],
  ])('formats %s g as "%s" in English', (value, expected) => {
    expect(plain(formatWeight(value, '—', 'en'))).toBe(expected)
  })

  it('returns the fallback for null', () => {
    expect(formatWeight(null, '—')).toBe('—')
    expect(formatWeight(null, 'n/a')).toBe('n/a')
  })

  it('does not use the fallback for zero', () => {
    expect(formatWeight(0, 'fallback')).not.toBe('fallback')
  })

  it.each([
    ['fr', '6,9 kg'],
    ['pt-BR', '6,9 kg'],
    ['it', '6,9 kg'],
    ['es', '6,9 kg'],
  ])('uses locale decimal separators for %s', (locale, expected) => {
    expect(plain(formatWeight(6900, '—', locale))).toBe(expected)
  })

  it('defaults to the current i18n language', async () => {
    await i18n.changeLanguage('pt-BR')

    expect(plain(formatWeight(6900, '—'))).toBe('6,9 kg')
  })
})
