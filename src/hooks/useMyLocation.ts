import { useCallback, useEffect, useState } from 'react'
import { CALI_CENTER, isPlausible, type LatLng } from '../lib/geo'

/**
 * Where you are, as far as the phone will say.
 *
 * The map can't wait for a GPS fix to render — on iOS the permission prompt
 * alone can sit there for seconds, and a blank screen behind a dialog reads
 * as a broken app. So it opens on the last known position (or the middle of
 * Cali) and slides over once the real one arrives.
 */

const STORAGE_KEY = 'ours-last-location-v1'

/** Older than this and it's where you were last week, not where you are. */
const STALE_MS = 12 * 60 * 60 * 1000

export type LocationStatus =
  | 'locating'
  /** A real fix from the device. */
  | 'ready'
  /** Permission denied — the map still works, just centred on the city. */
  | 'denied'
  /** No GPS, timed out, or the browser has no geolocation at all. */
  | 'unavailable'

export interface MyLocation {
  point: LatLng
  status: LocationStatus
  /** True while `point` is the city centre or a remembered fix, not a live one. */
  approximate: boolean
  /** Ask again — for the "locate me" button after a denial or a timeout. */
  refresh: () => void
}

interface Stored {
  point: LatLng
  at: number
}

function readStored(): LatLng | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as Stored
    if (Date.now() - stored.at > STALE_MS) return null
    return isPlausible(stored.point) ? stored.point : null
  } catch {
    return null
  }
}

function store(point: LatLng) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ point, at: Date.now() } satisfies Stored))
  } catch {
    // Storage blocked; the fix just won't survive a reload
  }
}

export function useMyLocation(): MyLocation {
  const [point, setPoint] = useState<LatLng>(() => readStored() ?? CALI_CENTER)
  const [status, setStatus] = useState<LocationStatus>('locating')
  const [attempt, setAttempt] = useState(0)

  const refresh = useCallback(() => {
    setStatus('locating')
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      return
    }

    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (cancelled) return
        const fix = { lat: coords.latitude, lng: coords.longitude }
        if (!isPlausible(fix)) {
          setStatus('unavailable')
          return
        }
        setPoint(fix)
        setStatus('ready')
        store(fix)
      },
      (error) => {
        if (cancelled) return
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      {
        // Street-level is plenty for "how far is this by car", and the
        // coarse fix comes back in a fraction of the time.
        enableHighAccuracy: false,
        timeout: 10_000,
        // A fix from the last two minutes is still where you are, and reusing
        // it skips the wait entirely.
        maximumAge: 120_000,
      }
    )

    return () => {
      cancelled = true
    }
  }, [attempt])

  return { point, status, approximate: status !== 'ready', refresh }
}
