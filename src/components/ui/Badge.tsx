import { cn } from '../../lib/utils'
import type { PlanStatus, PlanPriority } from '../../types'

// ── Status badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<PlanStatus, string> = {
  pending: 'bg-cream-200 text-warm-600',
  selected: 'bg-sand-300 text-sand-600',
  completed: 'bg-sage-300 text-sage-600',
  canceled: 'bg-red-100 text-red-500',
}

const statusLabels: Record<PlanStatus, string> = {
  pending: 'Pending',
  selected: 'Selected',
  completed: 'Done',
  canceled: 'Canceled',
}

const statusDot: Record<PlanStatus, string> = {
  pending: 'bg-warm-400',
  selected: 'bg-sand-500',
  completed: 'bg-sage-500',
  canceled: 'bg-red-400',
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

/** Compact dot-only status indicator */
export function StatusDot({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full shrink-0',
        statusDot[status],
        className
      )}
    />
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
