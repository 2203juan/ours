import { NavLink } from 'react-router-dom'
import { List, Shuffle, User } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV = [
  { to: '/', icon: List, label: 'Plans', end: true },
  { to: '/surprise', icon: Shuffle, label: 'Surprise', end: false },
  { to: '/profile', icon: User, label: 'Profile', end: false },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-cream-200">
      <div className="flex justify-around items-center h-14 pb-safe">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full',
                'transition-colors touch-manipulation select-none',
                isActive ? 'text-warm-800' : 'text-warm-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'h-9 w-9 rounded-2xl flex items-center justify-center transition-all',
                    isActive && 'bg-cream-100'
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isActive ? 'text-warm-700' : 'text-warm-400'
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
