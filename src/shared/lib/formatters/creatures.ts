import i18n, { normalizeLanguage } from '../../../i18n'

function resolveLocale(locale?: string): string {
  return locale ?? normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
}

function formatUnit(value: number, unit: 'meter' | 'kilogram', fractionDigits: number, locale?: string): string {
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

/** Formats a height stored in centimeters as meters using the given (or current) locale. */
export function formatHeight(value: number | null, fallback: string, locale?: string): string {
  return value == null ? fallback : formatUnit(value / 100, 'meter', 2, locale)
}

/** Formats a weight stored in grams as kilograms using the given (or current) locale. */
export function formatWeight(value: number | null, fallback: string, locale?: string): string {
  return value == null ? fallback : formatUnit(value / 1000, 'kilogram', 1, locale)
}
