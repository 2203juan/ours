import { Search, X, ArrowUpDown } from 'lucide-react'
import type { PlanFilters, PlanSort, Category, Session } from '../../types'
import { SORT_LABELS, DEFAULT_FILTERS } from '../../types'

interface FilterBarProps {
  filters: PlanFilters
  onChange: (f: PlanFilters) => void
  categories: Category[]
  session: Session
}

const SELECT_CLASS =
  'w-full appearance-none rounded-xl border border-cream-300 bg-cream-50 ' +
  'px-3 py-1.5 text-xs text-warm-700 focus:outline-none focus:ring-1 ' +
  'focus:ring-sand-400 pr-6'

export function FilterBar({ filters, onChange, categories, session }: FilterBarProps) {
  const activeCount = [
    filters.categoryId !== 'all',
    filters.proposedBy !== 'all',
    filters.sort !== DEFAULT_FILTERS.sort,
    filters.search.trim() !== '',
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-2 px-4 py-2.5 bg-white border-b border-cream-200">
      {/* Search */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none"
        />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search plans, places, notes…"
          aria-label="Search plans"
          className="w-full rounded-xl border border-cream-300 bg-cream-50 pl-8 pr-8 py-1.5
            text-xs text-warm-700 placeholder:text-warm-400
            focus:outline-none focus:ring-1 focus:ring-sand-400
            [&::-webkit-search-cancel-button]:hidden"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full
              flex items-center justify-center text-warm-400 hover:text-warm-600
              hover:bg-cream-200 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Category · Proposer · Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <select
            value={filters.categoryId}
            onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
            aria-label="Filter by category"
            className={SELECT_CLASS}
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

        <div className="relative flex-1 min-w-0">
          <select
            value={filters.proposedBy}
            onChange={(e) =>
              onChange({ ...filters, proposedBy: e.target.value as PlanFilters['proposedBy'] })
            }
            aria-label="Filter by who proposed it"
            className={SELECT_CLASS}
          >
            <option value="all">Anyone</option>
            <option value="one">{session.partnerOneName}</option>
            <option value="two">{session.partnerTwoName}</option>
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400
            pointer-events-none text-[10px]">▾</span>
        </div>

        <div className="relative shrink-0">
          <ArrowUpDown
            size={11}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none"
          />
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as PlanSort })}
            aria-label="Sort plans"
            className={`${SELECT_CLASS} pl-7`}
          >
            {(Object.keys(SORT_LABELS) as PlanSort[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {activeCount > 0 && (
          <button
            onClick={() => onChange({ ...DEFAULT_FILTERS })}
            className="shrink-0 rounded-xl border border-blush-300 bg-blush-100 px-3 py-1.5
              text-xs text-blush-500 font-medium hover:bg-blush-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
