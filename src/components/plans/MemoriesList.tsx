import { CheckCheck, SearchX, Quote } from 'lucide-react'
import type { Plan, Category, PlanFilters, Session } from '../../types'
import { completionDate, getPartnerAvatar, getPartnerName } from '../../types'
import { filterPlans, isValidProposer } from '../../hooks/usePlans'
import { AvatarIcon } from '../ui/AvatarIcon'
import { StarRatingDisplay } from '../ui/StarRating'
import { formatMonth, formatBudget, LOCALE } from '../../lib/utils'

interface MemoriesListProps {
  plans: Plan[] // already filtered to status === 'done'
  filters: PlanFilters
  session: Session
  categories: Category[]
  onPlanClick: (plan: Plan) => void
  onClearFilters: () => void
}

interface MonthGroup {
  key: string
  label: string
  plans: Plan[]
}

/** Newest month first, and newest plan first inside each month. */
function groupByMonth(plans: Plan[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>()

  for (const plan of [...plans].sort(
    (a, b) => completionDate(b).getTime() - completionDate(a).getTime()
  )) {
    const date = completionDate(plan)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const existing = groups.get(key)
    if (existing) existing.plans.push(plan)
    else groups.set(key, { key, label: formatMonth(date), plans: [plan] })
  }

  return [...groups.values()]
}

/**
 * The Done tab, as a timeline rather than another checklist. These are the
 * only entries in the app that can't be recreated — the note written after
 * the fact — so they get the photo and the words, not a one-line row.
 */
export function MemoriesList({
  plans,
  filters,
  session,
  onPlanClick,
  onClearFilters,
}: MemoriesListProps) {
  const filtered = filterPlans(plans, filters)

  if (!filtered.length) {
    const searching = filters.search.trim()
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="h-14 w-14 rounded-full bg-cream-100 flex items-center justify-center mb-4">
          {searching ? (
            <SearchX size={22} className="text-warm-300" />
          ) : (
            <CheckCheck size={22} className="text-warm-300" />
          )}
        </div>
        {searching ? (
          <>
            <p className="text-warm-600 font-medium mb-1">No memories match “{searching}”</p>
            <button
              onClick={onClearFilters}
              className="text-sm font-medium text-sand-500 underline underline-offset-2 mt-4"
            >
              Clear search &amp; filters
            </button>
          </>
        ) : (
          <>
            <p className="text-warm-600 font-medium mb-1">No memories yet</p>
            <p className="text-sm text-warm-400">
              Plans you finish show up here, with whatever you wrote about them.
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-32 flex flex-col gap-6">
      {groupByMonth(filtered).map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg text-warm-700 capitalize">{group.label}</h2>
            <div className="flex-1 h-px bg-cream-200" />
            <span className="text-[11px] font-semibold text-warm-400 tabular-nums">
              {group.plans.length}
            </span>
          </div>

          {group.plans.map((plan) => (
            <MemoryCard
              key={plan.id}
              plan={plan}
              session={session}
              onClick={() => onPlanClick(plan)}
            />
          ))}
        </section>
      ))}
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────

function MemoryCard({
  plan,
  session,
  onClick,
}: {
  plan: Plan
  session: Session
  onClick: () => void
}) {
  const proposerKey = isValidProposer(plan.proposed_by) ? plan.proposed_by : null
  const day = completionDate(plan).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
  })

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-3xl bg-white border border-cream-200 shadow-soft
        overflow-hidden active:scale-[0.99] transition-transform"
    >
      {plan.images.length > 0 && (
        <div className="relative h-40 bg-cream-200">
          <img
            src={plan.images[0]}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {plan.images.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-scrim/60 px-2 py-0.5
              text-[10px] font-medium text-pure-white">
              +{plan.images.length - 1}
            </span>
          )}
        </div>
      )}

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl text-warm-800 leading-snug flex-1">{plan.name}</h3>
          <span className="shrink-0 text-[11px] text-warm-400 mt-1.5 tabular-nums">{day}</span>
        </div>

        {plan.completion_note && (
          <div className="flex gap-2 rounded-2xl bg-sage-100 border border-sage-200 px-3 py-2.5">
            <Quote size={12} className="shrink-0 mt-1 text-sage-500" />
            <p className="text-sm text-sage-700 leading-relaxed whitespace-pre-line line-clamp-3">
              {plan.completion_note}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap text-[11px] text-warm-400">
          {plan.category && (
            <span>
              {plan.category.emoji} {plan.category.name}
            </span>
          )}
          {plan.maps_url && plan.maps_rating != null && (
            <StarRatingDisplay rating={plan.maps_rating} />
          )}
          {plan.budget_estimate != null && <span>{formatBudget(plan.budget_estimate)}</span>}
          {proposerKey && (
            <span className="flex items-center gap-1 ml-auto">
              <AvatarIcon
                name={getPartnerName(session, proposerKey)}
                avatarKey={getPartnerAvatar(session, proposerKey)}
                size="xs"
              />
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
