import { useTranslation } from 'react-i18next'
import { languageLabels, normalizeLanguage, supportedLanguages } from '../../../i18n'

export function LanguageSelector() {
  const { i18n, t } = useTranslation('navigation')
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-2 text-xs font-semibold text-arena-300 shadow-card backdrop-blur">
      <span className="sr-only">{t('language.label')}</span>
      <span aria-hidden="true">{t('language.shortLabel')}</span>
      <select
        value={currentLanguage}
        onChange={(event) => void i18n.changeLanguage(normalizeLanguage(event.target.value))}
        className="cursor-pointer border-0 bg-transparent font-semibold text-white outline-none"
        aria-label={t('language.label')}
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language} className="bg-background text-white">
            {languageLabels[language]}
          </option>
        ))}
      </select>
    </label>
  )
}
