import { Shuffle } from 'lucide-react'
import { usePlans } from '../hooks/usePlans'
import { useCategories } from '../hooks/useCategories'
import { useSessionStore } from '../stores/sessionStore'
import { SurpriseFeature } from '../components/surprise/SurpriseFeature'

export function SurprisePage() {
  const session = useSessionStore((s) => s.session)!
  const { data: plans = [] } = usePlans(session.coupleId)
  const { data: categories = [] } = useCategories(session.coupleId)

  return (
    <>
      <header className="bg-white border-b border-cream-200 px-5 pt-safe-top">
        <div className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Shuffle size={20} className="text-sand-500" />
            <h1 className="font-serif text-2xl text-warm-800">Surprise us</h1>
          </div>
          <p className="text-xs text-warm-400 mt-0.5">Let fate decide what to do next</p>
        </div>
      </header>

      <div className="pt-4">
        <SurpriseFeature
          plans={plans}
          categories={categories}
          session={session}
        />
      </div>
    </>
  )
}
