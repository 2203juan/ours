import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { MapPin, Trash2 } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { MapCanvas } from './MapCanvas'
import { pickerPin } from './pins'
import { useSetPlanLocation } from '../../hooks/usePlanGeo'
import { notify } from '../../lib/toast'
import type { LatLng } from '../../lib/geo'
import type { Plan } from '../../types'

/**
 * Drop a pin by hand.
 *
 * Automatic lookup finds the well-known places and misses the rest: a lot of
 * the best spots in Cali aren't in OpenStreetMap under the name anyone calls
 * them. Rather than leaving those off the map, this lets you put the pin
 * where the place actually is — once, for good, and it outranks any later
 * automatic guess.
 */

interface LocationPickerProps {
  plan: Plan | null
  coupleId: string
  /** Where the map opens when the plan has no pin yet — normally your position. */
  fallbackCenter: LatLng
  onClose: () => void
}

export function LocationPicker({ plan, coupleId, fallbackCenter, onClose }: LocationPickerProps) {
  const setLocation = useSetPlanLocation()
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const existing = plan?.lat != null && plan.lng != null ? { lat: plan.lat, lng: plan.lng } : null
  const [point, setPoint] = useState<LatLng | null>(existing)

  // Re-seed when the sheet is opened for a different plan
  useEffect(() => {
    setPoint(existing)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id])

  const handleReady = useCallback((map: L.Map | null) => {
    mapRef.current = map
    if (!map) markerRef.current = null
  }, [])

  // Keep the marker in step with the point, creating it on first placement
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!point) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([point.lat, point.lng])
      return
    }

    markerRef.current = L.marker([point.lat, point.lng], {
      icon: pickerPin(),
      draggable: true,
      autoPan: true,
    })
      .addTo(map)
      .on('dragend', (event) => {
        const { lat, lng } = (event.target as L.Marker).getLatLng()
        setPoint({ lat, lng })
      })
  }, [point])

  const save = async () => {
    if (!plan || !point) return
    try {
      await setLocation.mutateAsync({ planId: plan.id, coupleId, point, source: 'manual' })
      notify.success(`${plan.name} is on the map`)
      onClose()
    } catch {
      notify.error("Couldn't save the location")
    }
  }

  const clear = async () => {
    if (!plan) return
    try {
      await setLocation.mutateAsync({ planId: plan.id, coupleId, point: null, source: 'manual' })
      onClose()
    } catch {
      notify.error("Couldn't remove the pin")
    }
  }

  return (
    <Sheet open={!!plan} onClose={onClose} title={plan ? `Where is ${plan.name}?` : ''} height="full">
      <div className="flex flex-col h-full">
        <p className="px-1 pb-3 text-sm text-warm-500">
          Tap the map where the place is — drag the pin to fine-tune it.
        </p>

        <div className="relative flex-1 min-h-[320px] rounded-3xl overflow-hidden border border-cream-200">
          <MapCanvas
            className="absolute inset-0"
            center={existing ?? fallbackCenter}
            zoom={existing ? 16 : 13}
            onReady={handleReady}
            onTap={setPoint}
          />

          {!point && (
            <div className="absolute inset-x-0 bottom-0 p-3 pointer-events-none">
              <div className="flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur-sm px-3 py-2 shadow-soft">
                <MapPin size={15} className="text-sand-500 shrink-0" />
                <span className="text-xs text-warm-500">Tap to place the pin</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-4">
          {existing && (
            <Button variant="ghost" size="md" onClick={clear} aria-label="Remove pin">
              <Trash2 size={16} />
            </Button>
          )}
          <Button
            fullWidth
            onClick={save}
            disabled={!point}
            loading={setLocation.isPending}
          >
            Save location
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
