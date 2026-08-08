import type { Plan, Session } from '../../types'
import { getPartnerName, getPartnerAvatar } from '../../types'
import { AvatarIcon } from '../ui/AvatarIcon'
import { PriorityBadge } from '../ui/Badge'
import { StarRatingDisplay } from '../ui/StarRating'
import { cn, truncate, formatBudget, formatDate } from '../../lib/utils'
import { MapPin, CalendarDays, DollarSign, Check } from 'lucide-react'
import { isValidProposer } from '../../hooks/usePlans'

interface PlanItemProps {
  plan: Plan
  session: Session
  onClick: (plan: Plan) => void
  onToggleStatus: (plan: Plan) => void
}

export function PlanItem({ plan, session, onClick, onToggleStatus }: PlanItemProps) {
  const proposerKey = isValidProposer(plan.proposed_by) ? plan.proposed_by : null
  const isMe = proposerKey === session.partnerKey
  const isDone = plan.status === 'done'

  return (
    <div
      className={cn(
        'w-full flex items-center px-4 py-3 gap-1',
        'hover:bg-cream-50 transition-colors',
        'border-b border-cream-100 last:border-b-0'
      )}
    >
      {/* One-tap status toggle — 40px hit area around a 24px control */}
      <button
        onClick={() => onToggleStatus(plan)}
        aria-label={
          isDone ? `Move "${plan.name}" back to to do` : `Mark "${plan.name}" as done`
        }
        aria-pressed={isDone}
        className="shrink-0 h-10 w-10 -ml-2 flex items-center justify-center
          text-warm-300 active:scale-90 transition-transform"
      >
        <span
          className={cn(
            'h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors',
            isDone
              ? 'bg-sage-400 border-sage-400 text-white'
              : 'border-cream-300 hover:border-sage-400'
          )}
        >
          {isDone && <Check size={13} strokeWidth={3} />}
        </span>
      </button>

      {/* Tapping the body opens the detail sheet */}
      <button
        onClick={() => onClick(plan)}
        className="flex-1 min-w-0 flex items-center gap-3 text-left active:opacity-70 transition-opacity"
      >
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-sm font-medium truncate',
                isDone ? 'text-warm-400 line-through' : 'text-warm-800'
              )}
            >
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
            {plan.maps_url && plan.maps_rating != null && (
              <StarRatingDisplay rating={plan.maps_rating} />
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
    </div>
  )
}
