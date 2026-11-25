import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '../../../shared/components/forms/FormField'
import { Alert } from '../../../shared/components/ui/Alert'
import { Button } from '../../../shared/components/ui/Button'
import { useFormSubmission } from '../../../shared/hooks/useFormSubmission'
import { compactErrors, emailErrors } from '../../../shared/lib/validation/forms'
import { forgotPassword } from '../api/auth'

export function ForgotPasswordForm() {
  const { t } = useTranslation(['auth', 'validation'])
  const { submitting, fieldErrors, formError, submit, fail } = useFormSubmission()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors = compactErrors({ email: emailErrors(email, t) })
    if (Object.keys(errors).length > 0) {
      fail(errors)
      return
    }

    setSent(await submit(() => forgotPassword(email.trim())))
  }

  if (sent) {
    return <Alert variant="success">{t('auth:forgot.sent')}</Alert>
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
      {formError && <Alert variant="error">{formError}</Alert>}
      <FormField
        label={t('auth:fields.email')}
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email?.[0]}
        required
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? t('auth:forgot.submitting') : t('auth:forgot.submit')}
      </Button>
    </form>
  )
}
