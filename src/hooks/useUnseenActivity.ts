import { useCallback, useState } from 'react'
import { useActivities } from './useActivities'

const storageKey = (coupleId: string) => `ours-activity-seen-${coupleId}`

function readSeenAt(coupleId: string): number {
  const raw = localStorage.getItem(storageKey(coupleId))
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Counts activity from your partner that you haven't looked at yet, using a
 * timestamp in localStorage. This is the no-backend stand-in for push: you
 * find out when you open the app, not before.
 *
 * Ownership is decided by `actor_name`, the only attribution the activities
 * table stores — so if both partners share a first name, their own additions
 * would also count as unseen.
 */
export function useUnseenActivity(coupleId: string, myName: string) {
  const { data: activities = [] } = useActivities(coupleId)
  const [seenAt, setSeenAt] = useState(() => readSeenAt(coupleId))

  // Compare epoch millis, not ISO strings: Postgres returns "+00:00" offsets
  // while Date#toISOString returns "Z", which breaks lexicographic ordering.
  const unseen = activities.filter(
    (a) => a.actor_name !== myName && new Date(a.created_at).getTime() > seenAt
  ).length

  const markSeen = useCallback(() => {
    const now = Date.now()
    localStorage.setItem(storageKey(coupleId), String(now))
    setSeenAt(now)
  }, [coupleId])

  return { unseen, markSeen }
}
