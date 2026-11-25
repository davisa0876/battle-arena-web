import type { TFunction } from 'i18next'
import type { ValidationErrors } from '../api/client'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Client-side preflight only: the API stays the source of truth for validation. */
export const MIN_PASSWORD_LENGTH = 8

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export function required(value: string, t: TFunction): string[] {
  return value.trim() === '' ? [t('validation:required')] : []
}

export function emailErrors(value: string, t: TFunction): string[] {
  if (value.trim() === '') {
    return [t('validation:required')]
  }
  return isValidEmail(value) ? [] : [t('validation:invalidEmail')]
}

export function passwordErrors(value: string, t: TFunction): string[] {
  if (value === '') {
    return [t('validation:required')]
  }
  return value.length < MIN_PASSWORD_LENGTH
    ? [t('validation:passwordTooShort', { min: MIN_PASSWORD_LENGTH })]
    : []
}

export function confirmationErrors(password: string, confirmation: string, t: TFunction): string[] {
  if (confirmation === '') {
    return [t('validation:required')]
  }
  return password === confirmation ? [] : [t('validation:passwordMismatch')]
}

/** Drops fields without messages so `Object.keys(result).length === 0` means "valid". */
export function compactErrors(errors: ValidationErrors): ValidationErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, messages]) => messages.length > 0))
}
