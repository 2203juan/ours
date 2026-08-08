import type { Plan, Category, PlanFilters, Session } from '../../types'
import { filterPlans, sortPlans } from '../../hooks/usePlans'
import { CategorySection } from './CategorySection'
import { ClipboardList, CheckCheck, SearchX } from 'lucide-react'

interface PlanListProps {
  plans: Plan[]         // already filtered by view (to_do | done)
  allPlansCount: number // total across both views, for empty state copy
  view: 'to_do' | 'done'
  categories: Category[]
  filters: PlanFilters
  session: Session
  onPlanClick: (plan: Plan) => void
  onToggleStatus: (plan: Plan) => void
  onAddClick: () => void
  onClearFilters: () => void
}

export function PlanList({
  plans,
  allPlansCount,
  view,
  categories,
  filters,
  session,
  onPlanClick,
  onToggleStatus,
  onAddClick,
  onClearFilters,
}: PlanListProps) {
  const filtered = sortPlans(filterPlans(plans, filters), filters.sort)

  const groups: Array<{ category: Category | null; plans: Plan[] }> = []

  for (const cat of categories) {
    const catPlans = filtered.filter((p) => p.category_id === cat.id)
    if (catPlans.length) groups.push({ category: cat, plans: catPlans })
  }

  const uncategorized = filtered.filter(
    (p) => !p.category_id || !categories.find((c) => c.id === p.category_id)
  )
  if (uncategorized.length) groups.push({ category: null, plans: uncategorized })

  if (!filtered.length) {
    // A search that found nothing is its own state — never imply the list is empty
    if (filters.search.trim()) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="h-14 w-14 rounded-full bg-cream-100 flex items-center justify-center mb-4">
            <SearchX size={22} className="text-warm-300" />
          </div>
          <p className="text-warm-600 font-medium mb-1">
            No matches for “{filters.search.trim()}”
          </p>
          <p className="text-sm text-warm-400 mb-6">
            Try another word, or search in the {view === 'to_do' ? 'Done' : 'To do'} tab.
          </p>
          <button
            onClick={onClearFilters}
            className="text-sm font-medium text-sand-500 underline underline-offset-2"
          >
            Clear search & filters
          </button>
        </div>
      )
    }

    if (view === 'done') {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="h-14 w-14 rounded-full bg-cream-100 flex items-center justify-center mb-4">
            <CheckCheck size={22} className="text-warm-300" />
          </div>
          <p className="text-warm-600 font-medium mb-1">Nothing done yet</p>
          <p className="text-sm text-warm-400">Completed plans will appear here.</p>
        </div>
      )
    }

    // to_do view
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="h-14 w-14 rounded-full bg-cream-100 flex items-center justify-center mb-4">
          <ClipboardList size={22} className="text-warm-300" />
        </div>
        {allPlansCount === 0 ? (
          <>
            <p className="text-warm-600 font-medium mb-1">No plans yet</p>
            <p className="text-sm text-warm-400 mb-6">Start adding things you want to do together.</p>
            <button
              onClick={onAddClick}
              className="text-sm font-medium text-sand-500 underline underline-offset-2"
            >
              Add your first plan →
            </button>
          </>
        ) : plans.length === 0 ? (
          <>
            <p className="text-warm-600 font-medium mb-1">All done! ✨</p>
            <p className="text-sm text-warm-400">Everything is marked as done. Add something new.</p>
          </>
        ) : (
          <>
            <p className="text-warm-600 font-medium mb-1">No plans match your filters</p>
            <p className="text-sm text-warm-400">Try clearing some filters.</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="pt-3 pb-32">
      {groups.map((g) => (
        <CategorySection
          key={g.category?.id ?? '__none'}
          category={g.category}
          plans={g.plans}
          defaultOpen={true}
          session={session}
          onPlanClick={onPlanClick}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  )
}
