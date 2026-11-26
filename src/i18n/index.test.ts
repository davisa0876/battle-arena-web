import { describe, expect, it } from 'vitest'
import i18n, { languageLabels, normalizeLanguage, resources, supportedLanguages } from './index'

type Tree = { [key: string]: string | Tree }

const namespaces = [
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
  'pve',
  'pvp',
] as const

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      acc[path] = value
    } else {
      Object.assign(acc, flatten(value, path))
    }
    return acc
  }, {})
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1]).sort()
}

describe('normalizeLanguage', () => {
  it.each([
    ['pt', 'pt-BR'],
    ['pt-br', 'pt-BR'],
    ['PT-BR', 'pt-BR'],
    ['pt-BR', 'pt-BR'],
    ['fr', 'fr'],
    ['fr-FR', 'fr'],
    ['fr-CA', 'fr'],
    ['it', 'it'],
    ['it-IT', 'it'],
    ['es', 'es'],
    ['es-ES', 'es'],
    ['es-MX', 'es'],
    ['en', 'en'],
    ['en-US', 'en'],
    ['de', 'en'],
    ['zh-CN', 'en'],
    ['unknown', 'en'],
    ['', 'en'],
    ['   ', 'en'],
    ['  fr-FR  ', 'fr'],
  ])('maps %j to %s', (input, expected) => {
    expect(normalizeLanguage(input)).toBe(expected)
  })

  it('falls back to en for null and undefined', () => {
    expect(normalizeLanguage(null)).toBe('en')
    expect(normalizeLanguage(undefined)).toBe('en')
  })

  it('always returns a supported language', () => {
    for (const input of ['pt', 'fr-FR', 'xx', '', 'ES']) {
      expect(supportedLanguages).toContain(normalizeLanguage(input))
    }
  })
})

describe('supportedLanguages', () => {
  it('exposes the five supported languages', () => {
    expect(supportedLanguages).toHaveLength(5)
    expect([...supportedLanguages].sort()).toEqual(['en', 'es', 'fr', 'it', 'pt-BR'])
  })

  it('has a human-readable label for every language', () => {
    for (const language of supportedLanguages) {
      expect(languageLabels[language]).toBeTruthy()
    }
    expect(Object.keys(languageLabels).sort()).toEqual([...supportedLanguages].sort())
  })
})

describe('resources', () => {
  it('has an entry for every supported language', () => {
    expect(Object.keys(resources).sort()).toEqual([...supportedLanguages].sort())
  })

  it.each(supportedLanguages)('%s includes every registered namespace', (language) => {
    expect(Object.keys(resources[language]).sort()).toEqual([...namespaces].sort())
    for (const namespace of namespaces) {
      expect(Object.keys(resources[language][namespace]).length).toBeGreaterThan(0)
    }
  })

  describe.each(namespaces)('namespace %s', (namespace) => {
    const reference = flatten(resources.en[namespace] as Tree)

    it.each(supportedLanguages.filter((language) => language !== 'en'))(
      '%s has exactly the same keys as en',
      (language) => {
        const translated = flatten(resources[language][namespace] as Tree)

        expect(Object.keys(translated).sort()).toEqual(Object.keys(reference).sort())
      },
    )

    it.each(supportedLanguages)('%s has no empty translations and keeps the en interpolation variables', (language) => {
      const translated = flatten(resources[language][namespace] as Tree)

      for (const [key, value] of Object.entries(translated)) {
        expect(value.trim(), `${language}:${namespace}.${key} is empty`).not.toBe('')
        expect(placeholders(value), `${language}:${namespace}.${key} placeholders`).toEqual(
          placeholders(reference[key]),
        )
      }
    })
  })

  it.each(supportedLanguages)('%s defines the critical keys used by the UI', (language) => {
    const navigation = flatten(resources[language].navigation as Tree)
    const creatures = flatten(resources[language].creatures as Tree)
    const errors = flatten(resources[language].errors as Tree)

    for (const key of ['status.connecting', 'status.connected', 'status.offline', 'status.retry', 'language.label']) {
      expect(navigation[key], `navigation.${key}`).toBeTruthy()
    }
    for (const key of [
      'catalog.title',
      'catalog.ownedBadge',
      'catalog.viewDetails',
      'catalog.loading',
      'catalog.retry',
      'catalog.emptyTitle',
      'catalog.pagination.previous',
      'catalog.pagination.next',
      'catalog.filters.searchAction',
      'catalog.filters.clearAction',
      'detail.backToCatalog',
      'detail.ownedBadge',
      'detail.loading',
      'selection.add',
      'selection.owned',
      'selection.reasons.no_allowance',
      'image.fallback',
    ]) {
      expect(creatures[key], `creatures.${key}`).toBeTruthy()
    }
    for (const key of ['catalogLoad', 'notFound', 'detailLoad', 'missingSlug']) {
      expect(errors[key], `errors.${key}`).toBeTruthy()
    }
  })

  it.each(supportedLanguages)('%s defines the Phase 3 keys used by auth, profile, collection and rules', (language) => {
    const required: Record<(typeof namespaces)[number], string[]> = {
      common: [],
      creatures: [],
      navigation: ['login', 'register', 'gameRules', 'profile', 'myCollection', 'settings', 'logout', 'menu.open', 'menu.close', 'pve', 'pvp'],
      errors: ['unauthenticated', 'sessionExpired', 'tooManyRequests', 'validationFailed', 'rulesLoad', 'collectionLoad'],
      validation: ['required', 'invalidEmail', 'passwordTooShort', 'passwordMismatch', 'avatarType', 'avatarSize'],
      auth: ['login.title', 'register.title', 'forgot.title', 'reset.title', 'verify.title', 'passwordToggle.show'],
      profile: ['page.title', 'edit.title', 'public.collectionPrivate', 'stats.title', 'allowances.title', 'allowances.remaining', 'allowances.pvpLocked'],
      progression: ['level', 'xpProgress', 'maxLevel'],
      collection: ['title', 'starter.title', 'evolution.title', 'evolution.reasons.requirements_not_defined'],
      gameRules: [
        'title',
        'sections.a.title',
        'sections.b.title',
        'sections.c.title',
        'sections.d.title',
        'sections.e.title',
        'sections.f.title',
        'sections.b.stage1',
        'sections.c.pve',
        'sections.d.comingSoon',
        'features.pve',
        'features.pvp',
      ],
      pve: ['title'],
      pvp: ['title', 'form.submit', 'actions.accept', 'realtime.status'],
    }

    for (const namespace of namespaces) {
      const tree = flatten(resources[language][namespace] as Tree)
      for (const key of required[namespace]) {
        expect(tree[key], `${language}:${namespace}.${key}`).toBeTruthy()
      }
    }
  })

  it('translates en and fr navigation status differently', () => {
    const en = flatten(resources.en.navigation as Tree)
    const fr = flatten(resources.fr.navigation as Tree)

    expect(en['status.connected']).toBe('API Connected')
    expect(fr['status.connected']).not.toBe(en['status.connected'])
  })
})

describe('i18n instance', () => {
  it('is initialized with the expected namespaces and fallback', () => {
    expect(i18n.isInitialized).toBe(true)
    expect(i18n.options.fallbackLng).toEqual(['en'])
    expect(i18n.options.defaultNS).toBe('common')
    expect(i18n.options.ns).toEqual([...namespaces])
  })

  it('translates keys and interpolates values', async () => {
    await i18n.changeLanguage('en')

    expect(i18n.t('navigation:status.connected')).toBe('API Connected')
    expect(i18n.t('creatures:catalog.pagination.page', { page: 2, lastPage: 5 })).toBe('Page 2 / 5')

    await i18n.changeLanguage('en')
  })
})
