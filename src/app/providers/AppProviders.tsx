import { type ReactNode, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from '../../features/auth/context/AuthProvider'
import { normalizeLanguage } from '../../i18n'

interface AppProvidersProps {
  children: ReactNode
}

function LanguageDocumentSync() {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
  }, [i18n.language, i18n.resolvedLanguage])

  return null
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageDocumentSync />
        {children}
      </AuthProvider>
    </BrowserRouter>
  )
}
