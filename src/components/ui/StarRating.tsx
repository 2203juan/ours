import { Star } from 'lucide-react'
import { cn } from '../../lib/utils'

// ── Read-only display ────────────────────────────────────────────────────────

interface StarRatingDisplayProps {
  rating: number
  size?: number
  className?: string
}

export function StarRatingDisplay({ rating, size = 9, className }: StarRatingDisplayProps) {
  return (
    <span className={cn('flex items-center gap-0.5 text-[11px] text-warm-400', className)}>
      <Star size={size} className="fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}
    </span>
  )
}
