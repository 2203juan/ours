import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { coordsFromMapsUrl, type LatLng } from '../lib/geo'
import { isLocatable, type GeoSource, type Plan } from '../types'

/**
 * Turning a saved place into a pin.
 *
 * Most plans were saved as a `maps.app.goo.gl` link, which says nothing about
 * where the place is until you follow the redirect — and the browser can't,
 * because Google sends no CORS headers. The `resolve-place` edge function
 * follows it server-side and comes back with coordinates, or with the full
 * business name and address it found, geocoded against OpenStreetMap.
 *
 * It doesn't always work: plenty of small restaurants simply aren't in OSM.
 * That's why every attempt is stamped on the row — a place that can't be
 * found is asked about once, not on every visit to the map — and why the map
 * offers to drop the pin by hand.
 */

const RESOLVE_FUNCTION = 'resolve-place'

/** Nominatim's fair-use policy is one query a second; the gap keeps us under it. */
const GAP_MS = 1400

interface ResolveResponse {
  lat: number | null
  lng: number | null
  source?: GeoSource
  label?: string | null
}

// ── Writing a location back ──────────────────────────────────────────────────

export interface SetLocationVars {
  planId: string
  coupleId: string
  point: LatLng | null
  source: GeoSource
}

/**
 * Save a pin. Used by the automatic resolver and by the drag-a-pin sheet, so
 * both paths stamp `geo_resolved_at` the same way and neither gets retried.
 */
export function useSetPlanLocation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ planId, point, source }: SetLocationVars) => {
      const { error } = await supabase
        .from('plans')
        .update({
          lat: point?.lat ?? null,
          lng: point?.lng ?? null,
          geo_source: point ? source : null,
          geo_resolved_at: new Date().toISOString(),
        })
        .eq('id', planId)
      if (error) throw error
    },
    onMutate: async ({ planId, coupleId, point, source }) => {
      const key = ['plans', coupleId]
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<Plan[]>(key)

      if (previous) {
        qc.setQueryData<Plan[]>(
          key,
          previous.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  lat: point?.lat ?? null,
                  lng: point?.lng ?? null,
                  geo_source: point ? source : null,
                  geo_resolved_at: new Date().toISOString(),
                }
              : plan
          )
        )
      }

      return { previous, coupleId }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['plans', ctx.coupleId], ctx.previous)
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['plans', vars.coupleId] })
    },
  })
}

// ── Automatic resolution ─────────────────────────────────────────────────────

export interface ResolveProgress {
  /** How many plans are still waiting for a first attempt. */
  pending: number
  /** True while a lookup is in flight. */
  running: boolean
}

/**
 * Resolve, one at a time, the plans that have a place but no pin yet.
 *
 * Sequential on purpose. Firing twenty lookups at once gets the shared
 * geocoder to rate-limit us, and every one of those comes back empty and
 * gets stamped as "tried" — poisoning the results for places that would
 * have resolved fine a second later.
 */
export function useResolveMissingCoords(plans: Plan[], coupleId: string): ResolveProgress {
  const setLocation = useSetPlanLocation()
  const [running, setRunning] = useState(false)

  // Plans attempted in this session. The DB stamp covers future visits; this
  // covers the re-renders between the request and the cache updating.
  const attempted = useRef(new Set<string>())

  const queue = plans.filter(
    (plan) =>
      plan.lat == null &&
      plan.geo_resolved_at == null &&
      isLocatable(plan) &&
      !attempted.current.has(plan.id)
  )

  const next = queue[0]

  useEffect(() => {
    if (!next || running) return

    let cancelled = false
    attempted.current.add(next.id)
    setRunning(true)

    const run = async () => {
      // A link that already carries its coordinates needs no lookup at all
      const direct = coordsFromMapsUrl(next.maps_url)
      if (direct) {
        await setLocation.mutateAsync({
          planId: next.id,
          coupleId,
          point: direct,
          source: 'maps_url',
        })
        return
      }

      const { data, error } = await supabase.functions.invoke<ResolveResponse>(RESOLVE_FUNCTION, {
        body: {
          maps_url: next.maps_url,
          name: next.name,
          location_text: next.location_text,
        },
      })

      // A network failure is not an answer: leave the stamp off so it gets
      // another chance next time the map opens.
      if (error) return

      const point =
        data?.lat != null && data?.lng != null ? { lat: data.lat, lng: data.lng } : null

      await setLocation.mutateAsync({
        planId: next.id,
        coupleId,
        point,
        source: data?.source ?? 'geocode',
      })
    }

    run()
      .catch(() => {
        // Already stamped or already rolled back; the next open retries
      })
      .finally(() => {
        if (cancelled) return
        // Breathe before the next one so the geocoder keeps answering
        setTimeout(() => !cancelled && setRunning(false), GAP_MS)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next?.id, running, coupleId])

  return { pending: queue.length, running }
}
