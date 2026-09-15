/**
 * Driving times from where you are to every pin on the map.
 *
 * OSRM's public server answers a whole map in one request: give it your
 * position as the source and every place as a destination, and it returns
 * the driving duration to each. That matters on a phone — the alternative,
 * one request per place, would be 20 round trips on mobile data before the
 * first label appears.
 *
 * There is no live traffic here (the public server routes on speed limits),
 * so times read a little optimistic at 6pm on a Friday. The map says
 * "approx." rather than pretending otherwise. Adding traffic would mean a
 * Google Directions key, billing, and that key sitting in a static build
 * where anyone can read it.
 */

import { estimateDrivingSeconds, formatDuration, haversineKm, type LatLng } from './geo'

const OSRM_BASE = 'https://router.project-osrm.org/table/v1/driving'

/** Past this the public server starts refusing; the map never has this many. */
const MAX_DESTINATIONS = 90

/** Long enough that a request can't hang the map, short enough to feel snappy. */
const TIMEOUT_MS = 8000

export interface Trip {
  /** Driving seconds, or null when neither routing nor an estimate applied. */
  seconds: number | null
  /** Straight-line km — always available, used for sorting by closeness. */
  km: number
  /** True when `seconds` is a guess rather than a real route. */
  estimated: boolean
}

export type TripMap = Record<string, Trip>

// ── Cache ────────────────────────────────────────────────────────────────────

/**
 * Driving time between two fixed points doesn't change (no traffic in the
 * data), so a cached answer stays good for a week. Keyed on both endpoints
 * rounded to ~100 m: walking around the block shouldn't invalidate it, but
 * driving across town should.
 */
const CACHE_KEY = 'ours-trip-cache-v1'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const CACHE_LIMIT = 400

interface CacheEntry {
  seconds: number
  at: number
}

const round = (value: number) => value.toFixed(3)
const tripKey = (from: LatLng, to: LatLng) =>
  `${round(from.lat)},${round(from.lng)}>${round(to.lat)},${round(to.lng)}`

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {}
  } catch {
    // Private browsing, blocked storage, corrupted JSON — the cache is an
    // optimisation, never a requirement
    return {}
  }
}

function writeCache(cache: Record<string, CacheEntry>) {
  try {
    const entries = Object.entries(cache)
    // Trim oldest first so a year of map-opening can't fill the quota
    const kept =
      entries.length > CACHE_LIMIT
        ? entries.sort((a, b) => b[1].at - a[1].at).slice(0, CACHE_LIMIT)
        : entries
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(kept)))
  } catch {
    // Storage full or unavailable; nothing to do about it
  }
}

// ── Lookup ───────────────────────────────────────────────────────────────────

export interface Destination {
  id: string
  point: LatLng
}

/**
 * Resolve driving times for every destination at once.
 *
 * Always resolves: a failed request downgrades to a distance-based estimate
 * rather than leaving the map without labels, which is the one outcome that
 * would make the feature feel broken.
 */
export async function fetchTrips(from: LatLng, destinations: Destination[]): Promise<TripMap> {
  const trips: TripMap = {}
  for (const { id, point } of destinations) {
    trips[id] = { seconds: null, km: haversineKm(from, point), estimated: true }
  }

  if (destinations.length === 0) return trips

  const cache = readCache()
  const now = Date.now()
  const pending: Destination[] = []

  for (const destination of destinations) {
    const cached = cache[tripKey(from, destination.point)]
    if (cached && now - cached.at < CACHE_TTL_MS) {
      trips[destination.id] = { ...trips[destination.id], seconds: cached.seconds, estimated: false }
    } else {
      pending.push(destination)
    }
  }

  const batch = pending.slice(0, MAX_DESTINATIONS)

  if (batch.length > 0) {
    const durations = await requestDurations(from, batch)

    if (durations) {
      batch.forEach((destination, index) => {
        const seconds = durations[index]
        if (seconds == null || !isFinite(seconds)) return
        trips[destination.id] = { ...trips[destination.id], seconds, estimated: false }
        cache[tripKey(from, destination.point)] = { seconds, at: now }
      })
      writeCache(cache)
    }
  }

  // Whatever is still unrouted (offline, server down, a place OSRM can't
  // reach by road) falls back to the estimate.
  for (const destination of destinations) {
    const trip = trips[destination.id]
    if (trip.seconds == null) {
      trips[destination.id] = {
        ...trip,
        seconds: estimateDrivingSeconds(from, destination.point),
        estimated: true,
      }
    }
  }

  return trips
}

/** Durations in seconds, aligned with `destinations`, or null if the call failed. */
async function requestDurations(
  from: LatLng,
  destinations: Destination[]
): Promise<Array<number | null> | null> {
  // OSRM takes lng,lat — the opposite order of everything else here
  const coordinates = [from, ...destinations.map((d) => d.point)]
    .map((p) => `${p.lng},${p.lat}`)
    .join(';')

  const url = `${OSRM_BASE}/${coordinates}?sources=0&annotations=duration`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) return null

    const body = await response.json()
    if (body?.code !== 'Ok' || !Array.isArray(body.durations?.[0])) return null

    // Row 0 is our position; its first column is the trip to ourselves
    return (body.durations[0] as Array<number | null>).slice(1)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** The short label a marker wears: "12 min", or "~12 min" when estimated. */
export function tripLabel(trip: Trip | undefined): string | null {
  if (!trip?.seconds) return null
  const text = formatDuration(trip.seconds)
  return trip.estimated ? `~${text}` : text
}
