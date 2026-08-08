import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn, blurActiveField } from '../../lib/utils'
import { X } from 'lucide-react'

/**
 * Sheets can nest (plan detail → edit). A plain `body.overflow` toggle breaks
 * there: the inner sheet's cleanup runs while the outer one is still open and
 * hands scrolling back to the page underneath. Counting open sheets keeps the
 * lock until the last one closes.
 */
let openSheets = 0

function lockBodyScroll() {
  if (openSheets++ === 0) document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  openSheets = Math.max(0, openSheets - 1)
  if (openSheets === 0) document.body.style.overflow = ''
}

/** Drag distance past which releasing dismisses the sheet. */
const DISMISS_THRESHOLD_PX = 110

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** 'full' takes nearly the full screen height; 'auto' sizes to content */
  height?: 'full' | 'auto'
  /** When true, closing asks the user to confirm first (unsaved changes). */
  confirmClose?: boolean
  confirmTitle?: string
  confirmMessage?: string
  confirmLabel?: string
}

/**
 * Mobile-first bottom sheet with backdrop. Closes via the X, the backdrop,
 * Escape, or by dragging the handle down.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  height = 'auto',
  confirmClose = false,
  confirmTitle = 'Discard changes?',
  confirmMessage = "Your edits won't be saved.",
  confirmLabel = 'Discard',
}: SheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const dragDistance = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [askConfirm, setAskConfirm] = useState(false)

  useEffect(() => {
    if (!open) {
      setAskConfirm(false)
      return
    }
    lockBodyScroll()
    // Reset the sheet's internal scroll to the top on every open. iOS WebKit
    // may retain the previous scroll position when the component re-mounts.
    const el = scrollRef.current
    if (el) el.scrollTop = 0
    return unlockBodyScroll
  }, [open])

  // Every close path funnels through here so the confirm step can't be bypassed
  const requestClose = () => {
    // Unmounting a focused field leaves iOS stuck at its zoomed-in scale
    blurActiveField()
    if (confirmClose) setAskConfirm(true)
    else onClose()
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (askConfirm) setAskConfirm(false)
      else if (confirmClose) setAskConfirm(true)
      else onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, askConfirm, confirmClose, onClose])

  // ── Drag to dismiss ──
  // Bound to the handle/header only, so it can never fight with content
  // scrolling. Transform is written straight to the node to avoid a re-render
  // per touchmove.

  const setPanelTransform = (y: number) => {
    if (panelRef.current) {
      panelRef.current.style.transform = y > 0 ? `translateY(${y}px)` : ''
    }
  }

  const onDragStart = (e: React.TouchEvent) => {
    if (askConfirm) return
    dragStartY.current = e.touches[0].clientY
    dragDistance.current = 0
    setDragging(true)
  }

  const onDragMove = (e: React.TouchEvent) => {
    if (dragStartY.current == null) return
    // Downward only — dragging up shouldn't lift the sheet off the bottom
    dragDistance.current = Math.max(0, e.touches[0].clientY - dragStartY.current)
    setPanelTransform(dragDistance.current)
  }

  const onDragEnd = () => {
    if (dragStartY.current == null) return
    const travelled = dragDistance.current
    dragStartY.current = null
    dragDistance.current = 0
    setDragging(false)
    setPanelTransform(0)
    if (travelled > DISMISS_THRESHOLD_PX) requestClose()
  }

  if (!open) return null

  const closeButton = (
    <button
      onClick={requestClose}
      aria-label="Close"
      className="h-8 w-8 rounded-full bg-cream-100 flex items-center justify-center text-warm-500 hover:bg-cream-200 transition-colors"
    >
      <X size={16} />
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-scrim/50 backdrop-blur-[2px] animate-fade-in"
        onClick={requestClose}
      />

      {/* Sheet */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 bg-white rounded-t-3xl shadow-sheet animate-slide-up',
          'flex flex-col overflow-hidden max-h-[92dvh]',
          height === 'full' && 'h-[92dvh]'
        )}
        // Inline rather than a class: toggling `animate-slide-up` off and on
        // around a drag would replay the entry animation on every release.
        style={{ transition: dragging ? 'none' : 'transform 200ms ease-out' }}
      >
        {/* Grab area — handle plus header */}
        <div
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          onTouchCancel={onDragEnd}
          className="shrink-0 touch-none"
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-cream-300" />
          </div>

          {title ? (
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="font-serif text-xl text-warm-800">{title}</h2>
              {closeButton}
            </div>
          ) : (
            <div className="flex justify-end px-4 pb-1">{closeButton}</div>
          )}
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="overflow-y-auto overscroll-contain flex-1 pb-safe">
          {children}
        </div>

        {/* Discard confirmation */}
        {askConfirm && (
          <div className="absolute inset-0 z-20 flex items-end bg-scrim/40 animate-fade-in">
            <div
              role="alertdialog"
              aria-label={confirmTitle}
              className="w-full bg-white rounded-t-3xl shadow-sheet px-5 pt-5 pb-safe"
            >
              <h3 className="font-serif text-xl text-warm-800">{confirmTitle}</h3>
              <p className="text-sm text-warm-500 mt-1">{confirmMessage}</p>
              <div className="flex gap-2 mt-4 pb-5">
                <button
                  onClick={() => { setAskConfirm(false); onClose() }}
                  className="flex-1 rounded-2xl bg-red-50 border border-red-200 text-red-700
                    py-3 text-sm font-semibold hover:bg-red-100 active:scale-[0.98] transition-all"
                >
                  {confirmLabel}
                </button>
                <button
                  onClick={() => setAskConfirm(false)}
                  autoFocus
                  className="flex-1 rounded-2xl bg-cream-100 border border-cream-300 text-warm-700
                    py-3 text-sm font-medium hover:bg-cream-200 active:scale-[0.98] transition-all"
                >
                  Keep editing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
