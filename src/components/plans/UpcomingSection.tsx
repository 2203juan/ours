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
 * This pins the ones with a date that's actually close, soonest first.
 *
 * Deliberately one line tall: the earlier card layout spent 142px of a ~700px
 * screen restating what "Thu · Dinner at X" says in 38px, which pushed the
 * actual list below the fold. Each chip carries its own clock icon so the
 * section needs no heading of its own.
 */
export function UpcomingSection({ plans, onPlanClick }: UpcomingSectionProps) {
  const upcoming = plans
    .filter((p) => !p.is_someday && p.ideal_date && daysUntil(p.ideal_date) <= HORIZON_DAYS)
    .sort((a, b) => a.ideal_date!.localeCompare(b.ideal_date!))

  if (!upcoming.length) return null

  return (
    <section
      aria-label="Coming up"
      className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3 pb-2"
    >
      {upcoming.map((plan) => {
        const days = daysUntil(plan.ideal_date!)
        const overdue = days < 0
        const soon = days >= 0 && days <= 2

        return (
          <button
            key={plan.id}
            onClick={() => onPlanClick(plan)}
            className={cn(
              'shrink-0 max-w-[70vw] flex items-center gap-1.5 rounded-full border bg-white',
              'pl-2.5 pr-3 py-2 active:scale-[0.98] transition-transform',
              overdue ? 'border-blush-300' : soon ? 'border-sand-300' : 'border-cream-200'
            )}
          >
            <CalendarClock
              size={12}
              className={cn(
                'shrink-0',
                overdue ? 'text-blush-500' : soon ? 'text-sand-600' : 'text-warm-400'
              )}
            />
            <span
              className={cn(
                'shrink-0 text-xs font-semibold',
                overdue ? 'text-blush-500' : soon ? 'text-sand-600' : 'text-warm-500'
              )}
            >
              {relativeDay(plan.ideal_date!)}
            </span>
            <span className="text-xs text-warm-700 truncate">{plan.name}</span>
          </button>
        )
      })}
    </section>
  )
}
