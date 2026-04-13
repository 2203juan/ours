import { Heart, ArrowRight } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'
import { AvatarIcon } from '../ui/AvatarIcon'
import type { PartnerKey } from '../../types'

/**
 * Shown when a couple session is loaded from storage but the user hasn't
 * chosen which partner they are yet (partnerKey === null).
 * This also serves as the "Switch profile" screen.
 */
export function IdentitySelector() {
  const { session, setPartnerKey } = useSessionStore()

  if (!session) return null

  const pick = (key: PartnerKey) => setPartnerKey(key)

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full
            bg-gradient-to-br from-sand-300 to-blush-300 mb-4">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <p className="text-xs text-warm-400 font-medium uppercase tracking-widest mb-1">
            {session.coupleName}
          </p>
          <h1 className="font-serif text-3xl text-warm-800">Who are you?</h1>
        </div>

        {/* Partner cards */}
        <div className="flex flex-col gap-3">
          {([
            ['one' as PartnerKey, session.partnerOneName, session.partnerOneAvatar],
            ['two' as PartnerKey, session.partnerTwoName, session.partnerTwoAvatar],
          ] as const).map(([key, name, avatar]) => (
            <button
              key={key}
              onClick={() => pick(key)}
              className="flex items-center gap-4 rounded-3xl border-2 border-cream-200 bg-white
                px-5 py-4 hover:border-sand-400 hover:shadow-soft active:scale-[0.98]
                transition-all text-left"
            >
              <AvatarIcon name={name} avatarKey={avatar} size="lg" />
              <div className="flex-1">
                <p className="font-medium text-warm-800 text-base">{name}</p>
                <p className="text-xs text-warm-400 mt-0.5">I'm {name}</p>
              </div>
              <ArrowRight size={16} className="text-warm-300" />
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-warm-400 leading-relaxed">
          This device will remember your choice. You can switch anytime from the Profile tab.
        </p>
      </div>
    </div>
  )
}
