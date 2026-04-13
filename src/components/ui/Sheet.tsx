import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** 'full' takes nearly the full screen height; 'auto' sizes to content */
  height?: 'full' | 'auto'
}

/**
 * Mobile-first bottom sheet with backdrop.
 * Slides up from the bottom with a smooth animation.
 */
export function Sheet({ open, onClose, title, children, height = 'auto' }: SheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Reset the sheet's internal scroll to the top on every open.
      // iOS WebKit may retain the previous scroll position when the component
      // re-mounts, so we force it here after the DOM is ready.
      const el = scrollRef.current
      if (el) el.scrollTop = 0
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-warm-800/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          'relative z-10 bg-white rounded-t-3xl shadow-sheet animate-slide-up',
          'flex flex-col overflow-hidden',
          height === 'full' ? 'max-h-[92dvh]' : 'max-h-[92dvh]'
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-cream-300" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-3 shrink-0">
            <h2 className="font-serif text-xl text-warm-800">{title}</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-cream-100 flex items-center justify-center text-warm-500 hover:bg-cream-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {!title && (
          <div className="flex justify-end px-4 pb-1 shrink-0">
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-cream-100 flex items-center justify-center text-warm-500 hover:bg-cream-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div ref={scrollRef} className="overflow-y-auto overscroll-contain flex-1 pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}
