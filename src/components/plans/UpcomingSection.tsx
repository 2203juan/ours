import { CalendarClock } from 'lucide-react'
import type { Plan } from '../../types'
import { cn, daysUntil, relativeDay } from '../../lib/utils'

/** How far ahead counts as "upcoming". Beyond this it's just a dated plan. */
const HORIZON_DAYS = 30

interface UpcomingSectionProps {
  /** To-do plans, unfiltered — this section deliberately ignores the filters. */
  plans: Plan[]
  onPlanClick: (plan: Plan) => void
}

/**
 * Dated plans get lost among the "someday" ones, which are the vast majority.
 * This pins the ones with a date that's actually close, soonest first —
 * most of the value of a calendar view, none of the machinery.
 */
export function UpcomingSection({ plans, onPlanClick }: UpcomingSectionProps) {
  const upcoming = plans
    .filter((p) => !p.is_someday && p.ideal_date && daysUntil(p.ideal_date) <= HORIZON_DAYS)
    .sort((a, b) => a.ideal_date!.localeCompare(b.ideal_date!))

  if (!upcoming.length) return null

  return (
    <section className="px-4 pt-3">
      <div className="flex items-center gap-2 mb-2 px-1">
        <CalendarClock size={13} className="text-sand-500" />
        <h2 className="text-xs font-semibold text-warm-500 uppercase tracking-wide">Coming up</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {upcoming.map((plan) => {
          const days = daysUntil(plan.ideal_date!)
          const overdue = days < 0
          const soon = days >= 0 && days <= 2

          return (
            <button
              key={plan.id}
              onClick={() => onPlanClick(plan)}
              className={cn(
                'shrink-0 w-44 text-left rounded-2xl border bg-white p-3 shadow-soft',
                'active:scale-[0.98] transition-transform',
                overdue ? 'border-blush-300' : soon ? 'border-sand-300' : 'border-cream-200'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wide',
                  overdue ? 'text-blush-500' : soon ? 'text-sand-600' : 'text-warm-400'
                )}
              >
                {relativeDay(plan.ideal_date!)}
              </span>
              <p className="text-sm font-medium text-warm-800 mt-1 line-clamp-2 leading-snug">
                {plan.name}
              </p>
              {plan.category && (
                <p className="text-[11px] text-warm-400 mt-1 truncate">
                  {plan.category.emoji} {plan.category.name}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
