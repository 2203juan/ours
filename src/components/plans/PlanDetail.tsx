import { useState } from 'react'
import {
  Edit2, Trash2, MapPin, CalendarDays, DollarSign,
  Instagram, ExternalLink, ChevronLeft, ChevronRight, Utensils,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Plan, Category, Session } from '../../types'
import { getPartnerName, getPartnerAvatar } from '../../types'
import { useUpdatePlan, useDeletePlan, isValidProposer } from '../../hooks/usePlans'
import { AvatarIcon } from '../ui/AvatarIcon'
import { StatusBadge, PriorityBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import { PlanForm } from './PlanForm'
import { formatBudget, formatDate, normalizeSocialUrl } from '../../lib/utils'

interface PlanDetailProps {
  plan: Plan
  categories: Category[]
  session: Session
  onClose: () => void
  onMarkedDone?: () => void
  onMovedToDo?: () => void
}


export function PlanDetail({ plan, categories, session, onClose, onMarkedDone, onMovedToDo }: PlanDetailProps) {
  const updatePlan = useUpdatePlan()
  const deletePlan = useDeletePlan()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  // Done note prompt state — pre-fill with existing note so re-marking done is easy to edit
  const [showDonePrompt, setShowDonePrompt] = useState(false)
  const [doneNote, setDoneNote] = useState(plan.completion_note ?? '')

  const proposerKey = isValidProposer(plan.proposed_by) ? plan.proposed_by : null

  const handleMarkDone = async () => {
    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        coupleId: session.coupleId,
        payload: { status: 'done', completion_note: doneNote.trim() || null },
      })
      toast.success('🎉 Marked as done!');
      (onMarkedDone ?? onClose)()
    } catch {
      toast.error('Could not update status.')
    }
  }

  const handleMoveToDo = async () => {
    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        coupleId: session.coupleId,
        payload: { status: 'to_do' },
      })
      toast.success('Moved back to To do');
      (onMovedToDo ?? onClose)()
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

  const instagramUrl = plan.instagram_ref
    ? normalizeSocialUrl(plan.instagram_ref, 'instagram')
    : null
  const tiktokUrl = plan.tiktok_url
    ? normalizeSocialUrl(plan.tiktok_url, 'tiktok')
    : null
  const hasSocial = !!(instagramUrl || tiktokUrl || plan.menu_url)

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
          {(() => {
            const locationLabel = plan.location_text || (plan.maps_url ? 'Location' : null)
            if (!locationLabel) return null
            return (
              <DetailRow icon={<MapPin size={14} />}>
                {plan.maps_url ? (
                  <a
                    href={plan.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sand-500 underline underline-offset-2"
                  >
                    {locationLabel}
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span>{locationLabel}</span>
                )}
              </DetailRow>
            )
          })()}
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
        </div>

        {/* Social + menu links */}
        {hasSocial && (
          <div className="flex flex-col gap-2">
            {plan.menu_url && (
              <SocialChip
                href={plan.menu_url}
                label="View menu"
                icon={<Utensils size={15} />}
                className="bg-sand-50 text-sand-600 border-sand-200 hover:bg-sand-100"
              />
            )}
            {instagramUrl && (
              <SocialChip
                href={instagramUrl}
                label="Instagram"
                icon={<Instagram size={15} />}
                className="bg-blush-100 text-blush-500 border-blush-200 hover:bg-blush-200"
              />
            )}
            {tiktokUrl && (
              <SocialChip
                href={tiktokUrl}
                label="TikTok"
                icon={<TikTokIcon size={15} />}
                className="bg-cream-100 text-warm-600 border-cream-300 hover:bg-cream-200"
              />
            )}
          </div>
        )}

        {/* Completion note */}
        {plan.completion_note && (
          plan.status === 'done' ? (
            <div className="rounded-2xl bg-sage-100/60 border border-sage-200 px-4 py-3
              flex flex-col gap-1 animate-fade-in">
              <span className="text-[10px] font-semibold text-sage-500 uppercase tracking-wide">
                Memory
              </span>
              <NoteContent text={plan.completion_note} className="text-sage-700" />
            </div>
          ) : (
            <div className="rounded-2xl bg-cream-100/80 border border-cream-300 px-4 py-3
              flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-warm-400 uppercase tracking-wide">
                Previous note
              </span>
              <NoteContent text={plan.completion_note} className="text-warm-500" />
            </div>
          )
        )}

        {/* Status toggle */}
        {plan.status === 'to_do' ? (
          showDonePrompt ? (
            <div className="rounded-2xl bg-sage-100/60 border border-sage-200 p-4
              flex flex-col gap-3 animate-fade-in">
              <p className="text-sm font-medium text-sage-700">How was it? ✨</p>
              <textarea
                value={doneNote}
                onChange={(e) => setDoneNote(e.target.value)}
                placeholder={"Leave a memory… (optional)\n\n• Burrata pizza\n• Truffle fries"}
                rows={4}
                className="w-full rounded-xl border border-sage-200 bg-white/70 px-3 py-2.5
                  text-sm text-warm-700 placeholder:text-warm-300 resize-none
                  focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleMarkDone}
                  disabled={updatePlan.isPending}
                  className="flex-1 rounded-xl bg-sage-400 text-white py-2.5 text-sm font-semibold
                    hover:bg-sage-500 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {updatePlan.isPending ? 'Saving…' : '✓ Save & mark done'}
                </button>
                <button
                  onClick={() => { setShowDonePrompt(false); setDoneNote(plan.completion_note ?? '') }}
                  className="px-4 rounded-xl bg-cream-100 text-warm-600 text-sm
                    hover:bg-cream-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDonePrompt(true)}
              className="w-full rounded-2xl bg-sage-300/40 text-sage-600 border border-sage-300
                py-3.5 text-sm font-semibold hover:bg-sage-300/60 active:scale-[0.98]
                transition-all"
            >
              ✓ Mark as done
            </button>
          )
        ) : (
          <button
            onClick={handleMoveToDo}
            disabled={updatePlan.isPending}
            className="w-full rounded-2xl bg-cream-100 text-warm-500 border border-cream-300
              py-3 text-sm font-medium hover:bg-cream-200 active:scale-[0.98]
              transition-all"
          >
            ↩ Move back to To do
          </button>
        )}

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

// ── Sub-components ────────────────────────────────────────────────────────────

const BULLET_RE = /^[-*•]\s+(.*)/

function NoteContent({ text, className = 'text-sage-700' }: { text: string; className?: string }) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []

  let bulletGroup: string[] = []

  const flushBullets = (key: string) => {
    if (!bulletGroup.length) return
    nodes.push(
      <ul key={key} className="flex flex-col gap-0.5 pl-1">
        {bulletGroup.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-sage-400 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
    bulletGroup = []
  }

  lines.forEach((line, i) => {
    const bullet = line.match(BULLET_RE)
    if (bullet) {
      bulletGroup.push(bullet[1])
    } else {
      flushBullets(`b-${i}`)
      if (line.trim() === '') {
        nodes.push(<div key={i} className="h-1.5" />)
      } else {
        nodes.push(<p key={i}>{line}</p>)
      }
    }
  })
  flushBullets('end')

  return (
    <div className={`text-sm leading-relaxed flex flex-col gap-1 ${className}`}>
      {nodes}
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

function SocialChip({
  href,
  label,
  icon,
  className,
}: {
  href: string
  label: string
  icon: React.ReactNode
  className: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3
        transition-colors active:scale-[0.98] ${className}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
      <ExternalLink size={12} className="ml-auto opacity-50" />
    </a>
  )
}

function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5
        2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27
        0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0
        6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
    </svg>
  )
}
