import L from 'leaflet'

/**
 * The markers, built as HTML rather than images.
 *
 * Each place wears its driving time on the map itself, which is the whole
 * point of the tab: you should be able to see "12 min" and "40 min" without
 * tapping anything. A PNG pin can't carry text that changes, so these are
 * `divIcon`s — plain DOM, styled by the classes in index.css, sized by their
 * own content.
 */

/** Keeps the tip of the pin on the coordinate, whatever the label's width. */
const PIN_HEIGHT = 34

interface PinOptions {
  emoji: string
  /** "12 min" — omitted while the routing request is still out. */
  label: string | null
  selected: boolean
  done: boolean
}

export function planPin({ emoji, label, selected, done }: PinOptions): L.DivIcon {
  const classes = ['pin', selected && 'pin--selected', done && 'pin--done']
    .filter(Boolean)
    .join(' ')

  return L.divIcon({
    className: 'pin-wrap',
    html: `
      <div class="${classes}">
        <span class="pin__emoji">${escapeHtml(emoji)}</span>
        ${label ? `<span class="pin__time">${escapeHtml(label)}</span>` : ''}
        <span class="pin__tail"></span>
      </div>
    `,
    // Leaflet needs a size to place the anchor; the width is whatever the
    // label makes it, so only the height and the horizontal centre matter.
    iconSize: [0, PIN_HEIGHT],
    iconAnchor: [0, PIN_HEIGHT],
  })
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
 * Marker HTML is a string, and plan names come from whatever someone typed.
 * An apostrophe shouldn't be able to break the map, let alone a `<script>`.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
