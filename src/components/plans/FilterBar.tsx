import { SlidersHorizontal } from 'lucide-react'
import type { PlanFilters, Category, Session } from '../../types'

interface FilterBarProps {
  filters: PlanFilters
  onChange: (f: PlanFilters) => void
  categories: Category[]
  session: Session
}

export function FilterBar({ filters, onChange, categories, session }: FilterBarProps) {
  const activeCount = [
    filters.categoryId !== 'all',
    filters.proposedBy !== 'all',
  ].filter(Boolean).length

  return (
    <div className="flex gap-2 px-4 py-2.5 bg-white border-b border-cream-200">
      <div className="relative flex-1">
        <select
          value={filters.categoryId}
          onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
          className="w-full appearance-none rounded-xl border border-cream-300 bg-cream-50
            px-3 py-1.5 text-xs text-warm-700 focus:outline-none focus:ring-1
            focus:ring-sand-400 pr-6"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400
          pointer-events-none text-[10px]">▾</span>
      </div>

      <div className="relative flex-1">
        <select
          value={filters.proposedBy}
          onChange={(e) =>
            onChange({ ...filters, proposedBy: e.target.value as PlanFilters['proposedBy'] })
          }
          className="w-full appearance-none rounded-xl border border-cream-300 bg-cream-50
            px-3 py-1.5 text-xs text-warm-700 focus:outline-none focus:ring-1
            focus:ring-sand-400 pr-6"
        >
          <option value="all">Anyone</option>
          <option value="one">{session.partnerOneName}</option>
          <option value="two">{session.partnerTwoName}</option>
        </select>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400
          pointer-events-none text-[10px]">▾</span>
      </div>

      {activeCount > 0 && (
        <button
          onClick={() => onChange({ categoryId: 'all', proposedBy: 'all' })}
          className="shrink-0 rounded-xl border border-blush-300 bg-blush-100 px-3 py-1.5
            text-xs text-blush-500 font-medium hover:bg-blush-200 transition-colors
            flex items-center gap-1"
        >
          <SlidersHorizontal size={10} />
          Clear
        </button>
      )}
    </div>
  )
}
