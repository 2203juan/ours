import { useState } from 'react'
import { Copy, Check, LogOut, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSessionStore } from '../../stores/sessionStore'
import { useProfiles } from '../../hooks/useProfiles'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { AvatarUpload } from '../ui/ImageUpload'

export function ProfilePage() {
  const { session, updateSession, clearSession } = useSessionStore()
  const { data: profiles = [] } = useProfiles(session?.coupleId ?? '')
  const [copied, setCopied] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(session?.profileName ?? '')
  const [saving, setSaving] = useState(false)

  if (!session) return null

  const partner = profiles.find((p) => p.id !== session.profileId)
  const me = profiles.find((p) => p.id === session.profileId)

  const copyCode = () => {
    navigator.clipboard.writeText(session.coupleCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const saveName = async () => {
    if (!nameInput.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: nameInput.trim() })
        .eq('id', session.profileId)
      if (error) throw error
      updateSession({ profileName: nameInput.trim() })
      setEditingName(false)
      toast.success('Name updated')
    } catch {
      toast.error('Could not update name.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (url: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', session.profileId)
      if (error) throw error
      updateSession({ avatarUrl: url })
      toast.success('Photo updated')
    } catch {
      toast.error('Could not update photo.')
    }
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-4 pb-10">
      {/* Couple header */}
      <div className="rounded-3xl bg-gradient-to-br from-sand-300/30 to-blush-200/30 border border-cream-200 p-5 flex flex-col items-center gap-2">
        <div className="flex -space-x-3">
          {me && <Avatar name={me.name} url={me.avatar_url} size="lg" className="ring-2 ring-white" />}
          {partner && <Avatar name={partner.name} url={partner.avatar_url} size="lg" className="ring-2 ring-white" />}
          {!partner && (
            <div className="h-14 w-14 rounded-full bg-cream-200 ring-2 ring-white flex items-center justify-center">
              <span className="text-2xl text-warm-300">?</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-warm-600">
          <Heart size={12} className="fill-blush-400 text-blush-400" />
          <h2 className="font-serif text-xl text-warm-800">{session.coupleName}</h2>
          <Heart size={12} className="fill-blush-400 text-blush-400" />
        </div>
        {!partner && (
          <p className="text-xs text-warm-400 text-center">
            Share your code below so your partner can join.
          </p>
        )}
      </div>

      {/* Couple code */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Couple code</p>
        <button
          onClick={copyCode}
          className="flex items-center justify-between rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 hover:bg-cream-100 transition-colors"
        >
          <span className="font-serif text-2xl tracking-[0.2em] text-warm-800">{session.coupleCode}</span>
          <span className="flex items-center gap-1 text-xs text-warm-400">
            {copied ? <Check size={13} className="text-sage-500" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </span>
        </button>
        <p className="text-xs text-warm-400">Share this code with your partner to let them join.</p>
      </div>

      {/* My profile */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Your profile</p>
        <div className="rounded-3xl border border-cream-200 bg-white p-4 flex items-center gap-4">
          <AvatarUpload
            coupleId={session.coupleId}
            profileId={session.profileId}
            name={session.profileName}
            value={session.avatarUrl}
            onChange={handleAvatarChange}
          />
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex gap-2">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="py-1.5 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                />
                <Button size="sm" loading={saving} onClick={saveName}>Save</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium text-warm-800">{session.profileName}</span>
                <button
                  onClick={() => { setNameInput(session.profileName); setEditingName(true) }}
                  className="text-xs text-warm-400 hover:text-warm-600 underline underline-offset-2"
                >
                  edit
                </button>
              </div>
            )}
            <span className="text-xs text-warm-400 mt-0.5 block">That's you</span>
          </div>
        </div>
      </div>

      {/* Partner profile */}
      {partner && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Partner</p>
          <div className="rounded-3xl border border-cream-200 bg-white p-4 flex items-center gap-4">
            <Avatar name={partner.name} url={partner.avatar_url} size="lg" />
            <div>
              <span className="font-medium text-warm-800">{partner.name}</span>
              <span className="text-xs text-warm-400 mt-0.5 block">Your partner</span>
            </div>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="pt-4 border-t border-cream-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSession}
          className="text-warm-400 hover:text-red-500"
        >
          <LogOut size={14} />
          Sign out of this device
        </Button>
        <p className="text-[11px] text-warm-300 mt-2 ml-1">
          Your plans and couple data stay saved. You can re-join with your code.
        </p>
      </div>
    </div>
  )
}
