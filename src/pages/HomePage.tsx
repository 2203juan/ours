import { useState, useEffect } from 'react'
import { Plus, Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePlans } from '../hooks/usePlans'
import { useCategories } from '../hooks/useCategories'
import { useSessionStore } from '../stores/sessionStore'
import { FilterBar } from '../components/plans/FilterBar'
import { PlanList } from '../components/plans/PlanList'
import { PlanDetail } from '../components/plans/PlanDetail'
import { PlanForm } from '../components/plans/PlanForm'
import { RecentActivity } from '../components/profile/RecentActivity'
import { Sheet } from '../components/ui/Sheet'
import { AvatarIcon } from '../components/ui/AvatarIcon'
import { cn } from '../lib/utils'
import type { PlanFilters } from '../types'

const DEFAULT_FILTERS: PlanFilters = {
  categoryId: 'all',
  proposedBy: 'all',
}

export function HomePage() {
  const session = useSessionStore((s) => s.session)!
  const { data: plans = [], isLoading } = usePlans(session.coupleId)
  const { data: categories = [] } = useCategories(session.coupleId)
  const location = useLocation()
  const navigate = useNavigate()

  const [view, setView] = useState<'to_do' | 'done' | 'activity'>('to_do')
  const [filters, setFilters] = useState<PlanFilters>(DEFAULT_FILTERS)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  // Open plan detail when navigated here with state.openPlanId (from activity feed)
  useEffect(() => {
    const state = location.state as { openPlanId?: string } | null
    if (state?.openPlanId) {
      setSelectedPlanId(state.openPlanId)
      // Clear the state so re-visiting this route doesn't re-open the sheet
      navigate('/', { replace: true, state: null })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  // Always use the live plan from the query so detail updates after mutations
  const selectedPlan = selectedPlanId
    ? (plans.find((p) => p.id === selectedPlanId) ?? null)
    : null

  const todoCount = plans.filter((p) => p.status === 'to_do').length
  const doneCount = plans.filter((p) => p.status === 'done').length
  const viewPlans = plans.filter((p) => p.status === (view === 'activity' ? 'to_do' : view))

  return (
    <>
      {/* ── Header ── */}
      <header className="bg-white border-b border-cream-200 px-5 pt-safe-top">
        <div className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl text-warm-800 flex items-center gap-2">
                {session.coupleName}
                <Heart size={14} className="fill-blush-300 text-blush-300" />
              </h1>
              <p className="text-xs text-warm-400 mt-0.5">
                {todoCount} to do · {doneCount} done
              </p>
            </div>
            <div className="flex -space-x-2">
              <AvatarIcon
                name={session.partnerOneName}
                avatarKey={session.partnerOneAvatar}
                size="sm"
                className="ring-2 ring-white"
              />
              <AvatarIcon
                name={session.partnerTwoName}
                avatarKey={session.partnerTwoAvatar}
                size="sm"
                className="ring-2 ring-white"
              />
            </div>
          </div>

          {/* View tabs */}
          <div className="flex mt-3 bg-cream-100 rounded-2xl p-1 gap-1">
            {(['to_do', 'done', 'activity'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'flex-1 py-1.5 rounded-xl text-sm font-medium transition-all',
                  view === v
                    ? 'bg-white text-warm-800 shadow-soft'
                    : 'text-warm-400 hover:text-warm-600'
                )}
              >
                {v === 'to_do' ? 'To do' : v === 'done' ? 'Done' : 'Recent'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Filters (hidden on activity tab) ── */}
      {view !== 'activity' && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          categories={categories}
          session={session}
        />
      )}

      {/* ── Content ── */}
      {view === 'activity' ? (
        <div className="px-4 pt-4 pb-32">
          <RecentActivity onPlanTap={(planId) => setSelectedPlanId(planId)} />
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 border-2 border-sand-300 border-t-sand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <PlanList
          plans={viewPlans}
          allPlansCount={plans.length}
          view={view}
          categories={categories}
          filters={filters}
          session={session}
          onPlanClick={(p) => setSelectedPlanId(p.id)}
          onAddClick={() => setAddOpen(true)}
        />
      )}

      {/* ── FAB (only on To do view) ── */}
      {view === 'to_do' && (
        <button
          onClick={() => setAddOpen(true)}
          className="fixed bottom-20 right-5 z-30 h-14 w-14 rounded-full bg-warm-800 text-white
            shadow-card flex items-center justify-center hover:bg-warm-700 active:scale-95
            transition-all"
          aria-label="Add plan"
        >
          <Plus size={24} strokeWidth={2} />
        </button>
      )}

      {/* ── Add plan sheet ── */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="New plan" height="full">
        <PlanForm
          session={session}
          categories={categories}
          onDone={() => setAddOpen(false)}
        />
      </Sheet>

      {/* ── Plan detail sheet ── */}
      {selectedPlan && (
        <Sheet open={!!selectedPlan} onClose={() => setSelectedPlanId(null)} height="full">
          <PlanDetail
            plan={selectedPlan}
            categories={categories}
            session={session}
            onClose={() => setSelectedPlanId(null)}
            onMarkedDone={() => { setSelectedPlanId(null); setView('done') }}
            onMovedToDo={() => { setSelectedPlanId(null); setView('to_do') }}
          />
        </Sheet>
      )}
    </>
  )
}
