import { cn, initials } from '../../lib/utils'

interface AvatarProps {
  name: string
  url?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

export function Avatar({ name, url, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center shrink-0 overflow-hidden',
        'bg-gradient-to-br from-sand-300 to-blush-300 text-white font-medium',
        sizeMap[size],
        className
      )}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="select-none">{initials(name)}</span>
      )}
    </div>
  )
}
