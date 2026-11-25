import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enAuth from './locales/en/auth.json'
import enCollection from './locales/en/collection.json'
import enCommon from './locales/en/common.json'
import enCreatures from './locales/en/creatures.json'
import enErrors from './locales/en/errors.json'
import enGameRules from './locales/en/gameRules.json'
import enNavigation from './locales/en/navigation.json'
import enProfile from './locales/en/profile.json'
import enProgression from './locales/en/progression.json'
import enValidation from './locales/en/validation.json'
import esAuth from './locales/es/auth.json'
import esCollection from './locales/es/collection.json'
import esCommon from './locales/es/common.json'
import esCreatures from './locales/es/creatures.json'
import esErrors from './locales/es/errors.json'
import esGameRules from './locales/es/gameRules.json'
import esNavigation from './locales/es/navigation.json'
import esProfile from './locales/es/profile.json'
import esProgression from './locales/es/progression.json'
import esValidation from './locales/es/validation.json'
import frAuth from './locales/fr/auth.json'
import frCollection from './locales/fr/collection.json'
import frCommon from './locales/fr/common.json'
import frCreatures from './locales/fr/creatures.json'
import frErrors from './locales/fr/errors.json'
import frGameRules from './locales/fr/gameRules.json'
import frNavigation from './locales/fr/navigation.json'
import frProfile from './locales/fr/profile.json'
import frProgression from './locales/fr/progression.json'
import frValidation from './locales/fr/validation.json'
import itAuth from './locales/it/auth.json'
import itCollection from './locales/it/collection.json'
import itCommon from './locales/it/common.json'
import itCreatures from './locales/it/creatures.json'
import itErrors from './locales/it/errors.json'
import itGameRules from './locales/it/gameRules.json'
import itNavigation from './locales/it/navigation.json'
import itProfile from './locales/it/profile.json'
import itProgression from './locales/it/progression.json'
import itValidation from './locales/it/validation.json'
import ptBrAuth from './locales/pt-BR/auth.json'
import ptBrCollection from './locales/pt-BR/collection.json'
import ptBrCommon from './locales/pt-BR/common.json'
import ptBrCreatures from './locales/pt-BR/creatures.json'
import ptBrErrors from './locales/pt-BR/errors.json'
import ptBrGameRules from './locales/pt-BR/gameRules.json'
import ptBrNavigation from './locales/pt-BR/navigation.json'
import ptBrProfile from './locales/pt-BR/profile.json'
import ptBrProgression from './locales/pt-BR/progression.json'
import ptBrValidation from './locales/pt-BR/validation.json'

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

export const namespaces = [
  'common',
  'navigation',
  'creatures',
  'errors',
  'validation',
  'auth',
  'profile',
  'progression',
  'collection',
  'gameRules',
] as const

export const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    creatures: enCreatures,
    errors: enErrors,
    validation: enValidation,
    auth: enAuth,
    profile: enProfile,
    progression: enProgression,
    collection: enCollection,
    gameRules: enGameRules,
  },
  fr: {
    common: frCommon,
    navigation: frNavigation,
    creatures: frCreatures,
    errors: frErrors,
    validation: frValidation,
    auth: frAuth,
    profile: frProfile,
    progression: frProgression,
    collection: frCollection,
    gameRules: frGameRules,
  },
  'pt-BR': {
    common: ptBrCommon,
    navigation: ptBrNavigation,
    creatures: ptBrCreatures,
    errors: ptBrErrors,
    validation: ptBrValidation,
    auth: ptBrAuth,
    profile: ptBrProfile,
    progression: ptBrProgression,
    collection: ptBrCollection,
    gameRules: ptBrGameRules,
  },
  it: {
    common: itCommon,
    navigation: itNavigation,
    creatures: itCreatures,
    errors: itErrors,
    validation: itValidation,
    auth: itAuth,
    profile: itProfile,
    progression: itProgression,
    collection: itCollection,
    gameRules: itGameRules,
  },
  es: {
    common: esCommon,
    navigation: esNavigation,
    creatures: esCreatures,
    errors: esErrors,
    validation: esValidation,
    auth: esAuth,
    profile: esProfile,
    progression: esProgression,
    collection: esCollection,
    gameRules: esGameRules,
  },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: supportedLanguages,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [...namespaces],
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
