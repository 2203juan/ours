import { useMemo } from 'react'
import type { Plan, Session } from '../../types'
import { completionDate, isMutual } from '../../types'
import { formatBudget } from '../../lib/utils'

interface CoupleStatsProps {
  plans: Plan[]
  session: Session
}

interface Stats {
  total: number
  done: number
  doneThisYear: number
  mutual: number
  spent: number
  topCategory: { label: string; count: number } | null
  byPartner: { one: number; two: number }
}

function computeStats(plans: Plan[]): Stats {
  const thisYear = new Date().getFullYear()
  const categoryCounts = new Map<string, number>()

  let done = 0
  let doneThisYear = 0
  let mutual = 0
  let spent = 0
  const byPartner = { one: 0, two: 0 }

  for (const plan of plans) {
    if (plan.category) {
      const label = `${plan.category.emoji} ${plan.category.name}`
      categoryCounts.set(label, (categoryCounts.get(label) ?? 0) + 1)
    }
    if (isMutual(plan)) mutual++
    if (plan.proposed_by === 'one') byPartner.one++
    else if (plan.proposed_by === 'two') byPartner.two++

    if (plan.status === 'done') {
      done++
      if (completionDate(plan).getFullYear() === thisYear) doneThisYear++
      // Budget is an estimate, not a receipt — only count what you finished
      if (plan.budget_estimate != null) spent += plan.budget_estimate
    }
  }

  const top = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]

  return {
    total: plans.length,
    done,
    doneThisYear,
    mutual,
    spent,
    topCategory: top ? { label: top[0], count: top[1] } : null,
    byPartner,
  }
}

export function CoupleStats({ plans, session }: CoupleStatsProps) {
  const stats = useMemo(() => computeStats(plans), [plans])

  if (!stats.total) return null

  const { one, two } = stats.byPartner
  const proposedTotal = one + two
  const onePercent = proposedTotal ? Math.round((one / proposedTotal) * 100) : 50

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Us, in numbers</p>

      <div className="grid grid-cols-2 gap-2">
        <Tile value={stats.total} label="plans together" />
        <Tile value={stats.done} label="done" tone="sage" />
        <Tile value={stats.doneThisYear} label="done this year" />
        <Tile value={stats.mutual} label="you both want" tone="blush" />
      </div>

      {stats.spent > 0 && (
        <div className="rounded-2xl border border-cream-200 bg-white px-4 py-3">
          <p className="text-xs text-warm-400">Spent on plans you finished</p>
          <p className="font-serif text-2xl text-warm-800 mt-0.5">{formatBudget(stats.spent)}</p>
          <p className="text-[11px] text-warm-300 mt-1">
            Based on the estimates you entered, so treat it as a ballpark.
          </p>
        </div>
      )}

      {stats.topCategory && (
        <div className="rounded-2xl border border-cream-200 bg-white px-4 py-3">
          <p className="text-xs text-warm-400">Your favourite kind of plan</p>
          <p className="text-base font-medium text-warm-800 mt-0.5">
            {stats.topCategory.label}
          </p>
          <p className="text-[11px] text-warm-400 mt-0.5">
            {stats.topCategory.count} of {stats.total} plans
          </p>
        </div>
      )}

      {proposedTotal > 0 && (
        <div className="rounded-2xl border border-cream-200 bg-white px-4 py-3 flex flex-col gap-2">
          <p className="text-xs text-warm-400">Who proposes more</p>
          <div className="flex h-2 rounded-full overflow-hidden bg-cream-200">
            <div className="bg-sand-400" style={{ width: `${onePercent}%` }} />
            <div className="bg-blush-300 flex-1" />
          </div>
          <div className="flex justify-between text-[11px] text-warm-500">
            <span>
              {session.partnerOneName} · {one}
            </span>
            <span>
              {two} · {session.partnerTwoName}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function Tile({
  value,
  label,
  tone = 'default',
}: {
  value: number
  label: string
  tone?: 'default' | 'sage' | 'blush'
}) {
  const toneClass =
    tone === 'sage'
      ? 'text-sage-600'
      : tone === 'blush'
        ? 'text-blush-500'
        : 'text-warm-800'

  return (
    <div className="rounded-2xl border border-cream-200 bg-white px-4 py-3">
      <p className={`font-serif text-3xl tabular-nums ${toneClass}`}>{value}</p>
      <p className="text-[11px] text-warm-400 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}
