import { useState } from 'react'
import { Plus, Heart } from 'lucide-react'
import { usePlans } from '../hooks/usePlans'
import { useCategories } from '../hooks/useCategories'
import { useProfiles } from '../hooks/useProfiles'
import { useSessionStore } from '../stores/sessionStore'
import { FilterBar } from '../components/plans/FilterBar'
import { PlanList } from '../components/plans/PlanList'
import { PlanDetail } from '../components/plans/PlanDetail'
import { PlanForm } from '../components/plans/PlanForm'
import { Sheet } from '../components/ui/Sheet'
import { Avatar } from '../components/ui/Avatar'
import type { Plan, PlanFilters } from '../types'

const DEFAULT_FILTERS: PlanFilters = {
  status: 'all',
  categoryId: 'all',
  proposedBy: 'all',
}

export function HomePage() {
  const session = useSessionStore((s) => s.session)!
  const { data: plans = [], isLoading } = usePlans(session.coupleId)
  const { data: categories = [] } = useCategories(session.coupleId)
  const { data: profiles = [] } = useProfiles(session.coupleId)

  const [filters, setFilters] = useState<PlanFilters>(DEFAULT_FILTERS)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  // Summary counts for header
  const pendingCount = plans.filter((p) => p.status === 'pending').length
  const doneCount = plans.filter((p) => p.status === 'completed').length
  const partner = profiles.find((p) => p.id !== session.profileId)
  const me = profiles.find((p) => p.id === session.profileId)

  return (
    <>
      {/* ── Header ── */}
      <header className="bg-white border-b border-cream-200 px-5 pt-safe-top">
        <div className="pt-4 pb-3">
          {/* Couple name + avatars */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl text-warm-800 flex items-center gap-2">
                {session.coupleName}
                <Heart size={14} className="fill-blush-300 text-blush-300" />
              </h1>
              <p className="text-xs text-warm-400 mt-0.5">
                {pendingCount} to do · {doneCount} done
              </p>
            </div>
            <div className="flex -space-x-2">
              {me && (
                <Avatar
                  name={me.name}
                  url={me.avatar_url}
                  size="sm"
                  className="ring-2 ring-white"
                />
              )}
              {partner ? (
                <Avatar
                  name={partner.name}
                  url={partner.avatar_url}
                  size="sm"
                  className="ring-2 ring-white"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-cream-200 ring-2 ring-white flex items-center justify-center">
                  <span className="text-warm-300 text-sm">?</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Filters ── */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        categories={categories}
        profiles={profiles}
      />

      {/* ── Plan list ── */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 border-2 border-sand-300 border-t-sand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <PlanList
          plans={plans}
          categories={categories}
          filters={filters}
          profiles={profiles}
          myProfileId={session.profileId}
          onPlanClick={setSelectedPlan}
          onAddClick={() => setAddOpen(true)}
        />
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-20 right-5 z-30 h-14 w-14 rounded-full bg-warm-800 text-white shadow-card
          flex items-center justify-center hover:bg-warm-700 active:scale-95 transition-all"
        aria-label="Add plan"
      >
        <Plus size={24} strokeWidth={2} />
      </button>

      {/* ── Add plan sheet ── */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="New plan" height="full">
        <PlanForm
          coupleId={session.coupleId}
          profileId={session.profileId}
          categories={categories}
          onDone={() => setAddOpen(false)}
        />
      </Sheet>

      {/* ── Plan detail sheet ── */}
      {selectedPlan && (
        <Sheet
          open={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          height="full"
        >
          <PlanDetail
            plan={selectedPlan}
            categories={categories}
            coupleId={session.coupleId}
            profileId={session.profileId}
            onClose={() => setSelectedPlan(null)}
          />
        </Sheet>
      )}
    </>
  )
}
