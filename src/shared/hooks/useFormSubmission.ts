import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, type ValidationErrors } from '../lib/api/client'

export interface FormSubmission {
  submitting: boolean
  /** Field → messages, from the API's 422 payload and/or client-side checks. */
  fieldErrors: ValidationErrors
  /** Non-field error (network, 401/403/429, generic 422 message...). */
  formError: string | null
  /**
   * Runs `action`; resolves true on success. API validation errors are mapped onto fields,
   * everything else becomes `formError`.
   */
  submit: (action: () => Promise<void>) => Promise<boolean>
  /** Records client-side errors without calling the API. */
  fail: (errors: ValidationErrors) => void
  clear: () => void
}

export function useFormSubmission(): FormSubmission {
  const { t } = useTranslation('errors')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const clear = useCallback(() => {
    setFieldErrors({})
    setFormError(null)
  }, [])

  const fail = useCallback((errors: ValidationErrors) => {
    setFormError(null)
    setFieldErrors(errors)
  }, [])

  const submit = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      setSubmitting(true)
      setFieldErrors({})
      setFormError(null)

      try {
        await action()
        return true
      } catch (error) {
        if (error instanceof ApiError) {
          if (Object.keys(error.errors).length > 0) {
            setFieldErrors(error.errors)
          }
          // Show the summary too unless it only repeats a field message.
          if (Object.keys(error.errors).length === 0 || error.status !== 422) {
            setFormError(error.message)
          }
        } else {
          setFormError(t('generic'))
        }
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [t],
  )

  return { submitting, fieldErrors, formError, submit, fail, clear }
}
