import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useThemeStore } from '../../stores/themeStore'
import { CALI_CENTER, type LatLng } from '../../lib/geo'

/**
 * The Leaflet instance, wrapped just enough to be a React component.
 *
 * Deliberately not react-leaflet: the map here is mostly custom HTML markers
 * whose labels change as driving times arrive, and re-mounting components to
 * move a pin is a lot of machinery for something Leaflet already does in one
 * imperative call.
 */

/**
 * OpenStreetMap's own raster tiles: no key, no billing, no sign-up, and they
 * go to street level (zoom 19) — which matters when the pin is a restaurant
 * and you want to see which side of the block it's on.
 *
 * The prettier alternatives all turned out to be gated: CARTO now stamps
 * "API KEY REQUIRED" across the tile and Stadia answers 401. Esri's grey
 * canvas is free but stops at zoom 16 and needs a second request per tile
 * for the street names.
 *
 * So the palette is fixed here instead, with a CSS filter over the tile
 * layer (see `.leaflet-tile-pane` in index.css): muted in light mode so OSM's
 * bright greens and yellows sit next to the app's cream, inverted in dark.
 * The filter is on the tiles alone — the pins keep their real colours.
 */
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

interface MapCanvasProps {
  className?: string
  center?: LatLng
  zoom?: number
  /** Called once the map exists, and again with null when it goes away. */
  onReady: (map: L.Map | null) => void
  /** Tapping the map itself — how the pin-placing sheet gets its point. */
  onTap?: (point: LatLng) => void
}

export function MapCanvas({
  className,
  center = CALI_CENTER,
  zoom = 13,
  onReady,
  onTap,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)

  const preference = useThemeStore((s) => s.preference)
  const dark =
    preference === 'dark' ||
    (preference === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  // Kept in a ref so changing the handler doesn't tear the map down
  const tapRef = useRef(onTap)
  tapRef.current = onTap

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      // The app already owns the bottom-right corner with its nav
      zoomControl: false,
      attributionControl: true,
      // Pinch to zoom, drag to pan — what a phone expects from a map
      touchZoom: true,
      scrollWheelZoom: true,
    })

    map.attributionControl.setPrefix('')
    map.on('click', (event: L.LeafletMouseEvent) => {
      tapRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng })
    })

    mapRef.current = map
    onReady(map)

    // Leaflet measures the container on creation; inside a sheet or a tab
    // that hasn't finished laying out, that measurement is wrong and the
    // tiles come in shifted. One recalculation after paint fixes it.
    const settle = setTimeout(() => map.invalidateSize(), 120)

    return () => {
      clearTimeout(settle)
      onReady(null)
      mapRef.current = null
      tileRef.current = null
      map.remove()
    }
    // Centre and zoom are the starting view only; moving the map afterwards
    // is the caller's job, and re-running this would throw the map away.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap the basemap when the app's theme flips, without rebuilding the map
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // The theme lives on a class, so switching it is a class toggle rather
    // than a new tile layer — no refetch, no flash of empty map.
    map.getContainer().classList.toggle('map--dark', dark)

    if (tileRef.current) return

    tileRef.current = L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: ATTRIBUTION,
      // OSM serves no @2x tiles; asking for them 404s, and letting Leaflet
      // fake retina by loading a zoom deeper doubles every request for
      // detail nobody reads on a map this size.
      detectRetina: false,
    }).addTo(map)

    // Tiles belong under every marker, whatever order things were added in
    tileRef.current.bringToBack()
  }, [dark])

  return <div ref={containerRef} className={className} />
}
