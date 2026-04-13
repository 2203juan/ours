import { useState } from 'react'
import { Heart, ArrowRight, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { generateCoupleCode } from '../../lib/utils'
import { DEFAULT_CATEGORIES } from '../../types'
import { useSessionStore } from '../../stores/sessionStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { AvatarUpload } from '../ui/ImageUpload'

type Step =
  | 'welcome'
  | 'create-couple'
  | 'create-profile'
  | 'show-code'
  | 'join-enter-code'
  | 'join-profile'

export function OnboardingFlow() {
  const setSession = useSessionStore((s) => s.setSession)
  const [step, setStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)

  // Create flow state
  const [coupleName, setCoupleName] = useState('')
  const [myName, setMyName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [createdCoupleId, setCreatedCoupleId] = useState('')
  const [createdCoupleCode, setCreatedCoupleCode] = useState('')
  const [createdProfileId, setCreatedProfileId] = useState('')

  // Join flow state
  const [joinCode, setJoinCode] = useState('')
  const [joinCoupleId, setJoinCoupleId] = useState('')
  const [joinCoupleName, setJoinCoupleName] = useState('')
  const [joinCode2, setJoinCode2] = useState('')
  const [joinName, setJoinName] = useState('')
  const [joinAvatarUrl, setJoinAvatarUrl] = useState<string | null>(null)

  // Temp profile ID for avatar upload before profile exists
  const [tempProfileId] = useState(() => crypto.randomUUID())

  // ── Create flow ──────────────────────────────────────────────────────────

  const handleCreateCouple = async () => {
    if (!coupleName.trim()) return
    setLoading(true)
    try {
      const code = generateCoupleCode()
      const { data, error } = await supabase
        .from('couples')
        .insert({ code, couple_name: coupleName.trim() })
        .select()
        .single()
      if (error) throw error

      // Seed default categories
      await supabase.from('categories').insert(
        DEFAULT_CATEGORIES.map((c) => ({ ...c, couple_id: data.id }))
      )

      setCreatedCoupleId(data.id)
      setCreatedCoupleCode(code)
      setStep('create-profile')
    } catch (e) {
      toast.error('Could not create couple. Check your Supabase config.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProfile = async () => {
    if (!myName.trim()) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          couple_id: createdCoupleId,
          name: myName.trim(),
          avatar_url: avatarUrl,
        })
        .select()
        .single()
      if (error) throw error
      setCreatedProfileId(data.id)
      setStep('show-code')
    } catch (e) {
      toast.error('Could not create profile.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleEnterApp = () => {
    setSession({
      coupleId: createdCoupleId,
      coupleCode: createdCoupleCode,
      coupleName,
      profileId: createdProfileId,
      profileName: myName,
      avatarUrl,
    })
  }

  // ── Join flow ────────────────────────────────────────────────────────────

  const handleLookupCode = async () => {
    if (joinCode.trim().length < 4) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .eq('code', joinCode.trim().toUpperCase())
        .single()
      if (error || !data) {
        toast.error('Code not found. Double-check with your partner.')
        return
      }

      // Check slot available (max 2 profiles)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('couple_id', data.id)
      if (profiles && profiles.length >= 2) {
        toast.error('This couple already has two members.')
        return
      }

      setJoinCoupleId(data.id)
      setJoinCoupleName(data.couple_name ?? '')
      setJoinCode2(data.code)
      setStep('join-profile')
    } catch (e) {
      toast.error('Something went wrong.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinWithProfile = async () => {
    if (!joinName.trim()) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          couple_id: joinCoupleId,
          name: joinName.trim(),
          avatar_url: joinAvatarUrl,
        })
        .select()
        .single()
      if (error) throw error

      setSession({
        coupleId: joinCoupleId,
        coupleCode: joinCode2,
        coupleName: joinCoupleName,
        profileId: data.id,
        profileName: joinName.trim(),
        avatarUrl: joinAvatarUrl,
      })
    } catch (e) {
      toast.error('Could not join couple.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-sand-300 to-blush-300 mb-4 mx-auto">
            <Heart size={24} className="text-white fill-white" />
          </div>
          <h1 className="font-serif text-4xl text-warm-800">Ours</h1>
          <p className="mt-1 text-sm text-warm-400 font-light">your plans, together</p>
        </div>

        {/* ── Welcome ── */}
        {step === 'welcome' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setStep('create-couple')}
            >
              Create a couple
              <ArrowRight size={16} />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => setStep('join-enter-code')}
            >
              Join with a code
            </Button>
          </div>
        )}

        {/* ── Create: couple name ── */}
        {step === 'create-couple' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <h2 className="font-serif text-2xl text-warm-800 mb-1">Name your couple</h2>
              <p className="text-sm text-warm-400">Something like "Ana & Marcos" or "Us"</p>
            </div>
            <Input
              label="Couple name"
              placeholder="e.g. Ana & Marcos"
              value={coupleName}
              onChange={(e) => setCoupleName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCouple()}
              autoFocus
            />
            <Button
              size="lg"
              fullWidth
              loading={loading}
              disabled={!coupleName.trim()}
              onClick={handleCreateCouple}
            >
              Continue
              <ArrowRight size={16} />
            </Button>
            <button className="text-sm text-warm-400 text-center" onClick={() => setStep('welcome')}>
              ← Back
            </button>
          </div>
        )}

        {/* ── Create: your profile ── */}
        {step === 'create-profile' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <h2 className="font-serif text-2xl text-warm-800 mb-1">Your profile</h2>
              <p className="text-sm text-warm-400">How should your partner see you?</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <AvatarUpload
                coupleId={createdCoupleId}
                profileId={tempProfileId}
                name={myName || 'Me'}
                value={avatarUrl}
                onChange={setAvatarUrl}
              />
              <p className="text-xs text-warm-400">Tap to add a photo</p>
            </div>
            <Input
              label="Your name"
              placeholder="e.g. Ana"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
              autoFocus
            />
            <Button
              size="lg"
              fullWidth
              loading={loading}
              disabled={!myName.trim()}
              onClick={handleCreateProfile}
            >
              Create
              <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {/* ── Create: show code ── */}
        {step === 'show-code' && (
          <ShowCode
            code={createdCoupleCode}
            coupleName={coupleName}
            onEnter={handleEnterApp}
          />
        )}

        {/* ── Join: enter code ── */}
        {step === 'join-enter-code' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <h2 className="font-serif text-2xl text-warm-800 mb-1">Enter your code</h2>
              <p className="text-sm text-warm-400">Ask your partner for the 6-character code.</p>
            </div>
            <Input
              label="Couple code"
              placeholder="e.g. X7K2PQ"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="tracking-[0.25em] text-center text-lg uppercase font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleLookupCode()}
              autoFocus
            />
            <Button
              size="lg"
              fullWidth
              loading={loading}
              disabled={joinCode.trim().length < 4}
              onClick={handleLookupCode}
            >
              Continue
              <ArrowRight size={16} />
            </Button>
            <button className="text-sm text-warm-400 text-center" onClick={() => setStep('welcome')}>
              ← Back
            </button>
          </div>
        )}

        {/* ── Join: your profile ── */}
        {step === 'join-profile' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <h2 className="font-serif text-2xl text-warm-800 mb-1">Joining {joinCoupleName || 'your couple'}</h2>
              <p className="text-sm text-warm-400">Set up your profile.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <AvatarUpload
                coupleId={joinCoupleId}
                profileId={tempProfileId}
                name={joinName || 'Me'}
                value={joinAvatarUrl}
                onChange={setJoinAvatarUrl}
              />
              <p className="text-xs text-warm-400">Tap to add a photo</p>
            </div>
            <Input
              label="Your name"
              placeholder="e.g. Marcos"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinWithProfile()}
              autoFocus
            />
            <Button
              size="lg"
              fullWidth
              loading={loading}
              disabled={!joinName.trim()}
              onClick={handleJoinWithProfile}
            >
              Join
              <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Show Code screen ──────────────────────────────────────────────────────────

function ShowCode({
  code,
  coupleName,
  onEnter,
}: {
  code: string
  coupleName: string
  onEnter: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-center">
      <div>
        <h2 className="font-serif text-2xl text-warm-800 mb-1">Share with your partner</h2>
        <p className="text-sm text-warm-400">
          Send this code to {coupleName.split('&').slice(-1)[0]?.trim() || 'your partner'} so they can join.
        </p>
      </div>

      <button
        onClick={copy}
        className="mx-auto bg-cream-100 rounded-3xl px-8 py-5 border border-cream-300 hover:bg-cream-200 transition-colors"
      >
        <div className="text-4xl font-serif font-medium tracking-[0.2em] text-warm-800 mb-2">
          {code}
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-warm-400">
          {copied ? (
            <>
              <Check size={12} className="text-sage-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={12} />
              Tap to copy
            </>
          )}
        </div>
      </button>

      <p className="text-xs text-warm-400">
        Your partner can enter this code on their device to join you.
      </p>

      <Button size="lg" fullWidth onClick={onEnter}>
        Enter the app
        <ArrowRight size={16} />
      </Button>
    </div>
  )
}
