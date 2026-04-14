import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Plan, Category, Session } from '../../types'
import { PlanItem } from './PlanItem'

interface CategorySectionProps {
  category: Category | null
  plans: Plan[]
  defaultOpen?: boolean
  session: Session
  onPlanClick: (plan: Plan) => void
}

export function CategorySection({
  category,
  plans,
  defaultOpen = true,
  session,
  onPlanClick,
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (!plans.length) return null

  const label = category ? `${category.emoji} ${category.name}` : '· Uncategorized'

  return (
    <div className="mx-4 mb-3 rounded-3xl bg-white border border-cream-200 overflow-hidden shadow-soft">
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5
          hover:bg-cream-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-warm-700">
            {label}
          </span>
          <span className="text-[10px] font-semibold text-warm-400 bg-cream-100
            rounded-full px-2 py-0.5 leading-none tabular-nums">
            {plans.length}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            'text-warm-400 transition-transform duration-200 shrink-0',
            open ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>

      {/* Plan items */}
      {open && (
        <div className="border-t border-cream-100 animate-fade-in">
          {plans.map((plan) => (
            <PlanItem
              key={plan.id}
              plan={plan}
              session={session}
              onClick={onPlanClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
