import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { Select } from '../ui/Select'
import { PlanImageUpload } from '../ui/ImageUpload'
import { useCreatePlan, useUpdatePlan } from '../../hooks/usePlans'
import { useCreateCategory } from '../../hooks/useCategories'
import type { Plan, Category, PlanPriority, PlanStatus, Session } from '../../types'

// ── Zod schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  category_id: z.string().optional(),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'normal', 'high']),
  status: z.enum(['pending', 'selected', 'completed', 'canceled']),
  budget_estimate: z.string().optional(),
  location_text: z.string().max(120).optional(),
  maps_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  instagram_ref: z.string().max(60).optional(),
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
      status: plan?.status ?? 'pending',
      budget_estimate: plan?.budget_estimate != null ? String(plan.budget_estimate) : '',
      location_text: plan?.location_text ?? '',
      maps_url: plan?.maps_url ?? '',
      instagram_ref: plan?.instagram_ref ?? '',
      is_someday: plan?.is_someday ?? true,
      ideal_date: plan?.ideal_date ?? '',
    },
  })

  const isSomeday = watch('is_someday')

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        name: values.name,
        category_id: values.category_id || null,
        description: values.description || null,
        priority: values.priority as PlanPriority,
        status: values.status as PlanStatus,
        budget_estimate: values.budget_estimate ? parseFloat(values.budget_estimate) : null,
        location_text: values.location_text || null,
        maps_url: values.maps_url || null,
        instagram_ref: values.instagram_ref || null,
        is_someday: values.is_someday,
        ideal_date: !values.is_someday && values.ideal_date ? values.ideal_date : null,
        images,
      }

      if (isEditing && plan) {
        await updatePlan.mutateAsync({ id: plan.id, coupleId: session.coupleId, payload })
        toast.success('Plan updated')
      } else {
        await createPlan.mutateAsync({
          ...payload,
          couple_id: session.coupleId,
          // Always 'one' or 'two' — never null on new plans
          proposed_by: session.partnerKey ?? 'one',
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-5 pb-8">
      <Input
        label="Plan name *"
        placeholder="e.g. Sunset dinner at the harbor"
        error={errors.name?.message}
        {...register('name')}
        autoFocus={!isEditing}
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

      <Textarea
        label="Description"
        placeholder="Any details, ideas, or notes…"
        {...register('description')}
        error={errors.description?.message}
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <Select label="Priority" {...register('priority')}>
            <option value="low">↓ Low</option>
            <option value="normal">Normal</option>
            <option value="high">↑ High</option>
          </Select>
        </div>
        {isEditing && (
          <div className="flex-1">
            <Select label="Status" {...register('status')}>
              <option value="pending">Pending</option>
              <option value="selected">Selected</option>
              <option value="completed">Done</option>
              <option value="canceled">Canceled</option>
            </Select>
          </div>
        )}
      </div>

      <Input
        label="Estimated budget"
        type="number"
        placeholder="e.g. 50"
        min={0}
        step={1}
        {...register('budget_estimate')}
        error={errors.budget_estimate?.message}
      />

      <Input
        label="Location"
        placeholder="e.g. Lisbon, Portugal"
        {...register('location_text')}
        error={errors.location_text?.message}
      />

      <Input
        label="Google Maps link"
        placeholder="https://maps.google.com/…"
        type="url"
        inputMode="url"
        {...register('maps_url')}
        error={errors.maps_url?.message}
      />

      <Input
        label="Instagram reference"
        placeholder="@username or post URL"
        {...register('instagram_ref')}
        error={errors.instagram_ref?.message}
      />

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative">
            <input type="checkbox" className="sr-only peer" {...register('is_someday')} />
            <div className="h-5 w-9 rounded-full bg-cream-200 peer-checked:bg-sand-500 transition-colors" />
            <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow
              transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm text-warm-700">Someday — no specific date</span>
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

      <PlanImageUpload
        coupleId={session.coupleId}
        planId={plan?.id}
        value={images}
        onChange={setImages}
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={isSubmitting || createPlan.isPending || updatePlan.isPending}
      >
        {isEditing ? 'Save changes' : 'Add plan'}
      </Button>
    </form>
  )
}
