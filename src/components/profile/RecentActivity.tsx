import { useNavigate } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import { useActivities } from '../../hooks/useActivities'
import { useSessionStore } from '../../stores/sessionStore'
import type { Activity } from '../../types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function ActivityRow({ activity, onTap }: { activity: Activity; onTap: (id: string | null) => void }) {
  const tappable = !!activity.plan_id
  return (
    <button
      onClick={() => onTap(activity.plan_id)}
      disabled={!tappable}
      className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white
        px-4 py-3 text-left w-full transition-colors
        hover:bg-cream-50 active:bg-cream-100
        disabled:opacity-40 disabled:cursor-default"
    >
      <div className="h-8 w-8 rounded-full bg-sand-100 flex items-center justify-center shrink-0">
        <Sparkles size={13} className="text-sand-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-warm-800 truncate leading-snug">
          {activity.plan_name}
        </p>
        <p className="text-xs text-warm-400 mt-0.5">
          Added by {activity.actor_name} · {timeAgo(activity.created_at)}
        </p>
      </div>

      {tappable && (
        <ChevronRight size={14} className="text-warm-300 shrink-0" />
      )}
    </button>
  )
}

export function RecentActivity() {
  const session = useSessionStore((s) => s.session)!
  const { data: activities = [], isLoading } = useActivities(session.coupleId)
  const navigate = useNavigate()

  const handleTap = (planId: string | null) => {
    if (!planId) return
    navigate('/', { state: { openPlanId: planId } })
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Recent activity</p>

      {isLoading ? (
        <div className="rounded-2xl border border-cream-200 bg-cream-50 px-4 py-5">
          <div className="h-4 w-32 bg-cream-200 rounded animate-pulse" />
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-2xl border border-cream-200 bg-cream-50 px-4 py-5 text-center">
          <p className="text-sm text-warm-400">No recent activity yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {activities.map((a) => (
            <ActivityRow key={a.id} activity={a} onTap={handleTap} />
          ))}
        </div>
      )}
    </div>
  )
}
