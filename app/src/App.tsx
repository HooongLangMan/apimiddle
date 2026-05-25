import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import { Shell } from './components/Shell'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { BillingPage } from './pages/BillingPage'
import { DashboardPage } from './pages/DashboardPage'
import { DocsPage } from './pages/DocsPage'
import { KeysPage } from './pages/KeysPage'
import { LandingPage } from './pages/LandingPage'
import { ModelsPage } from './pages/ModelsPage'
import { LoginPage } from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { UsagePage } from './pages/UsagePage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Shell />}>
              <Route path="/console" element={<DashboardPage />} />
              <Route path="/console/keys" element={<KeysPage />} />
              <Route path="/console/models" element={<ModelsPage />} />
              <Route path="/console/usage" element={<UsagePage />} />
              <Route path="/console/billing" element={<BillingPage />} />
              <Route path="/console/docs" element={<DocsPage />} />
              <Route path="/console/announcements" element={<AnnouncementsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
