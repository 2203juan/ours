/**
 * Coordinates, distances and the labels the map puts on them.
 *
 * Nothing here talks to the network — see `routing.ts` for driving times and
 * `usePlanGeo.ts` for turning a saved link into a pin.
 */

export interface LatLng {
  lat: number
  lng: number
}

/** Plaza de Caycedo. Where the map opens before the phone says otherwise. */
export const CALI_CENTER: LatLng = { lat: 3.4516, lng: -76.532 }

/**
 * How far from that centre still counts as "around Cali". Dapa, Pance and
 * Jamundí are all normal weekend plans, so this is generous on purpose; past
 * it, a pin is a geocoding mistake rather than a long drive.
 */
export const METRO_RADIUS_KM = 80

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function isPlausible(point: LatLng): boolean {
  if (!isFinite(point.lat) || !isFinite(point.lng)) return false
  if (Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) return false
  // 0,0 is open ocean — always a parsing failure, never a place
  return !(point.lat === 0 && point.lng === 0)
}

// ── Reading coordinates out of a Maps link ───────────────────────────────────

/**
 * Some Google Maps links carry the pin in the URL itself. Those can be read
 * here and skip the round trip to the edge function entirely.
 *
 *   !3d3.45!4d-76.53  → the place's own pin, inside the `data=` blob
 *   /@3.45,-76.53,17z → the map centre, which is the place often enough
 *   ?q=3.45,-76.53    → explicit coordinates in the query
 *
 * Short `maps.app.goo.gl` links carry none of these, which is the whole
 * reason the edge function exists.
 */
export function coordsFromMapsUrl(raw: string | null | undefined): LatLng | null {
  if (!raw) return null

  const pin = raw.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (pin) return toPoint(pin[1], pin[2])

  const at = raw.match(/[/@](-?\d+\.\d+),(-?\d+\.\d+)/)
  if (at) return toPoint(at[1], at[2])

  try {
    const params = new URL(raw).searchParams
    for (const key of ['q', 'query', 'll', 'destination', 'daddr', 'center']) {
      const pair = params.get(key)?.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/)
      if (pair) return toPoint(pair[1], pair[2])
    }
  } catch {
    // Not a parseable URL; the regexes above already had their turn
  }

  return null
}

function toPoint(latText: string, lngText: string): LatLng | null {
  const point = { lat: Number(latText), lng: Number(lngText) }
  return isPlausible(point) ? point : null
}

// ── Labels ───────────────────────────────────────────────────────────────────

/**
 * Driving time, rounded the way a person would say it out loud. Under an
 * hour it's plain minutes; past that, hours and minutes, because "83 min"
 * makes you do arithmetic at a red light.
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

/** Distance with one decimal only where it carries information. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`
}

/**
 * A driving estimate for when the routing service is unreachable.
 *
 * Straight-line distance stretched by 1.4 — streets don't go through
 * buildings — over an average speed that already accounts for Cali's traffic
 * lights and rush hour. It is rough, and the map labels it as such.
 */
const DETOUR_FACTOR = 1.4
const CITY_KMH = 24

export function estimateDrivingSeconds(from: LatLng, to: LatLng): number {
  const km = haversineKm(from, to) * DETOUR_FACTOR
  return (km / CITY_KMH) * 3600
}
