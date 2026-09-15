import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useSessionStore } from './stores/sessionStore'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { IdentitySelector } from './components/onboarding/IdentitySelector'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { SurprisePage } from './pages/SurprisePage'
import { ProfileSettingsPage } from './pages/ProfileSettingsPage'
import { useRealtime } from './hooks/useRealtime'

/**
 * Leaflet and the map screen are a third of the app's JavaScript, and most
 * sessions never leave the list. Loading them only when the Map tab is
 * opened keeps the first paint where it was before the tab existed.
 */
const MapPage = lazy(() =>
  import('./pages/MapPage').then((m) => ({ default: m.MapPage }))
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function AppRoutes() {
  const session = useSessionStore((s) => s.session)

  useRealtime(session?.coupleId)

  // 1. No couple at all → onboarding
  if (!session) {
    return <OnboardingFlow />
  }

  // 2. Couple known but identity not yet chosen on this device
  if (session.partnerKey === null) {
    return <IdentitySelector />
  }

  // 3. Fully authenticated
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/map"
          element={
            // A blank cream panel for the fraction of a second the chunk
            // takes — a spinner here would flash and read as slower.
            <Suspense fallback={<div className="h-full bg-cream-50" />}>
              <MapPage />
            </Suspense>
          }
        />
        <Route path="/surprise" element={<SurprisePage />} />
        <Route path="/profile" element={<ProfileSettingsPage />} />
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
      {/*
        Appearance and timing live in lib/toast.tsx — every toast is rendered
        there as a custom toast, so per-type options here would have no effect.
      */}
      <Toaster position="top-center" />
    </QueryClientProvider>
  )
}
