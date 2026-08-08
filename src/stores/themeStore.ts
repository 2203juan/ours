import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function systemPrefersDark(): boolean {
  return window.matchMedia?.(DARK_QUERY).matches ?? false
}

function resolve(preference: ThemePreference): 'light' | 'dark' {
  return preference === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : preference
}

/** Tailwind is in `darkMode: 'class'`, so the whole theme hangs off this class. */
function apply(preference: ThemePreference) {
  const resolved = resolve(preference)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  // Keeps the iOS status bar and browser chrome in step with the page
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'dark' ? '#17130F' : '#F8F3EC')
}

interface ThemeState {
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => {
        apply(preference)
        set({ preference })
      },
    }),
    {
      name: 'ours-theme',
      onRehydrateStorage: () => (state) => {
        // Storage is read after the first paint, so re-apply once we know the
        // stored preference (initTheme already handled the pre-paint case).
        apply(state?.preference ?? 'system')
      },
    }
  )
)

/**
 * Applies the theme before React mounts, so a dark-mode user never sees a
 * flash of the light palette. Also keeps 'system' live if the phone flips
 * theme while the app is open.
 */
export function initTheme() {
  const stored = (() => {
    try {
      const raw = localStorage.getItem('ours-theme')
      return raw ? (JSON.parse(raw).state?.preference as ThemePreference) : 'system'
    } catch {
      return 'system' as const
    }
  })()

  apply(stored ?? 'system')

  window.matchMedia?.(DARK_QUERY).addEventListener('change', () => {
    if (useThemeStore.getState().preference === 'system') apply('system')
  })
}
