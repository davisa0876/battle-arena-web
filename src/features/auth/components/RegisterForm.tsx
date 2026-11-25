import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '../../../shared/components/forms/FormField'
import { Alert } from '../../../shared/components/ui/Alert'
import { Button } from '../../../shared/components/ui/Button'
import { useFormSubmission } from '../../../shared/hooks/useFormSubmission'
import {
  compactErrors,
  confirmationErrors,
  emailErrors,
  passwordErrors,
  required,
} from '../../../shared/lib/validation/forms'
import { useAuth } from '../hooks/useAuth'

export function RegisterForm() {
  const { t } = useTranslation(['auth', 'validation'])
  const { register } = useAuth()
  const { submitting, fieldErrors, formError, submit, fail } = useFormSubmission()
  const [values, setValues] = useState({
    email: '',
    handle: '',
    display_name: '',
    password: '',
    password_confirmation: '',
  })

  const bind = (field: keyof typeof values) => ({
    name: field,
    value: values[field],
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [field]: event.target.value })),
    error: fieldErrors[field]?.[0],
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors = compactErrors({
      email: emailErrors(values.email, t),
      handle: required(values.handle, t),
      display_name: required(values.display_name, t),
      password: passwordErrors(values.password, t),
      password_confirmation: confirmationErrors(values.password, values.password_confirmation, t),
    })
    if (Object.keys(errors).length > 0) {
      fail(errors)
      return
    }

    await submit(async () => {
      await register({
        email: values.email.trim(),
        handle: values.handle.trim(),
        display_name: values.display_name.trim(),
        password: values.password,
        password_confirmation: values.password_confirmation,
      })
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
      {formError && <Alert variant="error">{formError}</Alert>}
      <FormField label={t('auth:fields.email')} type="email" autoComplete="email" required {...bind('email')} />
      <FormField
        label={t('auth:fields.handle')}
        hint={t('auth:hints.handle')}
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        {...bind('handle')}
      />
      <FormField
        label={t('auth:fields.displayName')}
        hint={t('auth:hints.displayName')}
        type="text"
        autoComplete="nickname"
        required
        {...bind('display_name')}
      />
      <FormField
        label={t('auth:fields.password')}
        type="password"
        autoComplete="new-password"
        required
        {...bind('password')}
      />
      <FormField
        label={t('auth:fields.passwordConfirmation')}
        type="password"
        autoComplete="new-password"
        required
        {...bind('password_confirmation')}
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? t('auth:register.submitting') : t('auth:register.submit')}
      </Button>
    </form>
  )
}
