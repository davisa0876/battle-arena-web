import { type InputHTMLAttributes, useState } from 'react'
import { useTranslation } from 'react-i18next'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/** Password field with an accessible show/hide toggle. */
export function PasswordInput({ className = '', id, ...props }: PasswordInputProps) {
  const { t } = useTranslation('auth')
  const [visible, setVisible] = useState(false)
  const label = visible ? t('passwordToggle.hide') : t('passwordToggle.show')

  return (
    <div className="relative">
      <input {...props} id={id} type={visible ? 'text' : 'password'} className={`${className} pr-24`} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-controls={id}
        className="absolute inset-y-1.5 right-1.5 cursor-pointer rounded-lg border-0 bg-surface px-3 text-xs font-bold text-electric focus-visible:outline-2 focus-visible:outline-electric"
      >
        {label}
      </button>
    </div>
  )
}
