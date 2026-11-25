import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FormField } from '../../../shared/components/forms/FormField'
import { Alert } from '../../../shared/components/ui/Alert'
import { Button, buttonClassName } from '../../../shared/components/ui/Button'
import { useFormSubmission } from '../../../shared/hooks/useFormSubmission'
import {
  compactErrors,
  confirmationErrors,
  emailErrors,
  passwordErrors,
} from '../../../shared/lib/validation/forms'
import { resetPassword } from '../api/auth'

interface ResetPasswordFormProps {
  token: string
  initialEmail: string
}

export function ResetPasswordForm({ token, initialEmail }: ResetPasswordFormProps) {
  const { t } = useTranslation(['auth', 'validation'])
  const { submitting, fieldErrors, formError, submit, fail } = useFormSubmission()
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors = compactErrors({
      email: emailErrors(email, t),
      password: passwordErrors(password, t),
      password_confirmation: confirmationErrors(password, confirmation, t),
    })
    if (Object.keys(errors).length > 0) {
      fail(errors)
      return
    }

    setDone(
      await submit(() =>
        resetPassword({
          token,
          email: email.trim(),
          password,
          password_confirmation: confirmation,
        }),
      ),
    )
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success">{t('auth:reset.success')}</Alert>
        <Link to="/login" className={buttonClassName('primary')}>
          {t('auth:reset.loginLink')}
        </Link>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
      {formError && <Alert variant="error">{formError}</Alert>}
      {fieldErrors.token && <Alert variant="error">{fieldErrors.token[0]}</Alert>}
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
      <FormField
        label={t('auth:fields.password')}
        type="password"
        name="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password?.[0]}
        required
      />
      <FormField
        label={t('auth:fields.passwordConfirmation')}
        type="password"
        name="password_confirmation"
        autoComplete="new-password"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        error={fieldErrors.password_confirmation?.[0]}
        required
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? t('auth:reset.submitting') : t('auth:reset.submit')}
      </Button>
    </form>
  )
}
