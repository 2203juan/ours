import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { supabase, PLAN_IMAGES_BUCKET } from '../../lib/supabase'

// ── Plan image uploader (multiple) ────────────────────────────────────────────

interface PlanImageUploadProps {
  coupleId: string
  planId?: string
  value: string[]
  onChange: (urls: string[]) => void
}

export function PlanImageUpload({ coupleId, planId, value, onChange }: PlanImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return
    setUploading(true)
    try {
      const newUrls: string[] = []
      for (const file of Array.from(files)) {
        const slug = planId ?? `temp-${Date.now()}`
        const path = `${coupleId}/${slug}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { error } = await supabase.storage
          .from(PLAN_IMAGES_BUCKET)
          .upload(path, file, { upsert: true, contentType: file.type })
        if (error) throw error
        const { data } = supabase.storage.from(PLAN_IMAGES_BUCKET).getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
      onChange([...value, ...newUrls])
    } catch (e) {
      console.error('Image upload failed', e)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-warm-600 uppercase tracking-wide">Photos</label>
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div key={url} className="relative h-20 w-20 rounded-2xl overflow-hidden border border-cream-300">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-warm-800/70
                flex items-center justify-center text-white"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'h-20 w-20 rounded-2xl border-2 border-dashed border-cream-300',
            'flex flex-col items-center justify-center gap-1 text-warm-400',
            'hover:border-sand-400 hover:text-sand-500 transition-colors',
            uploading && 'opacity-50'
          )}
        >
          {uploading ? (
            <div className="h-5 w-5 border-2 border-sand-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Camera size={18} />
              <span className="text-[10px] font-medium">Add</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  )
}
