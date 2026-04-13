import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useSessionStore } from './stores/sessionStore'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { SurprisePage } from './pages/SurprisePage'
import { ProfileSettingsPage } from './pages/ProfileSettingsPage'
import { useRealtime } from './hooks/useRealtime'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function AppRoutes() {
  const session = useSessionStore((s) => s.session)

  // Real-time subscription while logged in
  useRealtime(session?.coupleId)

  if (!session) {
    return <OnboardingFlow />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/surprise" element={<SurprisePage />} />
        <Route path="/profile" element={<ProfileSettingsPage />} />
        {/* Fallback */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#2A1F18',
            color: '#F7F2EB',
            fontSize: '14px',
            borderRadius: '16px',
            padding: '10px 16px',
          },
          success: { iconTheme: { primary: '#5E9073', secondary: '#F7F2EB' } },
          error: { iconTheme: { primary: '#D98080', secondary: '#F7F2EB' } },
        }}
      />
    </QueryClientProvider>
  )
}
