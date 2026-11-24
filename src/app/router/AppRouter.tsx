import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../layouts/AppShell'
import { CreatureCatalogPage } from '../../features/creatures/pages/CreatureCatalogPage'
import { CreatureDetailPage } from '../../features/creatures/pages/CreatureDetailPage'
import { HomePage } from '../../features/home/pages/HomePage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="creatures" element={<CreatureCatalogPage />} />
        <Route path="creatures/:slug" element={<CreatureDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
