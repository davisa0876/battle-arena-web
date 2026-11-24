import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import enCreatures from './locales/en/creatures.json'
import enErrors from './locales/en/errors.json'
import enNavigation from './locales/en/navigation.json'
import esCommon from './locales/es/common.json'
import esCreatures from './locales/es/creatures.json'
import esErrors from './locales/es/errors.json'
import esNavigation from './locales/es/navigation.json'
import frCommon from './locales/fr/common.json'
import frCreatures from './locales/fr/creatures.json'
import frErrors from './locales/fr/errors.json'
import frNavigation from './locales/fr/navigation.json'
import itCommon from './locales/it/common.json'
import itCreatures from './locales/it/creatures.json'
import itErrors from './locales/it/errors.json'
import itNavigation from './locales/it/navigation.json'
import ptBrCommon from './locales/pt-BR/common.json'
import ptBrCreatures from './locales/pt-BR/creatures.json'
import ptBrErrors from './locales/pt-BR/errors.json'
import ptBrNavigation from './locales/pt-BR/navigation.json'

export const supportedLanguages = ['en', 'fr', 'pt-BR', 'it', 'es'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  'pt-BR': 'Português (BR)',
  it: 'Italiano',
  es: 'Español',
}

export function normalizeLanguage(language: string | undefined | null): SupportedLanguage {
  const normalized = (language ?? '').trim()
  const lower = normalized.toLowerCase()

  if (lower === 'pt' || lower === 'pt-br') {
    return 'pt-BR'
  }
  if (lower.startsWith('fr')) {
    return 'fr'
  }
  if (lower.startsWith('it')) {
    return 'it'
  }
  if (lower.startsWith('es')) {
    return 'es'
  }

  return 'en'
}

export const resources = {
  en: { common: enCommon, navigation: enNavigation, creatures: enCreatures, errors: enErrors },
  fr: { common: frCommon, navigation: frNavigation, creatures: frCreatures, errors: frErrors },
  'pt-BR': { common: ptBrCommon, navigation: ptBrNavigation, creatures: ptBrCreatures, errors: ptBrErrors },
  it: { common: itCommon, navigation: itNavigation, creatures: itCreatures, errors: itErrors },
  es: { common: esCommon, navigation: esNavigation, creatures: esCreatures, errors: esErrors },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: supportedLanguages,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'creatures', 'errors'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: normalizeLanguage,
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
