import { CloudOff, RotateCw } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry: () => void
  retrying?: boolean
  /** `inline` fits inside a card slot; `page` fills the content area. */
  variant?: 'page' | 'inline'
}

/**
 * Shown when a query fails. Critical distinction from the empty state: the
 * user's data still exists — we just couldn't load it.
 */
export function ErrorState({
  title = "Couldn't load your plans",
  message = 'Check your connection and try again — nothing has been lost.',
  onRetry,
  retrying,
  variant = 'page',
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variant === 'page' ? 'py-20 px-8' : 'py-8 px-5'
      )}
      role="alert"
    >
      <div className="h-14 w-14 rounded-full bg-blush-100 flex items-center justify-center mb-4">
        <CloudOff size={22} className="text-blush-400" />
      </div>
      <p className="text-warm-600 font-medium mb-1">{title}</p>
      <p className="text-sm text-warm-400 mb-6 max-w-xs leading-relaxed">{message}</p>
      <button
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex items-center gap-2 rounded-2xl bg-cream-100 border border-cream-300
          px-5 py-2.5 text-sm font-medium text-warm-700 hover:bg-cream-200
          active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
      >
        <RotateCw size={14} className={cn(retrying && 'animate-spin')} />
        {retrying ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  )
}
