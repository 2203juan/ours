/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your values.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
})

// ── Storage helpers ──────────────────────────────────────────────────────────

export const PLAN_IMAGES_BUCKET = 'plan-images'
export const AVATARS_BUCKET = 'avatars'

/** Upload a file and return its public URL, or throw on error. */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/** Delete a file from storage by its full public URL (best-effort). */
export async function deleteFileByUrl(bucket: string, publicUrl: string) {
  try {
    // Extract path after the bucket name in the URL
    const marker = `/storage/v1/object/public/${bucket}/`
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return
    const path = decodeURIComponent(publicUrl.slice(idx + marker.length))
    await supabase.storage.from(bucket).remove([path])
  } catch {
    // non-fatal
  }
}
