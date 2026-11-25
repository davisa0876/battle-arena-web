import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageHeading, PageSection } from '../../../shared/components/layout/PageSection'
import { useAuth } from '../../auth/hooks/useAuth'
import { AvatarUploader } from '../components/AvatarUploader'
import { PasswordForm } from '../components/PasswordForm'
import { ProfileForm } from '../components/ProfileForm'

export function EditProfilePage() {
  const { t } = useTranslation('profile')
  const { user, refreshMe } = useAuth()

  if (!user) {
    return null
  }

  return (
    <PageSection size="medium">
      <Link to="/profile" className="mb-6 inline-flex text-sm font-semibold text-ember no-underline hover:text-gold">
        {t('edit.back')}
      </Link>
      <PageHeading eyebrow={t('edit.eyebrow')} title={t('edit.title')} description={t('edit.subtitle')} />
      <div className="flex flex-col gap-6">
        <ProfileForm profile={user.profile} onSaved={() => refreshMe()} />
        <AvatarUploader profile={user.profile} onChanged={() => refreshMe()} />
        <PasswordForm />
      </div>
    </PageSection>
  )
}
