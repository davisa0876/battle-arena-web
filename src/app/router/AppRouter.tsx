import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../layouts/AppShell'
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute'
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { RegisterPage } from '../../features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage'
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage'
import { MyCollectionPage } from '../../features/collection/pages/MyCollectionPage'
import { CreatureCatalogPage } from '../../features/creatures/pages/CreatureCatalogPage'
import { CreatureDetailPage } from '../../features/creatures/pages/CreatureDetailPage'
import { GameRulesPage } from '../../features/game-rules/pages/GameRulesPage'
import { HomePage } from '../../features/home/pages/HomePage'
import { PveBattlePage } from '../../features/pve/pages/PveBattlePage'
import { EditProfilePage } from '../../features/profile/pages/EditProfilePage'
import { ProfilePage } from '../../features/profile/pages/ProfilePage'
import { PublicPlayerProfilePage } from '../../features/profile/pages/PublicPlayerProfilePage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        {/* Public: rules are server-published reference data and need no session. */}
        <Route path="game-rules" element={<GameRulesPage />} />

        <Route element={<ProtectedRoute />}>
          <Route index element={<HomePage />} />
          <Route path="creatures" element={<CreatureCatalogPage />} />
          <Route path="creatures/:slug" element={<CreatureDetailPage />} />
          <Route path="players/:handle" element={<PublicPlayerProfilePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/edit" element={<EditProfilePage />} />
          <Route path="my-collection" element={<MyCollectionPage />} />
          <Route path="pve" element={<PveBattlePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
