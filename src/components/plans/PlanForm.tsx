import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { Select } from '../ui/Select'
import { PlanImageUpload } from '../ui/ImageUpload'
import { useCreatePlan, useUpdatePlan } from '../../hooks/usePlans'
import { useCreateCategory } from '../../hooks/useCategories'
import { normalizeSocialUrl, isFoodCategory, cn } from '../../lib/utils'
import type { Plan, Category, PlanPriority, Session } from '../../types'

// ── Zod schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  category_id: z.string().optional(),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'normal', 'high']),
  location_text: z.string().max(120).optional(),
  maps_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  menu_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  instagram_ref: z.string().max(200).optional(),
  tiktok_url: z.string().max(200).optional(),
  is_someday: z.boolean(),
  ideal_date: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface PlanFormProps {
  session: Session
  categories: Category[]
  plan?: Plan
  onDone: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PlanForm({ session, categories, plan, onDone }: PlanFormProps) {
  const isEditing = !!plan
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const createCategory = useCreateCategory()

  const [images, setImages] = useState<string[]>(plan?.images ?? [])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('✨')

  // COP budget managed as local state outside RHF for live comma formatting
  const [budgetDisplay, setBudgetDisplay] = useState<string>(
    plan?.budget_estimate != null ? plan.budget_estimate.toLocaleString('en-US') : ''
  )

  // Auto-expand details when editing a plan that has detail fields filled
  const [showDetails, setShowDetails] = useState(() => {
    if (!plan) return false
    return !!(
      plan.description ||
      plan.budget_estimate != null ||
      plan.location_text ||
      plan.instagram_ref ||
      plan.tiktok_url ||
      plan.images.length > 0 ||
      plan.priority !== 'normal' ||
      !plan.is_someday
    )
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: plan?.name ?? '',
      category_id: plan?.category_id ?? '',
      description: plan?.description ?? '',
      priority: plan?.priority ?? 'normal',
      location_text: plan?.location_text ?? '',
      maps_url: plan?.maps_url ?? '',
      menu_url: plan?.menu_url ?? '',
      instagram_ref: plan?.instagram_ref ?? '',
      tiktok_url: plan?.tiktok_url ?? '',
      is_someday: plan?.is_someday ?? true,
      ideal_date: plan?.ideal_date ?? '',
    },
  })

  const isSomeday = watch('is_someday')
  const selectedCategoryId = watch('category_id')
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const showMenuUrl = selectedCategory
    ? isFoodCategory(selectedCategory.name, selectedCategory.emoji)
    : false

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    if (!raw) { setBudgetDisplay(''); return }
    setBudgetDisplay(Number(raw).toLocaleString('en-US'))
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const budgetRaw = budgetDisplay.replace(/[^0-9]/g, '')
      const payload = {
        name: values.name,
        category_id: values.category_id || null,
        description: values.description || null,
        priority: values.priority as PlanPriority,
        budget_estimate: budgetRaw ? parseFloat(budgetRaw) : null,
        location_text: values.location_text || null,
        maps_url: values.maps_url || null,
        menu_url: values.menu_url || null,
        instagram_ref: values.instagram_ref
          ? normalizeSocialUrl(values.instagram_ref, 'instagram')
          : null,
        tiktok_url: values.tiktok_url
          ? normalizeSocialUrl(values.tiktok_url, 'tiktok')
          : null,
        is_someday: values.is_someday,
        ideal_date: !values.is_someday && values.ideal_date ? values.ideal_date : null,
        images,
      }

      if (isEditing && plan) {
        await updatePlan.mutateAsync({ id: plan.id, coupleId: session.coupleId, payload })
        toast.success('Plan updated')
      } else {
        const effectiveKey = session.partnerKey ?? 'one'
        await createPlan.mutateAsync({
          ...payload,
          couple_id: session.coupleId,
          proposed_by: effectiveKey,
          actorName: effectiveKey === 'one' ? session.partnerOneName : session.partnerTwoName,
        })
        toast.success('Plan added ✨')
      }
      onDone()
    } catch (e) {
      toast.error('Something went wrong.')
      console.error(e)
    }
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    try {
      const cat = await createCategory.mutateAsync({
        coupleId: session.coupleId,
        name: newCatName.trim(),
        emoji: newCatEmoji || '✨',
      })
      setValue('category_id', cat.id)
      setShowNewCategory(false)
      setNewCatName('')
      setNewCatEmoji('✨')
      toast.success(`Category "${cat.name}" created`)
    } catch {
      toast.error('Could not create category.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 px-5 pb-8">

      {/* ── Quick fields ── */}
      <Input
        label="Plan name *"
        placeholder="e.g. Sunset dinner at the harbor"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Category */}
      <div className="flex flex-col gap-1">
        <Select label="Category" {...register('category_id')}>
          <option value="">— No category —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </Select>
        {!showNewCategory ? (
          <button
            type="button"
            onClick={() => setShowNewCategory(true)}
            className="flex items-center gap-1 text-xs text-sand-500 mt-1 self-start"
          >
            <Plus size={12} />
            New category
          </button>
        ) : (
          <div className="flex gap-2 mt-1">
            <input
              placeholder="emoji"
              value={newCatEmoji}
              onChange={(e) => setNewCatEmoji(e.target.value)}
              className="w-14 rounded-xl border border-cream-300 px-2 py-2 text-center text-sm
                focus:outline-none focus:ring-2 focus:ring-sand-400"
              maxLength={2}
            />
            <input
              placeholder="Category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 rounded-xl border border-cream-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-sand-400"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={createCategory.isPending}
              className="px-3 py-2 bg-sand-500 text-white rounded-xl text-sm font-medium
                hover:bg-sand-600 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowNewCategory(false)}
              className="px-3 py-2 bg-cream-100 text-warm-600 rounded-xl text-sm
                hover:bg-cream-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <Input
        label="Location"
        placeholder="Paste a Google Maps link"
        type="url"
        inputMode="url"
        {...register('maps_url')}
        error={errors.maps_url?.message}
      />

      {/* Menu URL — only for food/restaurant categories */}
      {showMenuUrl && (
        <Input
          label="Menu"
          placeholder="Link to the menu"
          type="url"
          inputMode="url"
          {...register('menu_url')}
          error={errors.menu_url?.message}
        />
      )}

      {/* ── Details toggle ── */}
      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="flex items-center gap-3 -my-1 group"
      >
        <div className="flex-1 h-px bg-cream-200" />
        <span className="flex items-center gap-1 text-xs text-warm-400
          group-hover:text-warm-600 transition-colors shrink-0">
          {showDetails ? 'Less details' : 'Add more details'}
          <ChevronDown
            size={13}
            className={cn('transition-transform duration-300', showDetails && 'rotate-180')}
          />
        </span>
        <div className="flex-1 h-px bg-cream-200" />
      </button>

      {/* ── Collapsible details ── */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out -mt-1',
          showDetails ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-6 pb-1">

            <Textarea
              label="Description"
              placeholder="Any details, ideas, or notes…"
              {...register('description')}
              error={errors.description?.message}
            />

            {/* COP budget — controlled input with comma formatting */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-warm-500">Approx budget</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-warm-400
                  pointer-events-none select-none">
                  COP
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetDisplay}
                  onChange={handleBudgetChange}
                  placeholder="0"
                  className="w-full rounded-2xl border border-cream-300 pl-12 pr-4 py-3 text-sm
                    text-warm-800 placeholder:text-warm-300
                    focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent
                    transition-shadow"
                />
              </div>
            </div>

            <Input
              label="Zone/Neighborhood"
              placeholder="e.g. Lisbon, Portugal"
              {...register('location_text')}
              error={errors.location_text?.message}
            />

            <Input
              label="Instagram"
              placeholder="@username or instagram.com/…"
              inputMode="url"
              {...register('instagram_ref')}
              error={errors.instagram_ref?.message}
            />

            <Input
              label="TikTok"
              placeholder="@username or tiktok.com/…"
              inputMode="url"
              {...register('tiktok_url')}
              error={errors.tiktok_url?.message}
            />

            <PlanImageUpload
              coupleId={session.coupleId}
              planId={plan?.id}
              value={images}
              onChange={setImages}
            />

            <Select label="Priority" {...register('priority')}>
              <option value="low">↓ Low</option>
              <option value="normal">Normal</option>
              <option value="high">↑ High</option>
            </Select>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-5 cursor-pointer">
                <div className="relative shrink-0 h-5 w-9">
                  <input type="checkbox" className="sr-only peer" {...register('is_someday')} />
                  <div className="h-5 w-9 rounded-full bg-cream-200 peer-checked:bg-sand-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow
                    transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm text-warm-700 leading-snug">No specific date</span>
              </label>

              {!isSomeday && (
                <Input
                  label="Ideal date"
                  type="date"
                  {...register('ideal_date')}
                  error={errors.ideal_date?.message}
                />
              )}
            </div>

          </div>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={isSubmitting || createPlan.isPending || updatePlan.isPending}
      >
        {isEditing ? 'Save changes' : 'Save plan'}
      </Button>
    </form>
  )
}
