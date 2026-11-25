import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '../../../shared/components/forms/FormField'
import { Alert } from '../../../shared/components/ui/Alert'
import { Button } from '../../../shared/components/ui/Button'
import { useFormSubmission } from '../../../shared/hooks/useFormSubmission'
import { compactErrors, confirmationErrors, passwordErrors, required } from '../../../shared/lib/validation/forms'
import { updatePassword } from '../api/profile'

export function PasswordForm() {
  const { t } = useTranslation(['profile', 'validation'])
  const { submitting, fieldErrors, formError, submit, fail } = useFormSubmission()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaved(false)

    const errors = compactErrors({
      current_password: required(current, t),
      password: passwordErrors(password, t),
      password_confirmation: confirmationErrors(password, confirmation, t),
    })
    if (Object.keys(errors).length > 0) {
      fail(errors)
      return
    }

    const ok = await submit(() =>
      updatePassword({ current_password: current, password, password_confirmation: confirmation }),
    )
    if (ok) {
      setCurrent('')
      setPassword('')
      setConfirmation('')
    }
    setSaved(ok)
  }

  return (
    <section
      aria-labelledby="password-section-heading"
      className="rounded-[24px] border border-border bg-surface/70 p-6 shadow-card"
    >
      <h2 id="password-section-heading" className="mb-4 mt-0 font-display text-xl font-semibold text-white">
        {t('profile:edit.passwordSection')}
      </h2>
      <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        {saved && <Alert variant="success">{t('profile:edit.passwordChanged')}</Alert>}
        <FormField
          label={t('profile:edit.currentPassword')}
          type="password"
          name="current_password"
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          error={fieldErrors.current_password?.[0]}
          required
        />
        <FormField
          label={t('profile:edit.newPassword')}
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password?.[0]}
          required
        />
        <FormField
          label={t('profile:edit.confirmPassword')}
          type="password"
          name="password_confirmation"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={fieldErrors.password_confirmation?.[0]}
          required
        />
        <Button type="submit" disabled={submitting} className="self-start">
          {submitting ? t('profile:edit.changingPassword') : t('profile:edit.changePassword')}
        </Button>
      </form>
    </section>
  )
}
