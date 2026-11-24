import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { CreatureCatalogPage } from './pages/CreatureCatalogPage'
import { CreatureDetailPage } from './pages/CreatureDetailPage'
import { HomePage } from './pages/HomePage'

function App() {
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

export default App
