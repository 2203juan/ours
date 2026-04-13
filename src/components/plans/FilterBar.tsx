import { SlidersHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { PlanFilters, Category, Profile, PlanStatus } from '../../types'

interface FilterBarProps {
  filters: PlanFilters
  onChange: (f: PlanFilters) => void
  categories: Category[]
  profiles: Profile[]
}

const STATUSES: Array<{ value: PlanStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'selected', label: 'Selected' },
  { value: 'completed', label: 'Done' },
  { value: 'canceled', label: 'Canceled' },
]

export function FilterBar({ filters, onChange, categories, profiles }: FilterBarProps) {
  const activeCount = [
    filters.status !== 'all',
    filters.categoryId !== 'all',
    filters.proposedBy !== 'all',
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-white border-b border-cream-200">
      {/* Status pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => onChange({ ...filters, status: s.value })}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0',
              filters.status === s.value
                ? 'bg-warm-800 text-white'
                : 'bg-cream-100 text-warm-500 hover:bg-cream-200'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Category + Proposer selects */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            value={filters.categoryId}
            onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
            className="w-full appearance-none rounded-xl border border-cream-300 bg-cream-50 px-3 py-1.5 text-xs text-warm-700 focus:outline-none focus:ring-1 focus:ring-sand-400 pr-6"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none text-[10px]">▾</span>
        </div>

        {profiles.length > 1 && (
          <div className="relative flex-1">
            <select
              value={filters.proposedBy}
              onChange={(e) => onChange({ ...filters, proposedBy: e.target.value })}
              className="w-full appearance-none rounded-xl border border-cream-300 bg-cream-50 px-3 py-1.5 text-xs text-warm-700 focus:outline-none focus:ring-1 focus:ring-sand-400 pr-6"
            >
              <option value="all">Anyone</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none text-[10px]">▾</span>
          </div>
        )}

        {activeCount > 0 && (
          <button
            onClick={() => onChange({ status: 'all', categoryId: 'all', proposedBy: 'all' })}
            className="shrink-0 rounded-xl border border-blush-300 bg-blush-100 px-3 py-1.5 text-xs text-blush-500 font-medium hover:bg-blush-200 transition-colors flex items-center gap-1"
          >
            <SlidersHorizontal size={10} />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
