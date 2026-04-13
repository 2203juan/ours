import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

// ── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-warm-500">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-warm-800',
            'placeholder:text-warm-400 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-sand-400',
            error
              ? 'border-red-300 focus:ring-red-300'
              : 'border-cream-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        {hint && !error && <p className="text-xs text-warm-400 mt-0.5">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-warm-500">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-warm-800 resize-none',
            'placeholder:text-warm-400 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-sand-400',
            error
              ? 'border-red-300 focus:ring-red-300'
              : 'border-cream-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        {hint && !error && <p className="text-xs text-warm-400 mt-0.5">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
