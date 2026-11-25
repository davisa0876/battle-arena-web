import { type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, useId } from 'react'
import { PasswordInput } from './PasswordInput'

export const inputClassName =
  'w-full rounded-xl border bg-background px-4 py-3 text-sm text-white placeholder:text-arena-300/40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-electric disabled:opacity-60'

interface FieldChrome {
  label: string
  hint?: string
  error?: string
}

interface ControlA11y {
  id: string
  className: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
}

/** Label + hint + error scaffolding; `children` receives the props the control must spread. */
function Field({
  id: providedId,
  label,
  hint,
  error,
  children,
}: FieldChrome & { id?: string; children: (control: ControlA11y) => ReactNode }) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-white">
        {label}
      </label>
      {children({
        id,
        className: `${inputClassName} ${error ? 'border-signal-bad' : 'border-border'}`,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
      })}
      {hint && (
        <p id={hintId} className="m-0 text-xs text-arena-300/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="m-0 text-xs font-semibold text-signal-bad">
          {error}
        </p>
      )}
    </div>
  )
}

type FormFieldProps = FieldChrome & InputHTMLAttributes<HTMLInputElement>

/** Text-like input (type="password" gets the show/hide toggle). */
export function FormField({ label, hint, error, id, ...inputProps }: FormFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {(control) =>
        inputProps.type === 'password' ? (
          <PasswordInput {...inputProps} {...control} />
        ) : (
          <input {...inputProps} {...control} />
        )
      }
    </Field>
  )
}

type TextAreaFieldProps = FieldChrome & TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextAreaField({ label, hint, error, id, ...textareaProps }: TextAreaFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {(control) => <textarea rows={4} {...textareaProps} {...control} />}
    </Field>
  )
}
