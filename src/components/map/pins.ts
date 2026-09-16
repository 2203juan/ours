import L from 'leaflet'

/**
 * The markers, built as HTML rather than images.
 *
 * Each pin is a preview in itself: the place's own photo, its name, its
 * rating and how long the drive is. That's the whole point of the tab — you
 * should be able to look at the map and know what's around you without
 * tapping anything. Tapping is for the detail, not for the basics.
 *
 * A PNG pin can't carry any of that, so these are `divIcon`s: plain DOM,
 * styled by the classes in index.css, sized by their own content.
 */

/**
 * Every pin is this tall, full or collapsed, so `iconAnchor` keeps the tail
 * on the coordinate either way — a shorter icon with the same anchor would
 * float above the place it points at.
 */
export const PIN_HEIGHT = 36

/** The collapsed pin's width, needed by the declutter pass in MapPage. */
export const MINI_WIDTH = 30

interface PinOptions {
  emoji: string
  name: string
  /** The plan's first photo, if it has one. */
  photo: string | null
  /** Google Maps rating, 0–5. */
  rating: number | null
  /** "12 min" — absent while the routing request is still out. */
  label: string | null
  selected: boolean
  done: boolean
}

export function planPin(options: PinOptions): L.DivIcon {
  const { emoji, name, photo, rating, label, selected, done } = options

  const classes = ['pin', selected && 'pin--selected', done && 'pin--done']
    .filter(Boolean)
    .join(' ')

  // Rating and driving time share the second line: two short facts that are
  // read together ("4.5 stars, six minutes away") and would waste a whole
  // row each.
  const facts = [
    rating != null ? `<span class="pin__rating">★ ${rating.toFixed(1)}</span>` : '',
    label ? `<span class="pin__time">${escapeHtml(label)}</span>` : '',
  ].filter(Boolean)

  return L.divIcon({
    className: 'pin-wrap',
    html: `
      <div class="${classes}">
        ${thumb(photo, emoji, name)}
        <span class="pin__text">
          <span class="pin__name">${escapeHtml(name)}</span>
          ${facts.length ? `<span class="pin__facts">${facts.join('<span class="pin__sep">·</span>')}</span>` : ''}
        </span>
        <span class="pin__tail"></span>
      </div>
    `,
    // The width is whatever the name makes it, so only the height and the
    // horizontal centre matter here; the pill centres itself in CSS.
    iconSize: [0, PIN_HEIGHT],
    iconAnchor: [0, PIN_HEIGHT],
  })
}

/**
 * The photo when there is one, the category emoji when there isn't. Lazy and
 * async: plan photos are full-size uploads, and a screen full of pins should
 * not block the map while they arrive.
 */
function thumb(photo: string | null, emoji: string, name: string): string {
  if (photo) {
    return `<span class="pin__thumb"><img src="${escapeHtml(photo)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async"></span>`
  }
  return `<span class="pin__thumb pin__thumb--emoji">${escapeHtml(emoji)}</span>`
}

/** The blue dot for "you are here", pulsing while the fix is still coarse. */
export function myLocationPin(approximate: boolean): L.DivIcon {
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="me${approximate ? ' me--approx' : ''}"><span class="me__dot"></span></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

/** The single draggable pin in the "place it yourself" sheet. */
export function pickerPin(): L.DivIcon {
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="picker-pin"></div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
  })
}

/**
 * Marker HTML is a string, and plan names and photo URLs come from whatever
 * someone typed or uploaded. An apostrophe shouldn't be able to break the
 * map, let alone a `<script>`.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
