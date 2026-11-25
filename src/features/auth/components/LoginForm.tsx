import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '../../../shared/components/forms/FormField'
import { Alert } from '../../../shared/components/ui/Alert'
import { Button } from '../../../shared/components/ui/Button'
import { useFormSubmission } from '../../../shared/hooks/useFormSubmission'
import { compactErrors, emailErrors, required } from '../../../shared/lib/validation/forms'
import { useAuth } from '../hooks/useAuth'

export function LoginForm() {
  const { t } = useTranslation(['auth', 'validation'])
  const { login } = useAuth()
  const { submitting, fieldErrors, formError, submit, fail } = useFormSubmission()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors = compactErrors({
      email: emailErrors(email, t),
      password: required(password, t),
    })
    if (Object.keys(errors).length > 0) {
      fail(errors)
      return
    }

    await submit(async () => {
      await login({ email: email.trim(), password })
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
      {formError && <Alert variant="error">{formError}</Alert>}
      <FormField
        label={t('auth:fields.email')}
        type="email"
        name="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email?.[0]}
        required
      />
      <FormField
        label={t('auth:fields.password')}
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password?.[0]}
        required
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? t('auth:login.submitting') : t('auth:login.submit')}
      </Button>
    </form>
  )
}
