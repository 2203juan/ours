import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, PartnerKey } from '../types'

interface SessionState {
  session: Session | null
  setSession: (s: Session) => void
  setPartnerKey: (key: PartnerKey) => void
  updateCoupleName: (name: string) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,

      setSession: (s) => set({ session: s }),

      setPartnerKey: (key) =>
        set((state) => ({
          session: state.session ? { ...state.session, partnerKey: key } : null,
        })),

      updateCoupleName: (name) =>
        set((state) => ({
          session: state.session ? { ...state.session, coupleName: name } : null,
        })),

      clearSession: () => set({ session: null }),
    }),
    {
      // v2 key — deliberately different from v1 to invalidate old sessions
      name: 'ours-session-v2',
    }
  )
)
