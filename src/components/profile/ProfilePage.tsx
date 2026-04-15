import { useState } from 'react'
import { Copy, Check, LogOut, Heart, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSessionStore } from '../../stores/sessionStore'
import { AvatarIcon } from '../ui/AvatarIcon'
import { RecentActivity } from './RecentActivity'
import type { PartnerKey } from '../../types'

export function ProfilePage() {
  const { session, setPartnerKey, clearSession } = useSessionStore()
  const [copied, setCopied] = useState(false)

  if (!session) return null

  const myName = session.partnerKey === 'one' ? session.partnerOneName : session.partnerTwoName
  const myAvatar = session.partnerKey === 'one' ? session.partnerOneAvatar : session.partnerTwoAvatar
  const partnerName = session.partnerKey === 'one' ? session.partnerTwoName : session.partnerOneName
  const partnerAvatar = session.partnerKey === 'one' ? session.partnerTwoAvatar : session.partnerOneAvatar

  const copyCode = () => {
    navigator.clipboard.writeText(session.coupleCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const switchTo = (key: PartnerKey) => {
    setPartnerKey(key)
    toast.success(`Switched to ${key === 'one' ? session.partnerOneName : session.partnerTwoName}`)
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-4 pb-10">

      {/* Couple banner */}
      <div className="rounded-3xl bg-gradient-to-br from-sand-300/30 to-blush-200/30
        border border-cream-200 p-5 flex flex-col items-center gap-3">
        <div className="flex -space-x-3">
          <AvatarIcon
            name={session.partnerOneName}
            avatarKey={session.partnerOneAvatar}
            size="lg"
            className="ring-2 ring-white"
          />
          <AvatarIcon
            name={session.partnerTwoName}
            avatarKey={session.partnerTwoAvatar}
            size="lg"
            className="ring-2 ring-white"
          />
        </div>
        <div className="flex items-center gap-1.5 text-warm-600">
          <Heart size={12} className="fill-blush-400 text-blush-400" />
          <h2 className="font-serif text-xl text-warm-800">{session.coupleName}</h2>
          <Heart size={12} className="fill-blush-400 text-blush-400" />
        </div>
      </div>

      {/* Couple code */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Couple code</p>
        <button
          onClick={copyCode}
          className="flex items-center justify-between rounded-2xl border border-cream-300
            bg-cream-50 px-4 py-3 hover:bg-cream-100 transition-colors"
        >
          <span className="font-serif text-2xl tracking-[0.2em] text-warm-800">
            {session.coupleCode}
          </span>
          <span className="flex items-center gap-1 text-xs text-warm-400">
            {copied
              ? <><Check size={13} className="text-sage-500" /> Copied</>
              : <><Copy size={13} /> Copy</>
            }
          </span>
        </button>
        <p className="text-xs text-warm-400">
          Share this code with your partner so they can join on their device.
        </p>
      </div>

      {/* Currently signed in as */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Signed in as</p>
        <div className="rounded-3xl border-2 border-sand-300 bg-white p-4 flex items-center gap-4">
          <AvatarIcon name={myName} avatarKey={myAvatar} size="lg" />
          <div>
            <p className="font-medium text-warm-800 text-base">{myName}</p>
            <p className="text-xs text-warm-400 mt-0.5">That's you on this device</p>
          </div>
        </div>
      </div>

      {/* Partner */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Partner</p>
        <div className="rounded-3xl border border-cream-200 bg-white p-4 flex items-center gap-4">
          <AvatarIcon name={partnerName} avatarKey={partnerAvatar} size="lg" />
          <div>
            <p className="font-medium text-warm-700 text-base">{partnerName}</p>
            <p className="text-xs text-warm-400 mt-0.5">Your partner</p>
          </div>
        </div>
      </div>

      {/* Switch profile */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Switch profile</p>
        <div className="flex flex-col gap-2">
          {([
            ['one' as PartnerKey, session.partnerOneName, session.partnerOneAvatar],
            ['two' as PartnerKey, session.partnerTwoName, session.partnerTwoAvatar],
          ] as const).map(([key, name, avatar]) => {
            const isActive = session.partnerKey === key
            return (
              <button
                key={key}
                onClick={() => !isActive && switchTo(key)}
                disabled={isActive}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all text-left
                  ${isActive
                    ? 'border-sand-300 bg-sand-50 cursor-default'
                    : 'border-cream-200 bg-white hover:border-sand-300 hover:bg-cream-50'
                  }`}
              >
                <AvatarIcon name={name} avatarKey={avatar} size="sm" />
                <span className={`text-sm font-medium ${isActive ? 'text-sand-600' : 'text-warm-700'}`}>
                  {name}
                </span>
                {isActive && (
                  <span className="ml-auto text-[11px] text-sand-500 font-medium">Active</span>
                )}
                {!isActive && (
                  <RefreshCw size={14} className="ml-auto text-warm-300" />
                )}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-warm-400 mt-1">
          Switching profile changes who appears as proposer on new plans.
        </p>
      </div>

      {/* Recent activity */}
      <RecentActivity />

      {/* Sign out */}
      <div className="pt-4 border-t border-cream-200">
        <button
          onClick={clearSession}
          className="flex items-center gap-2 text-sm text-warm-400 hover:text-red-500
            transition-colors py-1"
        >
          <LogOut size={14} />
          Sign out of this device
        </button>
        <p className="text-[11px] text-warm-300 mt-2 leading-relaxed">
          Your plans and couple stay saved. Re-join with your couple code at any time.
        </p>
      </div>

    </div>
  )
}
