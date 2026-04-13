import type { Plan, Category, PlanFilters, Profile } from '../../types'
import { filterPlans } from '../../hooks/usePlans'
import { CategorySection } from './CategorySection'
import { ClipboardList } from 'lucide-react'

interface PlanListProps {
  plans: Plan[]
  categories: Category[]
  filters: PlanFilters
  profiles: Profile[]
  myProfileId: string
  onPlanClick: (plan: Plan) => void
  onAddClick: () => void
}

export function PlanList({
  plans,
  categories,
  filters,
  myProfileId,
  onPlanClick,
  onAddClick,
}: PlanListProps) {
  const filtered = filterPlans(plans, filters)

  const isMe = (profileId: string | null) => profileId === myProfileId

  // Group filtered plans by category
  const groups: Array<{ category: Category | null; plans: Plan[] }> = []

  // First, one group per category (in sort order)
  for (const cat of categories) {
    const catPlans = filtered.filter((p) => p.category_id === cat.id)
    if (catPlans.length) {
      groups.push({ category: cat, plans: catPlans })
    }
  }

  // Uncategorized bucket
  const uncategorized = filtered.filter(
    (p) => !p.category_id || !categories.find((c) => c.id === p.category_id)
  )
  if (uncategorized.length) {
    groups.push({ category: null, plans: uncategorized })
  }

  if (!filtered.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="h-14 w-14 rounded-full bg-cream-100 flex items-center justify-center mb-4">
          <ClipboardList size={22} className="text-warm-300" />
        </div>
        {plans.length === 0 ? (
          <>
            <p className="text-warm-600 font-medium mb-1">No plans yet</p>
            <p className="text-sm text-warm-400 mb-6">
              Start adding things you want to do together.
            </p>
            <button
              onClick={onAddClick}
              className="text-sm font-medium text-sand-500 underline underline-offset-2"
            >
              Add your first plan →
            </button>
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
    <div>
      {groups.map((g) => (
        <CategorySection
          key={g.category?.id ?? '__none'}
          category={g.category}
          plans={g.plans}
          defaultOpen={true}
          onPlanClick={onPlanClick}
          isMe={isMe}
        />
      ))}
    </div>
  )
}
