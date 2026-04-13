import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Plan, Category } from '../../types'
import { PlanItem } from './PlanItem'

interface CategorySectionProps {
  category: Category | null // null = "Uncategorized"
  plans: Plan[]
  defaultOpen?: boolean
  onPlanClick: (plan: Plan) => void
  isMe: (profileId: string | null) => boolean
}

export function CategorySection({
  category,
  plans,
  defaultOpen = true,
  onPlanClick,
  isMe,
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (!plans.length) return null

  const label = category ? `${category.emoji} ${category.name}` : '· Uncategorized'
  const pendingCount = plans.filter((p) => p.status === 'pending').length

  return (
    <div className="border-b border-cream-200 last:border-b-0">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-cream-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-warm-600 uppercase tracking-wider">
            {label}
          </span>
          <span className="text-[10px] text-warm-400 font-medium">
            {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
            {pendingCount > 0 && pendingCount !== plans.length && ` · ${pendingCount} pending`}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            'text-warm-400 transition-transform duration-200',
            open ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>

      {/* Plans list */}
      {open && (
        <div className="animate-fade-in">
          {plans.map((plan) => (
            <PlanItem
              key={plan.id}
              plan={plan}
              onClick={onPlanClick}
              isMe={isMe}
            />
          ))}
        </div>
      )}
    </div>
  )
}
