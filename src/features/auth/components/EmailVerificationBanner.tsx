import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../../shared/components/ui/Alert'
import { Button } from '../../../shared/components/ui/Button'
import { useFormSubmission } from '../../../shared/hooks/useFormSubmission'
import { resendVerificationEmail } from '../api/auth'

/** Shown to authenticated users whose email is not verified yet. */
export function EmailVerificationBanner() {
  const { t } = useTranslation('auth')
  const { submitting, formError, submit } = useFormSubmission()
  const [sent, setSent] = useState(false)

  const resend = async () => {
    setSent(false)
    setSent(await submit(resendVerificationEmail))
  }

  return (
    <Alert variant="info" className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <span>{sent ? t('verifyBanner.resent') : (formError ?? t('verifyBanner.message'))}</span>
      {!sent && (
        <Button variant="secondary" onClick={() => void resend()} disabled={submitting}>
          {submitting ? t('verifyBanner.resending') : t('verifyBanner.resend')}
        </Button>
      )}
    </Alert>
  )
}
