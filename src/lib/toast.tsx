import { type ReactNode, type ReactElement } from 'react'
import toast, { type Toast } from 'react-hot-toast'
import { Check, AlertCircle, Info } from 'lucide-react'
import { cn } from './utils'

/**
 * Centralised toasts — always notify through this module rather than calling
 * `toast.*` directly, because the raw API misbehaves on a phone in three ways
 * that are worked around here.
 *
 * 1. They stack. react-hot-toast's `toastLimit` is 20 and isn't settable via
 *    props, so a few quick actions bury the header under a column of toasts.
 *    Every toast here shares one id, so a new message *replaces* the one on
 *    screen (and resets its timer) instead of queueing below it.
 *
 * 2. They outlive their duration. Dismissal is driven by `setTimeout`, and iOS
 *    suspends JS timers while a PWA is backgrounded — so a toast fired just
 *    before the user switches to another app is still sitting there when they
 *    come back, however much later that is. We clear on `visibilitychange`
 *    instead of trusting the timer to survive.
 *
 * 3. Nothing inside a toast is tappable by default. The Toaster's container is
 *    `pointer-events: none` and that property inherits, so an action button
 *    has to opt back in explicitly (see `undo` below). The upside is that
 *    plain toasts can't swallow taps meant for the UI underneath them.
 *
 * The failsafe timer covers one more edge: the container pauses *all* dismiss
 * timers on `mouseenter` and only resumes on `mouseleave`. The only element
 * that can trigger that is the Undo button, since it re-enables pointer
 * events — and iOS often skips the matching `mouseleave`. `toast.dismiss`
 * bypasses the pause, so the failsafe unsticks it.
 */

const TOAST_ID = 'ours-toast'

const DURATION = {
  success: 2200,
  error: 3500,
  info: 2600,
  undo: 6000,
} as const

let failsafeTimer: ReturnType<typeof setTimeout> | undefined
let watchingVisibility = false

function clear() {
  clearTimeout(failsafeTimer)
  toast.dismiss(TOAST_ID)
}

/** Drop the toast when the app goes to the background, so returning is clean. */
function watchVisibility() {
  if (watchingVisibility) return
  watchingVisibility = true
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clear()
  })
}

function show(render: (t: Toast) => ReactElement, duration: number) {
  watchVisibility()
  toast.custom(render, { id: TOAST_ID, duration })
  clearTimeout(failsafeTimer)
  failsafeTimer = setTimeout(() => toast.dismiss(TOAST_ID), duration + 250)
}

// ── Shell ────────────────────────────────────────────────────────────────────

type Tone = 'success' | 'error' | 'info'

const TONE_ICON: Record<Tone, ReactNode> = {
  success: <Check size={13} strokeWidth={3} />,
  error: <AlertCircle size={13} strokeWidth={2.5} />,
  info: <Info size={13} strokeWidth={2.5} />,
}

const TONE_BADGE: Record<Tone, string> = {
  success: 'bg-sage-500 text-white',
  error: 'bg-blush-400 text-white',
  info: 'bg-warm-600 text-cream-100',
}

function Shell({
  visible,
  tone,
  message,
  action,
}: {
  visible: boolean
  tone: Tone
  message: string
  action?: ReactNode
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2.5 rounded-2xl bg-warm-800 text-cream-100 shadow-card',
        'py-2 text-sm max-w-[92vw]',
        action ? 'pl-3.5 pr-1.5' : 'px-3.5',
        'transition-all duration-200 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}
    >
      <span
        className={cn(
          'shrink-0 h-5 w-5 rounded-full flex items-center justify-center',
          TONE_BADGE[tone]
        )}
        aria-hidden="true"
      >
        {TONE_ICON[tone]}
      </span>
      <span className="min-w-0 truncate">{message}</span>
      {action}
    </div>
  )
}

// ── Public API ───────────────────────────────────────────────────────────────

export const notify = {
  success(message: string) {
    show((t) => <Shell visible={t.visible} tone="success" message={message} />, DURATION.success)
  },

  error(message: string) {
    show((t) => <Shell visible={t.visible} tone="error" message={message} />, DURATION.error)
  },

  info(message: string) {
    show((t) => <Shell visible={t.visible} tone="info" message={message} />, DURATION.info)
  },

  /** Success toast with an inline Undo action. */
  undo(message: string, onUndo: () => void) {
    show(
      (t) => (
        <Shell
          visible={t.visible}
          tone="success"
          message={message}
          action={
            <button
              onClick={() => {
                clear()
                onUndo()
              }}
              // Toasts inherit `pointer-events: none` from the Toaster
              // container, so an interactive control must opt back in or it
              // simply won't receive taps.
              style={{ pointerEvents: 'auto' }}
              className="shrink-0 rounded-xl px-3 py-1.5 font-semibold text-sand-300
                hover:bg-white/10 active:bg-white/15 transition-colors"
            >
              Undo
            </button>
          }
        />
      ),
      DURATION.undo
    )
  },

  /** Clear whatever is on screen. */
  dismiss: clear,
}
