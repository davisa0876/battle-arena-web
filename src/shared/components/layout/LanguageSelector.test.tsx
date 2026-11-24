import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { AppProviders } from '../../../app/providers/AppProviders'
import i18n from '../../../i18n'
import { LanguageSelector } from './LanguageSelector'

describe('LanguageSelector', () => {
  afterEach(async () => {
    localStorage.clear()
    await i18n.changeLanguage('en')
    document.documentElement.lang = 'en'
  })

  it('persists the selected language and syncs the html lang attribute', async () => {
    const user = userEvent.setup()
    localStorage.clear()
    await i18n.changeLanguage('en')

    render(
      <AppProviders>
        <LanguageSelector />
      </AppProviders>,
    )

    await user.selectOptions(screen.getByLabelText('Select language'), 'fr')

    await waitFor(() => {
      expect(localStorage.getItem('i18nextLng')).toBe('fr')
      expect(document.documentElement.lang).toBe('fr')
    })
  })
})
