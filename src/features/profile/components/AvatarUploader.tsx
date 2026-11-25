import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../../shared/components/ui/Alert'
import { Button } from '../../../shared/components/ui/Button'
import { useFormSubmission } from '../../../shared/hooks/useFormSubmission'
import { deleteAvatar, uploadAvatar } from '../api/profile'
import { bumpAvatarVersion, withAvatarVersion } from '../lib/avatarUrl'
import type { PlayerProfile } from '../types'
import { PlayerAvatar } from './PlayerAvatar'

/** Client-side preflight mirroring the API's avatar limits (the API remains authoritative). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface AvatarUploaderProps {
  profile: PlayerProfile
  /** Called after the API accepted an upload/removal so the app can reload `/api/me`. */
  onChanged: () => Promise<unknown>
}

export function AvatarUploader({ profile, onChanged }: AvatarUploaderProps) {
  const { t } = useTranslation(['profile', 'validation'])
  const { submitting, fieldErrors, formError, submit, fail, clear } = useFormSubmission()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [notice, setNotice] = useState<'uploaded' | 'removed' | null>(null)
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    },
    [],
  )

  const replacePreview = (next: File | null) => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
    }
    previewRef.current = next && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(next) : null
    setPreview(previewRef.current)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    setNotice(null)
    clear()

    if (selected && !AVATAR_ACCEPTED_TYPES.includes(selected.type)) {
      fail({ avatar: [t('validation:avatarType')] })
      event.target.value = ''
      return
    }
    if (selected && selected.size > AVATAR_MAX_BYTES) {
      fail({ avatar: [t('validation:avatarSize', { maxMb: AVATAR_MAX_BYTES / (1024 * 1024) })] })
      event.target.value = ''
      return
    }

    setFile(selected)
    replacePreview(selected)
  }

  const reset = () => {
    setFile(null)
    replacePreview(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const upload = async () => {
    setNotice(null)
    if (!file) {
      fail({ avatar: [t('validation:avatarRequired')] })
      return
    }

    setBusy('upload')
    const ok = await submit(async () => {
      await uploadAvatar(file)
      bumpAvatarVersion()
      await onChanged()
    })
    setBusy(null)
    if (ok) {
      reset()
      setNotice('uploaded')
    }
  }

  const remove = async () => {
    setNotice(null)
    setBusy('remove')
    const ok = await submit(async () => {
      await deleteAvatar()
      bumpAvatarVersion()
      await onChanged()
    })
    setBusy(null)
    if (ok) {
      reset()
      setNotice('removed')
    }
  }

  const error = fieldErrors.avatar?.[0]

  return (
    <section aria-labelledby="avatar-section-heading" className="rounded-[24px] border border-border bg-surface/70 p-6 shadow-card">
      <h2 id="avatar-section-heading" className="mb-4 mt-0 font-display text-xl font-semibold text-white">
        {t('profile:edit.avatarSection')}
      </h2>
      <div className="flex flex-wrap items-center gap-6">
        <PlayerAvatar
          src={preview ?? withAvatarVersion(profile.avatar_url)}
          alt={t('profile:identity.avatarAlt', { name: profile.display_name })}
          initialsFrom={profile.display_name}
          className="size-28"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <label htmlFor="avatar-file" className="mb-1.5 block text-sm font-semibold text-white">
              {t('profile:edit.chooseFile')}
            </label>
            <input
              ref={inputRef}
              id="avatar-file"
              type="file"
              name="avatar"
              accept={AVATAR_ACCEPTED_TYPES.join(',')}
              onChange={handleChange}
              aria-describedby="avatar-hint"
              aria-invalid={error ? true : undefined}
              disabled={submitting}
              className="block w-full text-sm text-arena-300 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2 file:font-semibold file:text-electric"
            />
            <p id="avatar-hint" className="mb-0 mt-1.5 text-xs text-arena-300/60">
              {t('profile:edit.avatarHint', { maxMb: AVATAR_MAX_BYTES / (1024 * 1024) })}
            </p>
            {file && (
              <p className="mb-0 mt-1 text-xs text-arena-300/80">{t('profile:edit.selectedFile', { name: file.name })}</p>
            )}
          </div>
          {error && (
            <p role="alert" className="m-0 text-xs font-semibold text-signal-bad">
              {error}
            </p>
          )}
          {formError && <Alert variant="error">{formError}</Alert>}
          {notice && (
            <Alert variant="success">
              {notice === 'uploaded' ? t('profile:edit.avatarUploaded') : t('profile:edit.avatarRemoved')}
            </Alert>
          )}
          <div className="flex flex-wrap gap-3">
            <Button disabled={submitting || !file} onClick={() => void upload()}>
              {busy === 'upload' ? t('profile:edit.uploading') : t('profile:edit.upload')}
            </Button>
            {profile.avatar_url && (
              <Button variant="danger" disabled={submitting} onClick={() => void remove()}>
                {busy === 'remove' ? t('profile:edit.removing') : t('profile:edit.remove')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
