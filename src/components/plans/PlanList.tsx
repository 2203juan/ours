import type { Plan, PlanFilters, Session } from '../../types'
import { filterPlans, sortPlans } from '../../hooks/usePlans'
import { PlanItem } from './PlanItem'
import { ClipboardList, SearchX } from 'lucide-react'

interface PlanListProps {
  plans: Plan[]         // already filtered by view (to_do)
  allPlansCount: number // total across both views, for empty state copy
  filters: PlanFilters
  session: Session
  onPlanClick: (plan: Plan) => void
  onToggleStatus: (plan: Plan) => void
  onToggleHeart: (plan: Plan) => void
  onAddClick: () => void
  onClearFilters: () => void
}

/**
 * A flat list, deliberately. Grouping by category only pays off when the
 * groups are balanced — here almost everything lands in one category, so the
 * accordion produced one huge section plus a few near-empty ones and spent
 * ~50px of header on each without helping anyone find anything. The category
 * now travels with the row instead.
 */
export function PlanList({
  plans,
  allPlansCount,
  filters,
  session,
  onPlanClick,
  onToggleStatus,
  onToggleHeart,
  onAddClick,
  onClearFilters,
}: PlanListProps) {
  const visible = sortPlans(filterPlans(plans, filters), filters.sort)

  if (!visible.length) {
    // A search that found nothing is its own state — never imply the list is empty
    if (filters.search.trim()) {
      return (
        <EmptyState
          icon={<SearchX size={22} className="text-warm-300" />}
          title={`No matches for “${filters.search.trim()}”`}
          body="Try another word, or look in the Done tab."
          action={{ label: 'Clear search & filters', onClick: onClearFilters }}
        />
      )
    }

    if (allPlansCount === 0) {
      return (
        <EmptyState
          icon={<ClipboardList size={22} className="text-warm-300" />}
          title="No plans yet"
          body="Add the first thing you want to do together."
          action={{ label: 'Add your first plan →', onClick: onAddClick }}
        />
      )
    }

    if (plans.length === 0) {
      return (
        <EmptyState
          icon={<ClipboardList size={22} className="text-warm-300" />}
          title="All done! ✨"
          body="Everything is marked as done. Add something new."
        />
      )
    }

    return (
      <EmptyState
        icon={<SearchX size={22} className="text-warm-300" />}
        title="No plans match your filters"
        body="Try removing one of them."
        action={{ label: 'Clear filters', onClick: onClearFilters }}
      />
    )
  }

  return (
    <div className="mx-4 mt-3 mb-32 rounded-3xl bg-white border border-cream-200
      overflow-hidden shadow-soft">
      {visible.map((plan) => (
        <PlanItem
          key={plan.id}
          plan={plan}
          session={session}
          onClick={onPlanClick}
          onToggleStatus={onToggleStatus}
          onToggleHeart={onToggleHeart}
        />
      ))}
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="h-14 w-14 rounded-full bg-cream-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-warm-600 font-medium mb-1">{title}</p>
      <p className="text-sm text-warm-400">{body}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 text-sm font-medium text-sand-500 underline underline-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
