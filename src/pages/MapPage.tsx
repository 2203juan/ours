import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { Crosshair, LocateFixed, MapPin } from 'lucide-react'
import { usePlans } from '../hooks/usePlans'
import { useCategories } from '../hooks/useCategories'
import { useSessionStore } from '../stores/sessionStore'
import { useMyLocation } from '../hooks/useMyLocation'
import { useResolveMissingCoords } from '../hooks/usePlanGeo'
import { fetchTrips, tripLabel, type TripMap } from '../lib/routing'
import { hasCoords, isLocatable, type LocatedPlan, type Plan, type PlanStatus } from '../types'
import { cn } from '../lib/utils'
import { Sheet } from '../components/ui/Sheet'
import { MapCanvas } from '../components/map/MapCanvas'
import { MINI_WIDTH, PIN_HEIGHT, myLocationPin, planPin } from '../components/map/pins'
import { PlaceCard, UnlocatedRow } from '../components/map/PlaceCard'
import { LocationPicker } from '../components/map/LocationPicker'

/**
 * The map tab: every saved place around you, each wearing how long it takes
 * to drive there.
 *
 * The list already answers "what could we do"; this answers the question you
 * actually argue about on a Friday night, which is "what's close". So the
 * driving time is on the map itself rather than behind a tap, and the rail
 * along the bottom is ordered by it — the first card is always the nearest
 * thing you haven't done.
 */

type StatusFilter = PlanStatus | 'all'

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'to_do', label: 'To do' },
  { key: 'done', label: 'Done' },
  { key: 'all', label: 'All' },
]

export function MapPage() {
  const session = useSessionStore((s) => s.session)!
  const navigate = useNavigate()

  const { data: plans = [] } = usePlans(session.coupleId)
  const { data: categories = [] } = useCategories(session.coupleId)
  const me = useMyLocation()

  // Plans saved with a link but no pin get resolved in the background, one
  // at a time, the first time the map sees them.
  const resolving = useResolveMissingCoords(plans, session.coupleId)

  const [status, setStatus] = useState<StatusFilter>('to_do')
  const [categoryId, setCategoryId] = useState<string | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [trips, setTrips] = useState<TripMap>({})
  const [pinningPlan, setPinningPlan] = useState<Plan | null>(null)
  const [missingOpen, setMissingOpen] = useState(false)

  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef(new Map<string, L.Marker>())
  const meMarkerRef = useRef<L.Marker | null>(null)
  const railRef = useRef<HTMLDivElement>(null)
  /** Read by the declutter pass, which runs outside React on map events. */
  const visibleRef = useRef<LocatedPlan[]>([])
  const tripsRef = useRef<TripMap>({})
  const selectedRef = useRef<string | null>(null)
  /** True while the map is moving because a card was tapped, not the user. */
  const programmaticPan = useRef(false)
  const fittedRef = useRef(false)

  // ── What's on the map ──────────────────────────────────────────────────────

  const visible = useMemo(() => {
    return plans
      .filter(hasCoords)
      .filter((plan) => status === 'all' || plan.status === status)
      .filter((plan) => categoryId === 'all' || plan.category_id === categoryId)
  }, [plans, status, categoryId])

  /** Places with a location saved but no pin — the ones worth offering to fix. */
  const missing = useMemo(
    () => plans.filter((plan) => !hasCoords(plan) && isLocatable(plan)),
    [plans]
  )

  /** Nearest first: the rail's order is the answer to "where should we go". */
  const ordered = useMemo(() => {
    return [...visible].sort((a, b) => {
      const ta = trips[a.id]
      const tb = trips[b.id]
      if (!ta || !tb) return 0
      return (ta.seconds ?? ta.km * 1000) - (tb.seconds ?? tb.km * 1000)
    })
  }, [visible, trips])

  // ── Driving times ──────────────────────────────────────────────────────────

  // One request covers the whole map. Re-run when the set of pins changes or
  // you've actually moved — not on every pan, which would hammer the router.
  const tripSignature = useMemo(
    () =>
      [...visible]
        .map((p) => p.id)
        .sort()
        .join(','),
    [visible]
  )

  const origin = `${me.point.lat.toFixed(3)},${me.point.lng.toFixed(3)}`

  useEffect(() => {
    if (visible.length === 0) return
    let cancelled = false

    fetchTrips(
      me.point,
      visible.map((plan) => ({ id: plan.id, point: { lat: plan.lat, lng: plan.lng } }))
    ).then((result) => {
      if (!cancelled) setTrips((prev) => ({ ...prev, ...result }))
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripSignature, origin])

  // ── Map wiring ─────────────────────────────────────────────────────────────

  const handleReady = useCallback((map: L.Map | null) => {
    mapRef.current = map
    if (!map) {
      markersRef.current.clear()
      meMarkerRef.current = null
      fittedRef.current = false
    }
  }, [])

  // Your own dot
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const position: L.LatLngExpression = [me.point.lat, me.point.lng]

    if (meMarkerRef.current) {
      meMarkerRef.current.setLatLng(position).setIcon(myLocationPin(me.approximate))
    } else {
      meMarkerRef.current = L.marker(position, {
        icon: myLocationPin(me.approximate),
        interactive: false,
        // Under the place pins: it's a reference point, not a destination
        zIndexOffset: -500,
      }).addTo(map)
    }
  }, [me.point, me.approximate])

  // The place pins, rebuilt whenever the set or its labels change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const live = new Set(visible.map((plan) => plan.id))

    for (const [id, marker] of markersRef.current) {
      if (!live.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    }

    for (const plan of visible) {
      const icon = planPin({
        emoji: plan.category?.emoji ?? '📍',
        name: plan.name,
        photo: plan.images[0] ?? null,
        rating: plan.maps_rating,
        label: tripLabel(trips[plan.id]),
        selected: plan.id === selectedId,
        done: plan.status === 'done',
      })

      const existing = markersRef.current.get(plan.id)
      if (existing) {
        existing.setLatLng([plan.lat, plan.lng]).setIcon(icon)
        continue
      }

      const marker = L.marker([plan.lat, plan.lng], { icon, title: plan.name })
        .addTo(map)
        .on('click', () => selectPlan(plan.id, { pan: false }))

      markersRef.current.set(plan.id, marker)
    }

    visibleRef.current = visible
    tripsRef.current = trips
    selectedRef.current = selectedId

    // After the browser has laid the new icons out — measuring before that
    // reads stale widths and collapses pins that would have fit.
    const frame = requestAnimationFrame(declutter)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, trips, selectedId])

  // Open on everything that's near you, once — afterwards the map is yours
  useEffect(() => {
    const map = mapRef.current
    if (!map || fittedRef.current || visible.length === 0) return

    fittedRef.current = true
    const bounds = L.latLngBounds([
      [me.point.lat, me.point.lng],
      ...visible.map((plan) => [plan.lat, plan.lng] as [number, number]),
    ])
    // Room for the header chips on top and the card rail along the bottom
    map.fitBounds(bounds, { padding: [50, 50], paddingBottomRight: [50, 190], maxZoom: 15 })
  }, [visible, me.point])


  // ── Keeping the labels readable ────────────────────────────────────────────

  /*
   * Pins carry a photo and a name, which is what makes the map useful and
   * also what makes it illegible the moment two places sit on the same
   * block — and they often do, because a geocoded address lands on the
   * street centroid rather than the door.
   *
   * So on every zoom, the closest and most relevant pins claim their space
   * first and anything that would land on top of one already placed
   * collapses to just its photo. Straight DOM class toggling, no React: this
   * runs on map events, and re-rendering a dozen markers per zoom step would
   * stutter on a phone.
   */
  const declutter = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    const candidates = visibleRef.current
      .map((plan) => {
        const element = markersRef.current.get(plan.id)?.getElement()
          ?.firstElementChild as HTMLElement | undefined
        return element ? { plan, element } : null
      })
      .filter((entry): entry is { plan: LocatedPlan; element: HTMLElement } => entry !== null)

    // Measure at full width first — a pin already collapsed would otherwise
    // report the collapsed size and never expand again.
    for (const { element } of candidates) element.classList.remove('pin--mini')
    const measured = candidates.map((entry) => ({ ...entry, width: entry.element.offsetWidth }))

    // What you'd look at first gets to keep its label: whatever is selected,
    // then whatever is closest.
    const byPriority = [...measured].sort((a, b) => {
      if (a.plan.id === selectedRef.current) return -1
      if (b.plan.id === selectedRef.current) return 1
      const ta = tripsRef.current[a.plan.id]
      const tb = tripsRef.current[b.plan.id]
      return (ta?.seconds ?? ta?.km ?? Infinity) - (tb?.seconds ?? tb?.km ?? Infinity)
    })

    const placed: Array<[number, number, number, number]> = []

    for (const { plan, element, width } of byPriority) {
      const point = map.latLngToContainerPoint([plan.lat, plan.lng])
      const full = boxAt(point.x, point.y, width)

      if (!overlapsAny(full, placed)) {
        placed.push(full)
        continue
      }

      element.classList.add('pin--mini')
      // Collapsed pins may still touch each other. That's deliberate: two
      // overlapping photos are readable, and hiding pins outright would lose
      // places from the map entirely.
      placed.push(boxAt(point.x, point.y, MINI_WIDTH))
    }
  }, [])

  // Re-run whenever the map moves under the pins, or the pins change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.on('zoomend', declutter)
    map.on('moveend', declutter)
    return () => {
      map.off('zoomend', declutter)
      map.off('moveend', declutter)
    }
  }, [declutter, visible])

  // ── Selection ──────────────────────────────────────────────────────────────

  const selectPlan = useCallback(
    (id: string, options: { pan?: boolean } = {}) => {
      setSelectedId(id)

      const card = railRef.current?.querySelector<HTMLElement>(`[data-plan="${id}"]`)
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })

      if (options.pan === false) return

      const plan = visible.find((p) => p.id === id)
      const map = mapRef.current
      if (!plan || !map) return

      programmaticPan.current = true
      map.panTo([plan.lat, plan.lng], { animate: true })
    },
    [visible]
  )

  // Tapping a marker scrolls the rail; the rail scrolling back would fight it
  const handleRailScroll = useCallback(() => {
    if (programmaticPan.current) {
      programmaticPan.current = false
    }
  }, [])

  const recenter = () => {
    if (me.status === 'denied' || me.status === 'unavailable') {
      me.refresh()
      return
    }
    mapRef.current?.setView([me.point.lat, me.point.lng], 14, { animate: true })
  }

  const openPlan = (plan: LocatedPlan) => navigate(`/?plan=${plan.id}`)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative h-full overflow-hidden">
      <MapCanvas
        className="absolute inset-0"
        center={me.point}
        zoom={13}
        onReady={handleReady}
      />

      {/* ── Filters ── floating over the map rather than pushing it down:
          screen height is the scarcest thing on a phone, and the map is the
          content here. */}
      <div className="absolute inset-x-0 top-0 z-[500] pt-safe-top pointer-events-none">
        <div className="px-3 pt-2 pb-1 flex gap-1.5 pointer-events-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium shadow-soft transition-colors',
                status === tab.key
                  ? 'bg-sand-500 text-pure-white'
                  : 'bg-white/90 backdrop-blur-sm text-warm-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-3 py-1.5 pointer-events-auto">
            <CategoryChip
              active={categoryId === 'all'}
              onClick={() => setCategoryId('all')}
              label="All"
            />
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                active={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
                label={`${category.emoji} ${category.name}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Locate ── */}
      <button
        onClick={recenter}
        aria-label="Centre on my location"
        className="absolute right-3 z-[500] h-11 w-11 rounded-full bg-white/95 backdrop-blur-sm shadow-card grid place-items-center text-warm-600 active:bg-cream-100"
        style={{ bottom: visible.length > 0 ? '11.5rem' : '5.5rem' }}
      >
        {me.status === 'ready' ? <LocateFixed size={19} /> : <Crosshair size={19} />}
      </button>

      {/* ── Places without a pin ── */}
      {missing.length > 0 && (
        <button
          onClick={() => setMissingOpen(true)}
          className="absolute left-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-2 text-xs font-medium text-warm-600 shadow-card"
          style={{ bottom: visible.length > 0 ? '11.5rem' : '5.5rem' }}
        >
          <MapPin size={14} className="text-blush-400" />
          {resolving.running
            ? `Locating ${missing.length}…`
            : `${missing.length} without a pin`}
        </button>
      )}

      {/* ── Card rail ── */}
      {ordered.length > 0 && (
        <div
          ref={railRef}
          onScroll={handleRailScroll}
          className="absolute inset-x-0 bottom-0 z-[500] flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory px-4 pb-3"
        >
          {ordered.map((plan) => (
            <div key={plan.id} data-plan={plan.id} className="snap-center shrink-0">
              <PlaceCard
                plan={plan}
                trip={trips[plan.id]}
                selected={plan.id === selectedId}
                onSelect={() => selectPlan(plan.id)}
                onOpenDetail={() => openPlan(plan)}
                onFixPin={() => setPinningPlan(plan)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Nothing to show is a normal state early on, and the empty map behind
          it would otherwise read as a failure to load. */}
      {ordered.length === 0 && (
        <div className="absolute inset-x-6 bottom-24 z-[500] rounded-3xl bg-white/95 backdrop-blur-sm p-4 text-center shadow-card">
          <p className="text-sm text-warm-600">
            {plans.length === 0
              ? 'Add a plan with a Maps link and it shows up here.'
              : missing.length > 0
                ? 'Still working out where these places are.'
                : 'No places match these filters.'}
          </p>
        </div>
      )}

      {/* ── Sheets ── */}
      <Sheet open={missingOpen} onClose={() => setMissingOpen(false)} title="Places without a pin">
        <p className="px-1 pb-2 text-sm text-warm-500">
          These couldn't be found automatically — most small places aren't in the
          open map data. Tap one to put it where it belongs.
        </p>
        <div className="pb-2">
          {missing.map((plan) => (
            <UnlocatedRow
              key={plan.id}
              name={plan.name}
              emoji={plan.category?.emoji ?? '📍'}
              onPlace={() => {
                setMissingOpen(false)
                setPinningPlan(plan)
              }}
            />
          ))}
        </div>
      </Sheet>

      <LocationPicker
        plan={pinningPlan}
        coupleId={session.coupleId}
        fallbackCenter={me.point}
        onClose={() => setPinningPlan(null)}
      />
    </div>
  )
}

/**
 * A pin's screen box. The tail sits on the coordinate and the pill is centred
 * above it, so the box hangs up and to both sides of the point. The extra
 * couple of pixels keep neighbours from touching.
 */
function boxAt(x: number, y: number, width: number): [number, number, number, number] {
  const gap = 3
  return [x - width / 2 - gap, y - PIN_HEIGHT - gap, x + width / 2 + gap, y + gap]
}

function overlapsAny(
  box: [number, number, number, number],
  placed: Array<[number, number, number, number]>
): boolean {
  return placed.some(
    ([left, top, right, bottom]) =>
      box[0] < right && box[2] > left && box[1] < bottom && box[3] > top
  )
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1 text-xs font-medium shadow-soft transition-colors',
        active ? 'bg-warm-700 text-pure-white' : 'bg-white/90 backdrop-blur-sm text-warm-500'
      )}
    >
      {label}
    </button>
  )
}
