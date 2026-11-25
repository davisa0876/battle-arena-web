import i18n, { normalizeLanguage } from '../../../i18n'

function resolveLocale(locale?: string): string {
  return locale ?? normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
}

/** Locale-aware number formatting (never hardcode separators). */
export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(resolveLocale(locale)).format(value)
}

/** Locale-aware medium date; returns an empty string for missing/invalid input. */
export function formatDate(value: string | null | undefined, locale?: string): string {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(resolveLocale(locale), { dateStyle: 'medium' }).format(date)
}
