import { useState, useEffect, useCallback } from 'react'
import { Plus, Heart, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { usePlans, useUpdatePlan } from '../hooks/usePlans'
import { useCategories } from '../hooks/useCategories'
import { useUnseenActivity } from '../hooks/useUnseenActivity'
import { useSessionStore } from '../stores/sessionStore'
import { FilterPanel, ActiveFilterChips, countActiveFilters } from '../components/plans/FilterBar'
import { PlanList } from '../components/plans/PlanList'
import { MemoriesList } from '../components/plans/MemoriesList'
import { UpcomingSection } from '../components/plans/UpcomingSection'
import { PlanListSkeleton } from '../components/plans/PlanListSkeleton'
import { PlanDetail } from '../components/plans/PlanDetail'
import { PlanForm } from '../components/plans/PlanForm'
import { RecentActivity } from '../components/profile/RecentActivity'
import { Sheet } from '../components/ui/Sheet'
import { ErrorState } from '../components/ui/ErrorState'
import { AvatarIcon } from '../components/ui/AvatarIcon'
import { notify } from '../lib/toast'
import { cn } from '../lib/utils'
import { DEFAULT_FILTERS, getMyName } from '../types'
import type { Plan, PlanFilters, PlanStatus } from '../types'

type View = 'to_do' | 'done' | 'activity'

const VIEWS: View[] = ['to_do', 'done', 'activity']
const VIEW_LABEL: Record<View, string> = { to_do: 'To do', done: 'Done', activity: 'Recent' }

function parseView(raw: string | null): View {
  return VIEWS.includes(raw as View) ? (raw as View) : 'to_do'
}

export function HomePage() {
  const session = useSessionStore((s) => s.session)!
  const { data: plans = [], isLoading, isError, isFetching, refetch } = usePlans(session.coupleId)
  const { data: categories = [] } = useCategories(session.coupleId)
  const updatePlan = useUpdatePlan()
  const { unseen, markSeen } = useUnseenActivity(session.coupleId, getMyName(session))

  // `view` and the open plan live in the URL so the hardware/gesture back
  // button closes the sheet instead of leaving the app, and so a plan can be
  // linked to directly.
  const [searchParams, setSearchParams] = useSearchParams()
  const view = parseView(searchParams.get('view'))
  const selectedPlanId = searchParams.get('plan')

  const [filters, setFilters] = useState<PlanFilters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addDirty, setAddDirty] = useState(false)

  const setView = useCallback(
    (next: View) => {
      // Tabs are a filter, not navigation — replace so back doesn't walk
      // back through every tab the user tried.
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          params.set('view', next)
          params.delete('plan')
          return params
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const openPlan = useCallback(
    (planId: string) => {
      // Pushed, so back closes the detail sheet
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        params.set('plan', planId)
        return params
      })
    },
    [setSearchParams]
  )

  const closePlan = useCallback(() => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.delete('plan')
        return params
      },
      { replace: true }
    )
  }, [setSearchParams])

  // Always use the live plan from the query so detail updates after mutations
  const selectedPlan = selectedPlanId
    ? (plans.find((p) => p.id === selectedPlanId) ?? null)
    : null

  // Drop a stale ?plan= (deleted plan, or a link to another couple's plan)
  // once we know the list is genuinely loaded.
  useEffect(() => {
    if (selectedPlanId && !selectedPlan && !isLoading && !isError) closePlan()
  }, [selectedPlanId, selectedPlan, isLoading, isError, closePlan])

  // Opening the Recent tab is what "reads" the activity
  useEffect(() => {
    if (view === 'activity' && unseen > 0) markSeen()
  }, [view, unseen, markSeen])

  const activeFilterCount = countActiveFilters(filters)
  const todoCount = plans.filter((p) => p.status === 'to_do').length
  const doneCount = plans.filter((p) => p.status === 'done').length
  const viewPlans = plans.filter((p) => p.status === (view === 'activity' ? 'to_do' : view))

  const setStatus = (plan: Plan, status: PlanStatus) =>
    updatePlan.mutateAsync({ id: plan.id, coupleId: session.coupleId, payload: { status } })

  /** One-tap toggle from the list — no note prompt, undoable from the toast. */
  const handleToggleStatus = async (plan: Plan) => {
    const from = plan.status
    const to: PlanStatus = from === 'to_do' ? 'done' : 'to_do'
    try {
      await setStatus(plan, to)
      notify.undo(
        to === 'done' ? `Done: ${plan.name} 🎉` : `Moved back: ${plan.name}`,
        () => {
          setStatus(plan, from).catch(() => notify.error('Could not undo.'))
        }
      )
    } catch {
      notify.error('Could not update status.')
    }
  }

  /** Toggle "I want this too" for the partner using this device. */
  const handleToggleHeart = (plan: Plan) => {
    const me = session.partnerKey
    if (!me) return
    const hearted_by = plan.hearted_by.includes(me)
      ? plan.hearted_by.filter((k) => k !== me)
      : [...plan.hearted_by, me]
    updatePlan
      .mutateAsync({ id: plan.id, coupleId: session.coupleId, payload: { hearted_by } })
      .catch(() => notify.error('Could not save that.'))
  }

  const openAddSheet = () => setAddOpen(true)

  const closeAddSheet = () => {
    setAddOpen(false)
    setAddDirty(false)
  }

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
              {!isError && (
                <p className="text-xs text-warm-400 mt-0.5">
                  {todoCount} to do · {doneCount} done
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {view !== 'activity' && !isError && (
                <button
                  onClick={() => setFiltersOpen((v) => !v)}
                  aria-expanded={filtersOpen}
                  aria-label={filtersOpen ? 'Hide search and filters' : 'Search and filter'}
                  className={cn(
                    'relative h-11 w-11 rounded-2xl flex items-center justify-center transition-colors',
                    filtersOpen
                      ? 'bg-cream-200 text-warm-700'
                      : 'text-warm-400 hover:bg-cream-100 hover:text-warm-600'
                  )}
                >
                  <SlidersHorizontal size={17} />
                  {/* Filters can hide most of the list; never let that be silent */}
                  {activeFilterCount > 0 && !filtersOpen && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-sand-500
                      ring-2 ring-white" />
                  )}
                </button>
              )}

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
          </div>

          {/* View tabs */}
          <div className="flex mt-3 bg-cream-100 rounded-2xl p-1 gap-1">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  'relative flex-1 py-1.5 rounded-xl text-sm font-medium transition-all',
                  view === v
                    ? 'bg-white text-warm-800 shadow-soft'
                    : 'text-warm-400 hover:text-warm-600'
                )}
              >
                {VIEW_LABEL[v]}
                {v === 'activity' && unseen > 0 && (
                  <span
                    className="absolute top-0.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full
                      bg-blush-400 text-pure-white text-[10px] font-semibold leading-4 tabular-nums"
                    aria-label={`${unseen} new from your partner`}
                  >
                    {unseen > 9 ? '9+' : unseen}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Filters: on demand, with a permanent trace only when active ── */}
      {view !== 'activity' && !isError && (
        <>
          {filtersOpen && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              categories={categories}
              session={session}
              // Memories groups by month and ignores sort, so hide a dead control
              showSort={view !== 'done'}
            />
          )}
          {!filtersOpen && (
            <ActiveFilterChips
              filters={filters}
              onChange={setFilters}
              categories={categories}
              session={session}
            />
          )}
        </>
      )}

      {/* ── Content ── */}
      {view === 'activity' ? (
        <div className="px-4 pt-4 pb-32">
          <RecentActivity onPlanTap={openPlan} plans={plans} />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} retrying={isFetching} />
      ) : isLoading ? (
        <PlanListSkeleton />
      ) : view === 'done' ? (
        <MemoriesList
          plans={viewPlans}
          filters={filters}
          session={session}
          categories={categories}
          onPlanClick={(p) => openPlan(p.id)}
          onClearFilters={() => setFilters(DEFAULT_FILTERS)}
        />
      ) : (
        <>
          <UpcomingSection plans={viewPlans} onPlanClick={(p) => openPlan(p.id)} />
          <PlanList
            plans={viewPlans}
            allPlansCount={plans.length}
            filters={filters}
            session={session}
            onPlanClick={(p) => openPlan(p.id)}
            onToggleStatus={handleToggleStatus}
            onToggleHeart={handleToggleHeart}
            onAddClick={() => openAddSheet()}
            onClearFilters={() => setFilters(DEFAULT_FILTERS)}
          />
        </>
      )}

      {/* ── FAB (only on To do view) ── */}
      {view === 'to_do' && !isError && (
        <button
          onClick={() => openAddSheet()}
          className="fixed bottom-safe-20 right-5 z-30 h-14 w-14 rounded-full bg-warm-800 text-white
            shadow-card flex items-center justify-center hover:bg-warm-700 active:scale-95
            transition-all"
          aria-label="Add plan"
        >
          <Plus size={24} strokeWidth={2} />
        </button>
      )}

      {/* ── Add plan sheet ── */}
      <Sheet
        open={addOpen}
        onClose={closeAddSheet}
        title="New plan"
        height="full"
        confirmClose={addDirty}
        confirmMessage="This plan hasn't been saved yet."
      >
        <PlanForm
          session={session}
          categories={categories}
          onDone={closeAddSheet}
          onDirtyChange={setAddDirty}
        />
      </Sheet>

      {/* ── Plan detail sheet ──
          height="auto": a plan with just a name shouldn't open a full-height
          sheet of empty space. */}
      {selectedPlan && (
        <Sheet open={!!selectedPlan} onClose={closePlan} height="auto">
          <PlanDetail
            plan={selectedPlan}
            categories={categories}
            session={session}
            onClose={closePlan}
            onToggleHeart={handleToggleHeart}
            onMarkedDone={() => { closePlan(); setView('done') }}
            onMovedToDo={() => { closePlan(); setView('to_do') }}
          />
        </Sheet>
      )}
    </>
  )
}
