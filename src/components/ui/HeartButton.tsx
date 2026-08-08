import { Heart } from 'lucide-react'
import { cn } from '../../lib/utils'
import { isMutual, type Plan, type PartnerKey } from '../../types'

interface HeartButtonProps {
  plan: Plan
  me: PartnerKey
  onToggle: (plan: Plan) => void
  size?: 'sm' | 'md'
}

/**
 * "I want this too." Turns a one-sided wish list into something both people
 * signal on, and feeds the "Wanted" sort.
 */
export function HeartButton({ plan, me, onToggle, size = 'sm' }: HeartButtonProps) {
  const mine = plan.hearted_by.includes(me)
  const mutual = isMutual(plan)
  const iconSize = size === 'sm' ? 14 : 18

  const label = mutual
    ? 'You both want this'
    : mine
      ? 'You want this — tap to undo'
      : 'Mark that you want this too'

  return (
    <button
      onClick={(e) => {
        // Lives inside a tappable row; don't open the detail sheet as well
        e.stopPropagation()
        onToggle(plan)
      }}
      aria-label={label}
      aria-pressed={mine}
      title={label}
      className={cn(
        'shrink-0 flex items-center gap-1 rounded-full transition-all active:scale-90',
        size === 'sm' ? 'h-8 px-1.5' : 'h-10 px-3',
        mutual
          ? 'text-blush-500'
          : mine
            ? 'text-blush-400'
            : 'text-warm-300 hover:text-blush-300'
      )}
    >
      <Heart
        size={iconSize}
        className={cn(mine && 'fill-current', mutual && 'animate-bounce-soft')}
      />
      {plan.hearted_by.length > 1 && (
        <span className={cn('font-semibold tabular-nums', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
          {plan.hearted_by.length}
        </span>
      )}
    </button>
  )
}
