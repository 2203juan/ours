import { type Plan } from '../../types'
import { Avatar } from '../ui/Avatar'
import { StatusDot, PriorityBadge } from '../ui/Badge'
import { cn, truncate, formatBudget, formatDate } from '../../lib/utils'
import { MapPin, CalendarDays, DollarSign } from 'lucide-react'

interface PlanItemProps {
  plan: Plan
  onClick: (plan: Plan) => void
  isMe: (profileId: string | null) => boolean
}

export function PlanItem({ plan, onClick, isMe }: PlanItemProps) {
  const cancelled = plan.status === 'canceled'

  return (
    <button
      onClick={() => onClick(plan)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3',
        'hover:bg-cream-50 active:bg-cream-100 transition-colors text-left',
        'border-b border-cream-100 last:border-b-0'
      )}
    >
      {/* Status dot */}
      <StatusDot status={plan.status} className="shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'text-sm font-medium text-warm-800 truncate',
              cancelled && 'line-through text-warm-400'
            )}
          >
            {plan.name}
          </span>
          <PriorityBadge priority={plan.priority} />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {plan.location_text && (
            <span className="flex items-center gap-0.5 text-[11px] text-warm-400">
              <MapPin size={9} />
              {truncate(plan.location_text, 20)}
            </span>
          )}
          {!plan.is_someday && plan.ideal_date && (
            <span className="flex items-center gap-0.5 text-[11px] text-warm-400">
              <CalendarDays size={9} />
              {formatDate(plan.ideal_date)}
            </span>
          )}
          {plan.budget_estimate != null && (
            <span className="flex items-center gap-0.5 text-[11px] text-warm-400">
              <DollarSign size={9} />
              {formatBudget(plan.budget_estimate)}
            </span>
          )}
          {plan.description && (
            <span className="text-[11px] text-warm-300 truncate">
              {truncate(plan.description, 30)}
            </span>
          )}
        </div>
      </div>

      {/* Proposer avatar */}
      {plan.proposer && (
        <div
          className={cn(
            'shrink-0',
            isMe(plan.proposed_by) ? 'opacity-70' : ''
          )}
        >
          <Avatar
            name={plan.proposer.name}
            url={plan.proposer.avatar_url}
            size="xs"
          />
        </div>
      )}

      {/* Thumbnail */}
      {plan.images.length > 0 && (
        <div className="shrink-0 h-9 w-9 rounded-lg overflow-hidden">
          <img
            src={plan.images[0]}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </button>
  )
}
