import { NavLink } from 'react-router-dom'
import { List, Map, Shuffle, User } from 'lucide-react'
import { cn } from '../../lib/utils'

/* Map sits next to Plans: both answer "what should we do", one by list and
   one by how far away it is. Surprise and Profile stay where they were so
   the tab bar doesn't move under anyone's thumb. */
const NAV = [
  { to: '/', icon: List, label: 'Plans', end: true },
  { to: '/map', icon: Map, label: 'Map', end: false },
  { to: '/surprise', icon: Shuffle, label: 'Surprise', end: false },
  { to: '/profile', icon: User, label: 'Profile', end: false },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-cream-200 pb-safe">
      <div className="flex justify-around items-center h-14">
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
