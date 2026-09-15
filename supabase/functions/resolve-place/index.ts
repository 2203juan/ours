/**
 * resolve-place — convierte un plan guardado en coordenadas.
 *
 * Existe porque los links que uno comparte desde la app de Google Maps son
 * `maps.app.goo.gl/xxxx`, y el lugar sólo aparece al seguir la redirección:
 * algo que el navegador no puede hacer (CORS) y el servidor sí.
 *
 * Qué se saca de cada link, en orden de preferencia:
 *
 *   1. Coordenadas literales (`!3d…!4d…`, `/@lat,lng`, `?q=lat,lng`). Es el
 *      pin exacto. Sólo algunos links las traen.
 *   2. El texto del parámetro `q=` de la URL expandida. Los enlaces cortos
 *      siempre terminan en algo como
 *        ?q=Llámame Lupe - Barbacoa Mexicana, Via A Dapa, Yumbo, Valle del Cauca
 *      — nombre comercial completo y dirección, muchísimo mejor que el
 *      apodo con el que uno guarda el plan ("Lupe"). Ese texto se
 *      geocodifica contra Nominatim (OpenStreetMap).
 *
 * El HTML de Google no sirve como tercera opción: las coordenadas del lugar
 * las carga por XHR después, así que la página que llega al servidor sólo
 * tiene la ubicación del datacenter. Por eso, cuando nada de lo anterior da,
 * se responde `not_found` y la app ofrece poner el pin a mano.
 *
 * Siempre responde 200: "no se pudo ubicar" es un resultado normal, no un
 * error. La app lo guarda como intento hecho y deja de reintentar.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Caja del área metropolitana, no sólo del casco urbano: izq, arriba, der,
 * abajo (lng/lat). Incluye Yumbo, Dapa, Jamundí, Palmira y La Buitrera —
 * media lista de planes de fin de semana queda fuera de Cali estricta.
 */
const VIEWBOX = '-76.80,3.85,-76.15,3.10'
const CALI = { lat: 3.4516, lng: -76.532 }

/** Más lejos que esto no es el lugar que buscábamos, es un homónimo. */
const MAX_KM = 80

interface Coords {
  lat: number
  lng: number
}

interface Resolved extends Coords {
  source: 'maps_url' | 'geocode'
  label?: string | null
}

// ── Coordenadas dentro de una URL ────────────────────────────────────────────

function check(latText: string, lngText: string): Coords | null {
  const lat = Number(latText)
  const lng = Number(lngText)
  if (!isFinite(lat) || !isFinite(lng)) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  // 0,0 cae en el Atlántico: siempre es un parseo fallido, nunca un lugar
  if (lat === 0 && lng === 0) return null
  return { lat, lng }
}

/**
 * De más a menos confiable:
 *   !3d4.65!4d-74.05  → el pin real del lugar
 *   /@4.65,-74.05,17z → el centro del mapa, que casi siempre es el lugar
 *   ?q= / ?ll= / …    → coordenadas explícitas en el query
 */
function coordsFromUrl(raw: string): Coords | null {
  const pin = raw.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (pin) return check(pin[1], pin[2])

  const at = raw.match(/[/@](-?\d+\.\d+),(-?\d+\.\d+)/)
  if (at) return check(at[1], at[2])

  for (const value of queryValues(raw)) {
    const pair = value.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/)
    if (pair) return check(pair[1], pair[2])
  }

  return null
}

const TEXT_PARAMS = ['q', 'query', 'destination', 'daddr', 'll', 'center']

function queryValues(raw: string): string[] {
  try {
    const params = new URL(raw).searchParams
    return TEXT_PARAMS.map((key) => params.get(key)).filter((v): v is string => !!v)
  } catch {
    return []
  }
}

/** El texto de lugar que trae la URL, si no son coordenadas. */
function placeTextFromUrl(raw: string): string | null {
  for (const value of queryValues(raw)) {
    if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(value)) continue
    const text = value.replace(/\+/g, ' ').trim()
    if (text.length > 2) return text
  }
  return null
}

/**
 * Sigue la cadena de redirecciones a mano en vez de `redirect: 'follow'`,
 * porque hace falta mirar cada URL intermedia: unos saltos traen las
 * coordenadas y los siguientes ya no.
 */
async function expand(url: string): Promise<string[]> {
  const seen = [url]
  let current = url

  for (let hop = 0; hop < 6; hop++) {
    let response: Response
    try {
      response = await fetch(current, {
        redirect: 'manual',
        headers: {
          // Sin un User-Agent de navegador, Google responde otra cosa.
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept-Language': 'es-CO,es;q=0.9',
        },
      })
    } catch {
      break
    }

    const next = response.headers.get('location')
    if (!next) break

    try {
      current = new URL(next, current).toString()
    } catch {
      break
    }
    seen.push(current)
  }

  return seen
}

// ── Geocodificación por texto ────────────────────────────────────────────────

/** Nominatim pide máximo una consulta por segundo. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function geocode(query: string): Promise<Resolved | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'co')
  url.searchParams.set('viewbox', VIEWBOX)
  // Acotado a la caja: sin esto "El Rincón" cae en Bogotá y el mapa se va
  // para otra ciudad.
  url.searchParams.set('bounded', '1')

  let response: Response
  try {
    response = await fetch(url, {
      // Nominatim exige identificarse; sin esto bloquea por abuso.
      headers: { 'User-Agent': 'ours-bucket-list/1.0 (personal couple app)' },
    })
  } catch {
    return null
  }

  if (!response.ok) return null

  const results = await response.json().catch(() => null)
  if (!Array.isArray(results) || results.length === 0) return null

  const hit = check(String(results[0].lat), String(results[0].lon))
  if (!hit) return null
  if (kmFromCali(hit.lat, hit.lng) > MAX_KM) return null

  return { ...hit, source: 'geocode', label: results[0].display_name ?? null }
}

function kmFromCali(lat: number, lng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat - CALI.lat)
  const dLng = toRad(lng - CALI.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(CALI.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  let body: {
    maps_url?: string | null
    name?: string | null
    location_text?: string | null
    city?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Body inválido' }, 400)
  }

  const city = body.city?.trim() || 'Cali, Valle del Cauca, Colombia'
  const queries: string[] = []

  if (body.maps_url) {
    const chain = await expand(body.maps_url)

    // 1. Coordenadas literales, si el link las trae
    for (const candidate of chain) {
      const hit = coordsFromUrl(candidate)
      if (hit) return json({ ...hit, source: 'maps_url' } satisfies Resolved)
    }

    // 2. El nombre completo y la dirección que Google puso en la URL final
    for (const candidate of [...chain].reverse()) {
      const text = placeTextFromUrl(candidate)
      if (!text) continue
      queries.push(text)
      // Sin el nombre comercial queda la dirección sola. Nominatim conoce
      // muchas más calles que restaurantes, así que este intento salva los
      // casos en que el local no está en OpenStreetMap.
      const withoutName = text.split(',').slice(1).join(',').trim()
      if (withoutName.length > 5) queries.push(withoutName)
      break
    }
  }

  // 3. Lo que el plan guarda: su nombre y la nota de ubicación
  queries.push(
    [body.name, body.location_text, city].filter(Boolean).join(', '),
    [body.name, city].filter(Boolean).join(', '),
    [body.location_text, city].filter(Boolean).join(', ')
  )

  const tried = new Set<string>()
  for (const query of queries) {
    const clean = query?.trim()
    if (!clean || clean === city || tried.has(clean)) continue
    if (tried.size > 0) await sleep(1100)
    tried.add(clean)

    const hit = await geocode(clean)
    if (hit) return json(hit)
  }

  return json({ lat: null, lng: null, reason: 'not_found' })
})
