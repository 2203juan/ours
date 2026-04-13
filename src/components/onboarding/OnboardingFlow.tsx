import { useState } from 'react'
import { Heart, ArrowRight, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { generateCoupleCode } from '../../lib/utils'
import { DEFAULT_CATEGORIES, type AvatarKey } from '../../types'
import { useSessionStore } from '../../stores/sessionStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { AvatarPicker } from '../ui/AvatarIcon'
import type { Session } from '../../types'

// ── Steps ─────────────────────────────────────────────────────────────────────

type Step =
  | 'welcome'
  | 'create-names'          // couple name + partner names + avatars
  | 'create-who-are-you'    // pick which partner you are
  | 'create-show-code'      // show couple code
  | 'join-code'             // enter code
  | 'join-who-are-you'      // pick identity from found couple

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingFlow() {
  const { setSession } = useSessionStore()
  const [step, setStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)

  // ── Create state ──
  const [coupleName, setCoupleName]     = useState('')
  const [p1Name, setP1Name]             = useState('')
  const [p1Avatar, setP1Avatar]         = useState<AvatarKey>('blossom')
  const [p2Name, setP2Name]             = useState('')
  const [p2Avatar, setP2Avatar]         = useState<AvatarKey>('sage')
  const [createdCouple, setCreatedCouple] = useState<Session | null>(null)

  // ── Join state ──
  const [joinCode, setJoinCode]         = useState('')
  const [joinSession, setJoinSession]   = useState<Session | null>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE FLOW
  // ─────────────────────────────────────────────────────────────────────────

  const handleCreateCouple = async () => {
    if (!p1Name.trim() || !p2Name.trim()) return
    setLoading(true)
    try {
      const code = generateCoupleCode()
      const name = coupleName.trim() || `${p1Name.trim()} & ${p2Name.trim()}`

      const { data, error } = await supabase
        .from('couples')
        .insert({
          code,
          couple_name: name,
          partner_one_name: p1Name.trim(),
          partner_two_name: p2Name.trim(),
          partner_one_avatar: p1Avatar,
          partner_two_avatar: p2Avatar,
        })
        .select()
        .single()
      if (error) throw error

      // Seed default categories
      await supabase.from('categories').insert(
        DEFAULT_CATEGORIES.map((c) => ({ ...c, couple_id: data.id }))
      )

      const partial: Session = {
        coupleId: data.id,
        coupleCode: code,
        coupleName: name,
        partnerOneName: p1Name.trim(),
        partnerOneAvatar: p1Avatar,
        partnerTwoName: p2Name.trim(),
        partnerTwoAvatar: p2Avatar,
        partnerKey: null, // will be set on next screen
      }
      setCreatedCouple(partial)
      setStep('create-who-are-you')
    } catch (e) {
      toast.error('Could not create couple. Check your Supabase config.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePickIdentity = (key: 'one' | 'two') => {
    if (!createdCouple) return
    const session: Session = { ...createdCouple, partnerKey: key }
    setCreatedCouple(session)
    setSession(session)      // ← saves to store, but we still show code screen
    setStep('create-show-code')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // JOIN FLOW
  // ─────────────────────────────────────────────────────────────────────────

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
      if (!data.partner_one_name || !data.partner_two_name) {
        toast.error('This couple was created with an older version. Please create a new couple.')
        return
      }

      setJoinSession({
        coupleId: data.id,
        coupleCode: data.code,
        coupleName: data.couple_name ?? `${data.partner_one_name} & ${data.partner_two_name}`,
        partnerOneName: data.partner_one_name,
        partnerOneAvatar: data.partner_one_avatar ?? 'blossom',
        partnerTwoName: data.partner_two_name,
        partnerTwoAvatar: data.partner_two_avatar ?? 'sage',
        partnerKey: null,
      })
      setStep('join-who-are-you')
    } catch (e) {
      toast.error('Something went wrong.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinPickIdentity = (key: 'one' | 'two') => {
    if (!joinSession) return
    setSession({ ...joinSession, partnerKey: key })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">

        {/* ── Logo ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-sand-300 to-blush-300 mb-4">
            <Heart size={24} className="text-white fill-white" />
          </div>
          <h1 className="font-serif text-4xl text-warm-800">Ours</h1>
          <p className="mt-1 text-sm text-warm-400 font-light">your plans, together</p>
        </div>

        {/* ── Welcome ── */}
        {step === 'welcome' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <Button variant="primary" size="lg" fullWidth onClick={() => setStep('create-names')}>
              Create a couple
              <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={() => setStep('join-code')}>
              Join with a code
            </Button>
          </div>
        )}

        {/* ── Create: names + avatars ── */}
        {step === 'create-names' && (
          <CreateNamesStep
            coupleName={coupleName} setCoupleName={setCoupleName}
            p1Name={p1Name} setP1Name={setP1Name}
            p1Avatar={p1Avatar} setP1Avatar={setP1Avatar}
            p2Name={p2Name} setP2Name={setP2Name}
            p2Avatar={p2Avatar} setP2Avatar={setP2Avatar}
            loading={loading}
            onBack={() => setStep('welcome')}
            onContinue={handleCreateCouple}
          />
        )}

        {/* ── Create: who are you? ── */}
        {step === 'create-who-are-you' && createdCouple && (
          <WhoAreYouStep
            session={createdCouple}
            onPick={handleCreatePickIdentity}
          />
        )}

        {/* ── Create: show code ── */}
        {step === 'create-show-code' && createdCouple && (
          <ShowCode
            code={createdCouple.coupleCode}
            coupleName={createdCouple.coupleName}
          />
        )}

        {/* ── Join: enter code ── */}
        {step === 'join-code' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <h2 className="font-serif text-2xl text-warm-800 mb-1">Enter your code</h2>
              <p className="text-sm text-warm-400">Ask your partner for the 6-character couple code.</p>
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
              size="lg" fullWidth loading={loading}
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

        {/* ── Join: who are you? ── */}
        {step === 'join-who-are-you' && joinSession && (
          <WhoAreYouStep session={joinSession} onPick={handleJoinPickIdentity} />
        )}

      </div>
    </div>
  )
}

// ── Sub-screen: Create names ──────────────────────────────────────────────────

interface CreateNamesStepProps {
  coupleName: string; setCoupleName: (v: string) => void
  p1Name: string; setP1Name: (v: string) => void
  p1Avatar: AvatarKey; setP1Avatar: (k: AvatarKey) => void
  p2Name: string; setP2Name: (v: string) => void
  p2Avatar: AvatarKey; setP2Avatar: (k: AvatarKey) => void
  loading: boolean
  onBack: () => void
  onContinue: () => void
}

function CreateNamesStep({
  coupleName, setCoupleName,
  p1Name, setP1Name, p1Avatar, setP1Avatar,
  p2Name, setP2Name, p2Avatar, setP2Avatar,
  loading, onBack, onContinue,
}: CreateNamesStepProps) {
  const canContinue = p1Name.trim().length > 0 && p2Name.trim().length > 0

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="font-serif text-2xl text-warm-800 mb-1">Your couple</h2>
        <p className="text-sm text-warm-400">Set both names now — no re-entering later.</p>
      </div>

      {/* Optional couple name */}
      <Input
        label="Couple name (optional)"
        placeholder={p1Name && p2Name ? `${p1Name} & ${p2Name}` : 'e.g. Ana & Marcos'}
        value={coupleName}
        onChange={(e) => setCoupleName(e.target.value)}
      />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-cream-200" />
        <span className="text-xs text-warm-400 font-medium uppercase tracking-wide">Partners</span>
        <div className="flex-1 h-px bg-cream-200" />
      </div>

      {/* Partner 1 */}
      <div className="flex flex-col gap-3 rounded-3xl border border-cream-200 bg-white p-4">
        <span className="text-xs font-semibold text-warm-500 uppercase tracking-wide">Partner 1</span>
        <Input
          label="Name"
          placeholder="e.g. Ana"
          value={p1Name}
          onChange={(e) => setP1Name(e.target.value)}
          autoFocus
        />
        <AvatarPicker
          name={p1Name}
          value={p1Avatar}
          onChange={setP1Avatar}
          label="Color"
        />
      </div>

      {/* Partner 2 */}
      <div className="flex flex-col gap-3 rounded-3xl border border-cream-200 bg-white p-4">
        <span className="text-xs font-semibold text-warm-500 uppercase tracking-wide">Partner 2</span>
        <Input
          label="Name"
          placeholder="e.g. Marcos"
          value={p2Name}
          onChange={(e) => setP2Name(e.target.value)}
        />
        <AvatarPicker
          name={p2Name}
          value={p2Avatar}
          onChange={setP2Avatar}
          label="Color"
        />
      </div>

      <Button
        size="lg" fullWidth loading={loading}
        disabled={!canContinue}
        onClick={onContinue}
      >
        Create couple
        <ArrowRight size={16} />
      </Button>
      <button className="text-sm text-warm-400 text-center" onClick={onBack}>
        ← Back
      </button>
    </div>
  )
}

// ── Sub-screen: Who are you? ──────────────────────────────────────────────────

import { AvatarIcon } from '../ui/AvatarIcon'

interface WhoAreYouStepProps {
  session: Session
  onPick: (key: 'one' | 'two') => void
}

function WhoAreYouStep({ session, onPick }: WhoAreYouStepProps) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <h2 className="font-serif text-3xl text-warm-800 mb-1">Who are you?</h2>
        <p className="text-sm text-warm-400">
          Choose your identity — this device will remember it.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {([ ['one', session.partnerOneName, session.partnerOneAvatar],
            ['two', session.partnerTwoName, session.partnerTwoAvatar],
        ] as const).map(([key, name, avatar]) => (
          <button
            key={key}
            onClick={() => onPick(key)}
            className="flex items-center gap-4 rounded-3xl border-2 border-cream-200 bg-white
              p-4 hover:border-sand-400 hover:shadow-soft active:scale-[0.98]
              transition-all text-left"
          >
            <AvatarIcon name={name} avatarKey={avatar} size="lg" />
            <div>
              <p className="font-medium text-warm-800 text-base">{name}</p>
              <p className="text-xs text-warm-400 mt-0.5">I am {name}</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-warm-300" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Sub-screen: Show code ─────────────────────────────────────────────────────

function ShowCode({ code, coupleName }: { code: string; coupleName: string }) {
  const [copied, setCopied] = useState(false)
  // Session is already saved at this point — entering the app is automatic
  // once the user dismisses this screen (handled in App.tsx via session check)

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-center">
      <div>
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-sage-300/40 mb-3 mx-auto">
          <Check size={22} className="text-sage-600" />
        </div>
        <h2 className="font-serif text-2xl text-warm-800 mb-1">{coupleName}</h2>
        <p className="text-sm text-warm-400">Your couple is ready. Share this code with your partner.</p>
      </div>

      <button
        onClick={copy}
        className="mx-auto bg-cream-100 rounded-3xl px-8 py-5 border border-cream-300
          hover:bg-cream-200 transition-colors"
      >
        <div className="text-4xl font-serif font-medium tracking-[0.2em] text-warm-800 mb-2">
          {code}
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-warm-400">
          {copied
            ? <><Check size={12} className="text-sage-500" /> Copied!</>
            : <><Copy size={12} /> Tap to copy</>
          }
        </div>
      </button>

      <p className="text-xs text-warm-400 leading-relaxed">
        Your partner can enter this code and choose their name to join.
        The app will open automatically on this device.
      </p>
    </div>
  )
}
