import { Car, ExternalLink, MapPin } from 'lucide-react'
import { cn } from '../../lib/utils'
import { StarRatingDisplay } from '../ui/StarRating'
import { tripLabel, type Trip } from '../../lib/routing'
import { formatDistance } from '../../lib/geo'
import type { LocatedPlan } from '../../types'

/**
 * One place in the rail under the map.
 *
 * Carries what you'd want before deciding where to go: how long the drive
 * is, what kind of plan it is, what it's rated, and one tap through to
 * turn-by-turn directions in the phone's own maps app — which is where you'd
 * end up anyway, so the card doesn't pretend to replace it.
 */

interface PlaceCardProps {
  plan: LocatedPlan
  trip: Trip | undefined
  selected: boolean
  onSelect: () => void
  onOpenDetail: () => void
  onFixPin: () => void
}

export function PlaceCard({
  plan, trip, selected, onSelect, onOpenDetail, onFixPin,
}: PlaceCardProps) {
  const time = tripLabel(trip)
  const approximate = plan.geo_source === 'geocode'

  return (
    <div
      onClick={onSelect}
      className={cn(
        'snap-center shrink-0 w-[78vw] max-w-[320px] rounded-3xl bg-white p-3.5 shadow-card',
        'border transition-colors',
        selected ? 'border-sand-400' : 'border-cream-200'
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none mt-0.5">{plan.category?.emoji ?? '📍'}</span>

        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg leading-tight text-warm-800 truncate">{plan.name}</h3>

          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {time && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-warm-700">
                <Car size={12} strokeWidth={2} />
                {time}
              </span>
            )}
            {trip && (
              <span className="text-xs text-warm-400">{formatDistance(trip.km)}</span>
            )}
            {plan.maps_rating != null && <StarRatingDisplay rating={plan.maps_rating} />}
          </div>

          {/* Only flagged where it matters: a guessed pin can land a block
              off — or on the right street but the wrong door — and you'd
              rather know that before driving there. */}
          {approximate && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFixPin()
              }}
              className="mt-1.5 text-[11px] text-warm-400 underline underline-offset-2 active:text-warm-600"
            >
              Approximate spot — fix it
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenDetail()
          }}
          className="flex-1 rounded-2xl bg-cream-100 py-2 text-sm font-medium text-warm-700 active:bg-cream-200"
        >
          View plan
        </button>

        <a
          href={directionsUrl(plan)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-sand-500 px-3.5 py-2 text-sm font-medium text-pure-white active:bg-sand-600"
        >
          <ExternalLink size={14} />
          Directions
        </a>
      </div>
    </div>
  )
}

/**
 * Directions rather than the saved link: the saved one opens the place's
 * page, and what you want from a map at 7pm is the route. Coordinates go in
 * the query so it works whether or not the place is searchable by name, and
 * `maps.google.com` is what iOS hands to Apple Maps or Google Maps depending
 * on what's installed.
 */
function directionsUrl(plan: LocatedPlan): string {
  const destination = `${plan.lat},${plan.lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
}

/** The row shown for a place that has no pin yet. */
export function UnlocatedRow({
  name,
  emoji,
  onPlace,
}: {
  name: string
  emoji: string
  onPlace: () => void
}) {
  return (
    <button
      onClick={onPlace}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left active:bg-cream-100"
    >
      <span className="text-lg">{emoji}</span>
      <span className="flex-1 truncate text-sm text-warm-700">{name}</span>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-sand-600">
        <MapPin size={13} />
        Place it
      </span>
    </button>
  )
}
