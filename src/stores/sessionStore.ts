import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session } from '../types'

interface SessionState {
  session: Session | null
  setSession: (s: Session) => void
  updateSession: (partial: Partial<Session>) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,

      setSession: (s) => set({ session: s }),

      updateSession: (partial) =>
        set((state) => ({
          session: state.session ? { ...state.session, ...partial } : null,
        })),

      clearSession: () => set({ session: null }),
    }),
    {
      name: 'ours-session', // localStorage key
    }
  )
)
