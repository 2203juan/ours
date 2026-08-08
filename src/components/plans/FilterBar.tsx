import { Search, X, ArrowUpDown, Heart } from 'lucide-react'
import type { PlanFilters, PlanSort, Category, Session } from '../../types'
import { SORT_LABELS, DEFAULT_FILTERS } from '../../types'
import { cn } from '../../lib/utils'

/**
 * Filtering is an occasional action, so the controls no longer sit on screen
 * permanently — they used to cost 95px of every visit. `FilterPanel` opens on
 * demand; `ActiveFilterChips` is the always-visible-but-only-when-relevant
 * reminder of what's currently narrowing the list.
 */

export function countActiveFilters(filters: PlanFilters): number {
  return [
    filters.categoryId !== 'all',
    filters.proposedBy !== 'all',
    filters.sort !== DEFAULT_FILTERS.sort,
    filters.search.trim() !== '',
    filters.mutualOnly,
  ].filter(Boolean).length
}

const SELECT_CLASS =
  'w-full appearance-none rounded-xl border border-cream-300 bg-cream-50 ' +
  'px-3 py-2 text-xs text-warm-700 focus:outline-none focus:ring-1 ' +
  'focus:ring-sand-400 pr-6'

// ── Panel ────────────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filters: PlanFilters
  onChange: (f: PlanFilters) => void
  categories: Category[]
  session: Session
  /** Hides the sort control where it has no effect (the Memories timeline). */
  showSort?: boolean
}

export function FilterPanel({
  filters,
  onChange,
  categories,
  session,
  showSort = true,
}: FilterPanelProps) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-white border-b border-cream-200 animate-fade-in">
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
          autoFocus
          className="w-full rounded-xl border border-cream-300 bg-cream-50 pl-8 pr-9 py-2
            text-xs text-warm-700 placeholder:text-warm-400
            focus:outline-none focus:ring-1 focus:ring-sand-400
            [&::-webkit-search-cancel-button]:hidden"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full
              flex items-center justify-center text-warm-400 hover:text-warm-600
              transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

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
          <Caret />
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
          <Caret />
        </div>
      </div>

      <div className="flex gap-2">
        {showSort && (
          <div className="relative flex-1 min-w-0">
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
        )}

        <button
          onClick={() => onChange({ ...filters, mutualOnly: !filters.mutualOnly })}
          aria-pressed={filters.mutualOnly}
          className={cn(
            'flex-1 min-w-0 rounded-xl border px-3 py-2 text-xs font-medium',
            'flex items-center justify-center gap-1.5 transition-colors',
            filters.mutualOnly
              ? 'border-blush-300 bg-blush-100 text-blush-500'
              : 'border-cream-300 bg-cream-50 text-warm-500 hover:text-blush-400'
          )}
        >
          <Heart size={12} className={cn(filters.mutualOnly && 'fill-current')} />
          Both want
        </button>

        {countActiveFilters(filters) > 0 && (
          <button
            onClick={() => onChange({ ...DEFAULT_FILTERS })}
            className="shrink-0 rounded-xl border border-cream-300 bg-cream-50 px-3 py-2
              text-xs font-medium text-warm-500 hover:text-warm-700 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

function Caret() {
  return (
    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400
      pointer-events-none text-[10px]">▾</span>
  )
}

// ── Active chips ─────────────────────────────────────────────────────────────

interface ActiveFilterChipsProps {
  filters: PlanFilters
  onChange: (f: PlanFilters) => void
  categories: Category[]
  session: Session
}

/**
 * Only rendered when something is actually filtering, so it costs nothing in
 * the common case — but without it a collapsed panel could silently hide half
 * the list.
 */
export function ActiveFilterChips({
  filters,
  onChange,
  categories,
  session,
}: ActiveFilterChipsProps) {
  const chips: Array<{ key: string; label: string; clear: Partial<PlanFilters> }> = []

  if (filters.search.trim()) {
    chips.push({
      key: 'search',
      label: `“${filters.search.trim()}”`,
      clear: { search: '' },
    })
  }
  if (filters.categoryId !== 'all') {
    const category = categories.find((c) => c.id === filters.categoryId)
    chips.push({
      key: 'category',
      label: category ? `${category.emoji} ${category.name}` : 'Category',
      clear: { categoryId: 'all' },
    })
  }
  if (filters.proposedBy !== 'all') {
    chips.push({
      key: 'proposer',
      label:
        filters.proposedBy === 'one' ? session.partnerOneName : session.partnerTwoName,
      clear: { proposedBy: 'all' },
    })
  }
  if (filters.mutualOnly) {
    chips.push({ key: 'mutual', label: '❤️ Both want', clear: { mutualOnly: false } })
  }
  if (filters.sort !== DEFAULT_FILTERS.sort) {
    chips.push({
      key: 'sort',
      label: SORT_LABELS[filters.sort],
      clear: { sort: DEFAULT_FILTERS.sort },
    })
  }

  if (!chips.length) return null

  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 py-2 bg-white
      border-b border-cream-200">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => onChange({ ...filters, ...chip.clear })}
          aria-label={`Remove filter ${chip.label}`}
          className="shrink-0 flex items-center gap-1 rounded-full bg-cream-100
            border border-cream-300 pl-2.5 pr-1.5 py-1 text-xs text-warm-600
            hover:bg-cream-200 transition-colors max-w-[60vw]"
        >
          <span className="truncate">{chip.label}</span>
          <X size={11} className="shrink-0 text-warm-400" />
        </button>
      ))}
    </div>
  )
}
