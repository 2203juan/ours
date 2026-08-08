export type LinkKind = 'maps' | 'instagram' | 'tiktok' | 'other'

export interface DetectedLink {
  kind: LinkKind
  url: string
  /** Name derived from the URL when it carries one, e.g. a Maps place. */
  suggestedName: string | null
}

/**
 * Parse loosely-typed text into a URL. Accepts input without a protocol
 * ("maps.app.goo.gl/xyz"), but the hostname has to end in something that
 * looks like a TLD. `new URL()` is far too permissive on its own: it happily
 * accepts "hola" as a hostname, and "4.5" — a rating someone just copied — as
 * a dotted one.
 */
function toUrl(raw: string): URL | null {
  const s = raw.trim()
  if (!s || /\s/.test(s)) return null
  try {
    const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`)
    const labels = url.hostname.split('.')
    // Needs a dot ("hola" isn't a link) and a TLD-shaped last label ("4.5" isn't either)
    if (labels.length < 2) return null
    return /^[a-z]{2,}$/i.test(labels[labels.length - 1]) ? url : null
  } catch {
    return null
  }
}

/**
 * Google Maps place URLs carry the place name in the path:
 * `/maps/place/Andr%C3%A9s+Carne+de+Res/@4.86,-74.03,17z` → "Andrés Carne de Res".
 * Shortened `maps.app.goo.gl` links don't, and resolving them would need a
 * request the browser blocks with CORS, so those come back nameless.
 */
function mapsPlaceName(url: URL): string | null {
  const match = url.pathname.match(/\/place\/([^/@]+)/)
  if (!match) return null
  try {
    const name = decodeURIComponent(match[1]).replace(/\+/g, ' ').trim()
    // Coordinate-only URLs put a `data=` or `@lat,lng` blob here instead
    if (!name || /^(data=|@|[\d.,\s-]+$)/.test(name)) return null
    return name
  } catch {
    return null
  }
}

export function detectLink(raw: string): DetectedLink | null {
  const url = toUrl(raw)
  if (!url) return null

  const host = url.hostname.toLowerCase()
  const href = url.toString()

  if (
    host === 'maps.app.goo.gl' ||
    (host.endsWith('goo.gl') && url.pathname.startsWith('/maps')) ||
    (host.includes('google.') && url.pathname.includes('/maps'))
  ) {
    return { kind: 'maps', url: href, suggestedName: mapsPlaceName(url) }
  }

  if (host.endsWith('instagram.com')) {
    return { kind: 'instagram', url: href, suggestedName: null }
  }

  if (host.endsWith('tiktok.com')) {
    return { kind: 'tiktok', url: href, suggestedName: null }
  }

  return { kind: 'other', url: href, suggestedName: null }
}

export type LinkField = 'maps_url' | 'instagram_ref' | 'tiktok_url' | 'description'

/**
 * Which PlanForm field a detected link should prefill. Anything unrecognised
 * goes to the description: it's the only free-text field that always renders,
 * whereas `menu_url` is hidden unless a food category is picked.
 */
export function linkFieldFor(kind: LinkKind): LinkField {
  switch (kind) {
    case 'maps': return 'maps_url'
    case 'instagram': return 'instagram_ref'
    case 'tiktok': return 'tiktok_url'
    default: return 'description'
  }
}

export const LINK_LABEL: Record<LinkKind, string> = {
  maps: 'Google Maps link',
  instagram: 'Instagram link',
  tiktok: 'TikTok link',
  other: 'link',
}

/**
 * Read a link from the clipboard.
 *
 * MUST be called synchronously from a user gesture: Safari only allows
 * `readText()` in response to a tap, and shows its own "Paste" confirmation
 * before handing the text over. Returns null when the clipboard holds no
 * link, or when the read is denied or unsupported.
 */
export async function readClipboardLink(): Promise<DetectedLink | null> {
  if (!navigator.clipboard?.readText) return null
  try {
    return detectLink(await navigator.clipboard.readText())
  } catch {
    return null
  }
}
