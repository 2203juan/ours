import { useState } from 'react'
import { Shuffle, RefreshCw, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Plan, Category } from '../../types'
import { pickRandom } from '../../lib/utils'
import { useUpdatePlan } from '../../hooks/usePlans'
import { Avatar } from '../ui/Avatar'
import { StatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

interface SurpriseFeatureProps {
  plans: Plan[]
  categories: Category[]
  coupleId: string
}

export function SurpriseFeature({ plans, categories, coupleId }: SurpriseFeatureProps) {
  const updatePlan = useUpdatePlan()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all')
  const [result, setResult] = useState<Plan | null>(null)
  const [spinning, setSpinning] = useState(false)

  const pendingPlans = plans.filter(
    (p) =>
      p.status === 'pending' &&
      (selectedCategoryId === 'all' || p.category_id === selectedCategoryId)
  )

  const spin = () => {
    const picked = pickRandom(pendingPlans)
    if (!picked) {
      toast("No pending plans in that category 🍂", { icon: '🌿' })
      return
    }
    setSpinning(true)
    setResult(null)
    setTimeout(() => {
      setResult(picked)
      setSpinning(false)
    }, 600)
  }

  const handleSelect = async () => {
    if (!result) return
    try {
      await updatePlan.mutateAsync({
        id: result.id,
        coupleId,
        payload: { status: 'selected' },
      })
      toast.success('Plan selected! Time to make it happen 🌟')
      setResult(null)
    } catch {
      toast.error('Could not update plan.')
    }
  }

  return (
    <div className="flex flex-col px-5 gap-6 pt-2 pb-10">
      {/* Category chips */}
      <div>
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wide mb-3">
          Pick from a category
        </p>
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            label="All plans"
            emoji="✨"
            active={selectedCategoryId === 'all'}
            count={plans.filter((p) => p.status === 'pending').length}
            onClick={() => setSelectedCategoryId('all')}
          />
          {categories.map((c) => {
            const count = plans.filter(
              (p) => p.status === 'pending' && p.category_id === c.id
            ).length
            return (
              <CategoryChip
                key={c.id}
                label={c.name}
                emoji={c.emoji}
                active={selectedCategoryId === c.id}
                count={count}
                onClick={() => setSelectedCategoryId(c.id)}
              />
            )
          })}
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={pendingPlans.length === 0}
        className={cn(
          'mx-auto h-28 w-28 rounded-full flex flex-col items-center justify-center gap-2',
          'bg-gradient-to-br from-sand-400 to-blush-300 text-white shadow-card',
          'transition-transform active:scale-95 hover:scale-105',
          'disabled:opacity-40 disabled:pointer-events-none',
          spinning && 'animate-spin-slow'
        )}
      >
        {spinning ? (
          <RefreshCw size={28} className="animate-spin" />
        ) : (
          <>
            <Shuffle size={28} />
            <span className="text-xs font-semibold tracking-wide">Surprise us</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-warm-400">
        {pendingPlans.length === 0
          ? 'No pending plans here.'
          : `${pendingPlans.length} pending plan${pendingPlans.length !== 1 ? 's' : ''} to choose from`}
      </p>

      {/* Result card */}
      {result && !spinning && (
        <div className="rounded-3xl border border-cream-200 bg-white shadow-soft overflow-hidden animate-fade-in">
          {result.images.length > 0 && (
            <img
              src={result.images[0]}
              alt={result.name}
              className="w-full h-40 object-cover"
            />
          )}
          <div className="p-5 flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={result.status} />
                {result.category && (
                  <span className="text-xs text-warm-400">
                    {result.category.emoji} {result.category.name}
                  </span>
                )}
              </div>
              <h3 className="font-serif text-2xl text-warm-800">{result.name}</h3>
              {result.description && (
                <p className="text-sm text-warm-500 mt-1 line-clamp-2">{result.description}</p>
              )}
            </div>

            {result.proposer && (
              <div className="flex items-center gap-2 text-sm text-warm-500">
                <Avatar name={result.proposer.name} url={result.proposer.avatar_url} size="xs" />
                <span>by {result.proposer.name}</span>
              </div>
            )}

            <div className="flex gap-2 mt-1">
              <Button
                variant="primary"
                size="md"
                onClick={handleSelect}
                loading={updatePlan.isPending}
                className="flex-1"
              >
                <Check size={16} />
                Let's do this!
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={spin}
                disabled={pendingPlans.length <= 1}
              >
                <RefreshCw size={14} />
                Another
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Category chip ─────────────────────────────────────────────────────────────

function CategoryChip({
  label,
  emoji,
  active,
  count,
  onClick,
}: {
  label: string
  emoji: string
  active: boolean
  count: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all',
        active
          ? 'bg-warm-800 text-white shadow-sm'
          : 'bg-cream-100 text-warm-600 hover:bg-cream-200',
        count === 0 && 'opacity-40'
      )}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {count > 0 && (
        <span
          className={cn(
            'text-[10px] rounded-full px-1.5 py-0.5 font-semibold',
            active ? 'bg-white/20 text-white' : 'bg-warm-200 text-warm-500'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
