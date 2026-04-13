import { useState } from 'react'
import {
  Edit2, Trash2, MapPin, CalendarDays, DollarSign,
  Instagram, ExternalLink, ChevronLeft, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Plan, PlanStatus, Category, Session } from '../../types'
import { getPartnerName, getPartnerAvatar } from '../../types'
import { useUpdatePlan, useDeletePlan, isValidProposer } from '../../hooks/usePlans'
import { AvatarIcon } from '../ui/AvatarIcon'
import { StatusBadge, PriorityBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import { PlanForm } from './PlanForm'
import { formatBudget, formatDate } from '../../lib/utils'

interface PlanDetailProps {
  plan: Plan
  categories: Category[]
  session: Session
  onClose: () => void
}

const STATUS_ACTIONS: Array<{ status: PlanStatus; label: string; style: string }> = [
  { status: 'pending',   label: 'Mark Pending',  style: 'bg-cream-100 text-warm-600 border border-cream-300' },
  { status: 'selected',  label: '✓ Select',      style: 'bg-sand-100 text-sand-600 border border-sand-300' },
  { status: 'completed', label: '✓ Done',         style: 'bg-sage-300/40 text-sage-600 border border-sage-300' },
  { status: 'canceled',  label: '× Cancel',       style: 'bg-red-50 text-red-500 border border-red-200' },
]

export function PlanDetail({ plan, categories, session, onClose }: PlanDetailProps) {
  const updatePlan = useUpdatePlan()
  const deletePlan = useDeletePlan()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  const proposerKey = isValidProposer(plan.proposed_by) ? plan.proposed_by : null

  const handleStatusChange = async (status: PlanStatus) => {
    if (status === plan.status) return
    try {
      await updatePlan.mutateAsync({ id: plan.id, coupleId: session.coupleId, payload: { status } })
      toast.success(status === 'completed' ? '🎉 Marked as done!' : 'Status updated')
    } catch {
      toast.error('Could not update status.')
    }
  }

  const handleDelete = async () => {
    try {
      await deletePlan.mutateAsync({ plan })
      toast.success('Plan deleted')
      onClose()
    } catch {
      toast.error('Could not delete plan.')
    }
  }

  if (editing) {
    return (
      <Sheet open onClose={() => setEditing(false)} title="Edit plan" height="full">
        <PlanForm
          session={session}
          categories={categories}
          plan={plan}
          onDone={() => { setEditing(false); onClose() }}
        />
      </Sheet>
    )
  }

  return (
    <div className="flex flex-col pb-safe">
      {/* Image gallery */}
      {plan.images.length > 0 && (
        <div className="relative h-52 bg-cream-200 overflow-hidden">
          <img
            src={plan.images[imgIdx]}
            alt={plan.name}
            className="h-full w-full object-cover"
          />
          {plan.images.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full
                  bg-white/70 flex items-center justify-center"
                disabled={imgIdx === 0}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setImgIdx((i) => Math.min(plan.images.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full
                  bg-white/70 flex items-center justify-center"
                disabled={imgIdx === plan.images.length - 1}
              >
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {plan.images.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="px-5 pt-4 flex flex-col gap-4">
        {/* Title + actions */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-serif text-2xl text-warm-800 leading-snug flex-1">{plan.name}</h2>
            <div className="flex gap-2 shrink-0 mt-1">
              <button
                onClick={() => setEditing(true)}
                className="h-8 w-8 rounded-full bg-cream-100 flex items-center justify-center
                  text-warm-500 hover:bg-cream-200 transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => setConfirmDelete((v) => !v)}
                className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center
                  text-red-400 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={plan.status} />
            <PriorityBadge priority={plan.priority} />
            {plan.category && (
              <span className="text-xs text-warm-400">
                {plan.category.emoji} {plan.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Proposer */}
        {proposerKey && (
          <div className="flex items-center gap-2 text-sm text-warm-500">
            <AvatarIcon
              name={getPartnerName(session, proposerKey)}
              avatarKey={getPartnerAvatar(session, proposerKey)}
              size="xs"
            />
            <span>
              Proposed by{' '}
              <strong className="text-warm-700">{getPartnerName(session, proposerKey)}</strong>
            </span>
          </div>
        )}

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-warm-600 leading-relaxed">{plan.description}</p>
        )}

        {/* Details */}
        <div className="flex flex-col gap-2">
          {plan.location_text && (
            <DetailRow icon={<MapPin size={14} />}>
              {plan.maps_url ? (
                <a
                  href={plan.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sand-500 underline underline-offset-2"
                >
                  {plan.location_text}
                  <ExternalLink size={11} />
                </a>
              ) : (
                <span>{plan.location_text}</span>
              )}
            </DetailRow>
          )}
          {!plan.is_someday && plan.ideal_date && (
            <DetailRow icon={<CalendarDays size={14} />}>
              {formatDate(plan.ideal_date)}
            </DetailRow>
          )}
          {plan.is_someday && (
            <DetailRow icon={<CalendarDays size={14} />}>
              <span className="text-warm-400 italic">Someday…</span>
            </DetailRow>
          )}
          {plan.budget_estimate != null && (
            <DetailRow icon={<DollarSign size={14} />}>
              {formatBudget(plan.budget_estimate)} estimated
            </DetailRow>
          )}
          {plan.instagram_ref && (
            <DetailRow icon={<Instagram size={14} />}>
              <span className="text-warm-600">{plan.instagram_ref}</span>
            </DetailRow>
          )}
        </div>

        {/* Status actions */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Change status</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_ACTIONS.map((a) => (
              <button
                key={a.status}
                onClick={() => handleStatusChange(a.status)}
                disabled={updatePlan.isPending}
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition-all
                  ${a.style}
                  ${plan.status === a.status ? 'ring-2 ring-offset-1 ring-sand-400 font-semibold' : 'hover:opacity-80'}
                `}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex flex-col gap-3 animate-fade-in">
            <p className="text-sm text-red-700 font-medium">Delete this plan?</p>
            <p className="text-xs text-red-500">This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" loading={deletePlan.isPending} onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-warm-600">
      <span className="mt-0.5 text-warm-400 shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  )
}
