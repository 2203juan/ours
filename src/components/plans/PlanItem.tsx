import type { Plan, Session } from '../../types'
import { getPartnerName, getPartnerAvatar } from '../../types'
import { AvatarIcon } from '../ui/AvatarIcon'
import { PriorityBadge } from '../ui/Badge'
import { cn, truncate, formatBudget, formatDate } from '../../lib/utils'
import { MapPin, CalendarDays, DollarSign } from 'lucide-react'
import { isValidProposer } from '../../hooks/usePlans'

interface PlanItemProps {
  plan: Plan
  session: Session
  onClick: (plan: Plan) => void
}

export function PlanItem({ plan, session, onClick }: PlanItemProps) {
  const proposerKey = isValidProposer(plan.proposed_by) ? plan.proposed_by : null
  const isMe = proposerKey === session.partnerKey

  return (
    <button
      onClick={() => onClick(plan)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3',
        'hover:bg-cream-50 active:bg-cream-100 transition-colors text-left',
        'border-b border-cream-100 last:border-b-0'
      )}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-warm-800 truncate">
            {plan.name}
          </span>
          <PriorityBadge priority={plan.priority} />
        </div>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {(() => {
            const locationLabel = plan.location_text || (plan.maps_url ? 'Location' : null)
            return locationLabel ? (
              <span className="flex items-center gap-0.5 text-[11px] text-warm-400">
                <MapPin size={9} />
                {truncate(locationLabel, 20)}
              </span>
            ) : plan.description ? (
              <span className="text-[11px] text-warm-300 truncate">
                {truncate(plan.description, 30)}
              </span>
            ) : null
          })()}
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
        </div>
      </div>

      {/* Proposer avatar */}
      {proposerKey && (
        <div className={cn('shrink-0', isMe ? 'opacity-60' : '')}>
          <AvatarIcon
            name={getPartnerName(session, proposerKey)}
            avatarKey={getPartnerAvatar(session, proposerKey)}
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
