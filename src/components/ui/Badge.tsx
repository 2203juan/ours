import { cn } from '../../lib/utils'
import type { PlanStatus, PlanPriority } from '../../types'

// ── Status badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<PlanStatus, string> = {
  to_do: 'bg-cream-200 text-warm-600',
  done:  'bg-sage-300/40 text-sage-600',
}

const statusLabels: Record<PlanStatus, string> = {
  to_do: 'To do',
  done:  'Done',
}

const statusDot: Record<PlanStatus, string> = {
  to_do: 'bg-warm-400',
  done:  'bg-sage-500',
}

interface StatusBadgeProps {
  status: PlanStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', statusDot[status])} />
      {statusLabels[status]}
    </span>
  )
}

// ── Priority badge ────────────────────────────────────────────────────────────

const priorityStyles: Record<PlanPriority, string> = {
  low: 'text-warm-400',
  normal: 'text-warm-600',
  high: 'text-sand-500',
}

const priorityLabels: Record<PlanPriority, string> = {
  low: 'Low',
  normal: '',
  high: '↑ High',
}

interface PriorityBadgeProps {
  priority: PlanPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  if (priority === 'normal') return null
  return (
    <span className={cn('text-xs font-medium', priorityStyles[priority], className)}>
      {priorityLabels[priority]}
    </span>
  )
}
