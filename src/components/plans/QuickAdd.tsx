import { useRef, useState } from 'react'
import { Plus, ClipboardPaste, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { readClipboardLink, LINK_LABEL, type DetectedLink } from '../../lib/links'
import { notify } from '../../lib/toast'

interface QuickAddProps {
  /** Create a plan from just a name. Resolves once it's saved. */
  onCreate: (name: string) => Promise<void>
  /** A link was pasted — open the full form prefilled with it. */
  onPastedLink: (link: DetectedLink) => void
}

/**
 * Capture an idea in one gesture. The full form is still there for details,
 * but "we should go to X" shouldn't cost a full-screen sheet.
 */
export function QuickAdd({ onCreate, onPastedLink }: QuickAddProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const trimmed = name.trim()

  const submit = async () => {
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await onCreate(trimmed)
      setName('')
      // Keep focus so several ideas can be dumped in a row
      inputRef.current?.focus()
    } catch {
      notify.error('Could not add the plan.')
    } finally {
      setSaving(false)
    }
  }

  const paste = async () => {
    // Called straight from the tap so Safari allows the clipboard read
    const link = await readClipboardLink()
    if (!link) {
      notify.info('No link found in your clipboard')
      return
    }
    onPastedLink(link)
    notify.info(`Starting a plan from that ${LINK_LABEL[link.kind]}`)
  }

  return (
    <div className="px-4 pt-3">
      <div
        className="flex items-center gap-1 rounded-2xl border border-cream-200 bg-white
          px-2 shadow-soft focus-within:border-sand-400 transition-colors"
      >
        <span className="shrink-0 pl-1.5 text-warm-300" aria-hidden="true">
          <Plus size={16} />
        </span>

        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Add a plan…"
          aria-label="Add a plan quickly"
          enterKeyHint="done"
          className="flex-1 min-w-0 bg-transparent py-3 text-sm text-warm-800
            placeholder:text-warm-400 focus:outline-none"
        />

        {trimmed ? (
          <button
            onClick={submit}
            disabled={saving}
            aria-label="Save plan"
            className={cn(
              'shrink-0 h-9 w-9 rounded-xl bg-warm-800 text-white flex items-center',
              'justify-center active:scale-95 transition-all disabled:opacity-60'
            )}
          >
            {saving ? (
              <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight size={16} />
            )}
          </button>
        ) : (
          <button
            onClick={paste}
            aria-label="Start a plan from a copied link"
            title="Paste a link"
            className="shrink-0 h-9 w-9 rounded-xl text-warm-400 flex items-center
              justify-center hover:bg-cream-100 hover:text-warm-600 active:scale-95 transition-all"
          >
            <ClipboardPaste size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
