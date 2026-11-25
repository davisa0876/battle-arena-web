import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField, TextAreaField } from '../../../shared/components/forms/FormField'
import { Alert } from '../../../shared/components/ui/Alert'
import { Button } from '../../../shared/components/ui/Button'
import { useFormSubmission } from '../../../shared/hooks/useFormSubmission'
import { compactErrors, required } from '../../../shared/lib/validation/forms'
import { updateProfile } from '../api/profile'
import type { PlayerProfile, UpdateProfilePayload } from '../types'

interface ProfileFormProps {
  profile: PlayerProfile
  onSaved: () => Promise<unknown>
}

export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const { t } = useTranslation(['profile', 'validation', 'auth'])
  const { submitting, fieldErrors, formError, submit, fail } = useFormSubmission()
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [handle, setHandle] = useState(profile.handle)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [isPublic, setIsPublic] = useState(profile.collection_is_public)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaved(false)

    const errors = compactErrors({
      display_name: required(displayName, t),
      handle: required(handle, t),
    })
    if (Object.keys(errors).length > 0) {
      fail(errors)
      return
    }

    // Only send what changed so untouched unique fields (handle) are not re-validated.
    const payload: UpdateProfilePayload = {}
    if (displayName.trim() !== profile.display_name) {
      payload.display_name = displayName.trim()
    }
    if (handle.trim() !== profile.handle) {
      payload.handle = handle.trim()
    }
    if (bio.trim() !== (profile.bio ?? '')) {
      payload.bio = bio.trim() === '' ? null : bio.trim()
    }
    if (isPublic !== profile.collection_is_public) {
      payload.collection_is_public = isPublic
    }

    const ok = await submit(async () => {
      if (Object.keys(payload).length > 0) {
        await updateProfile(payload)
        await onSaved()
      }
    })
    setSaved(ok)
  }

  return (
    <section
      aria-labelledby="profile-section-heading"
      className="rounded-[24px] border border-border bg-surface/70 p-6 shadow-card"
    >
      <h2 id="profile-section-heading" className="mb-4 mt-0 font-display text-xl font-semibold text-white">
        {t('profile:edit.profileSection')}
      </h2>
      <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        {saved && <Alert variant="success">{t('profile:edit.saved')}</Alert>}
        <FormField
          label={t('profile:edit.displayName')}
          name="display_name"
          type="text"
          autoComplete="nickname"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          error={fieldErrors.display_name?.[0]}
          required
        />
        <FormField
          label={t('profile:edit.handle')}
          hint={t('auth:hints.handle')}
          name="handle"
          type="text"
          autoCapitalize="none"
          spellCheck={false}
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          error={fieldErrors.handle?.[0]}
          required
        />
        <TextAreaField
          label={t('profile:edit.bio')}
          name="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          error={fieldErrors.bio?.[0]}
        />
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-white">
            <input
              type="checkbox"
              name="collection_is_public"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="mt-0.5 size-4 accent-ember"
              aria-describedby="collection-public-hint"
            />
            <span className="font-semibold">{t('profile:edit.collectionPublic')}</span>
          </label>
          <p id="collection-public-hint" className="mb-0 ml-7 mt-1 text-xs text-arena-300/60">
            {t('profile:edit.collectionPublicHint')}
          </p>
          {fieldErrors.collection_is_public && (
            <p role="alert" className="mb-0 ml-7 mt-1 text-xs font-semibold text-signal-bad">
              {fieldErrors.collection_is_public[0]}
            </p>
          )}
        </div>
        <Button type="submit" disabled={submitting} className="self-start">
          {submitting ? t('profile:edit.saving') : t('profile:edit.save')}
        </Button>
      </form>
    </section>
  )
}
