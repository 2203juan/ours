import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-warm-500">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'w-full appearance-none rounded-2xl border bg-white px-4 py-3 pr-9 text-sm text-warm-800',
              'transition-colors duration-150 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-sand-400',
              error
                ? 'border-red-300 focus:ring-red-300'
                : 'border-cream-300',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none"
          />
        </div>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
