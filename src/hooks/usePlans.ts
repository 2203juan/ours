import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase, PLAN_IMAGES_BUCKET, deleteFileByUrl } from '../lib/supabase'
import type {
  Plan, Category, PlanFilters, PlanSort, PlanPriority,
  CreatePlanPayload, UpdatePlanPayload, PartnerKey,
} from '../types'
import { isMutual } from '../types'
import { ACTIVITIES_KEY } from './useActivities'

const QUERY_KEY = 'plans'

/** Cache key for a couple's plans — shared by the query and every optimistic write. */
const plansKey = (coupleId: string) => [QUERY_KEY, coupleId] as const

/** Context handed from onMutate to onError so a failed mutation can roll back. */
interface RollbackContext {
  previous: Plan[] | undefined
  coupleId: string
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchPlans(coupleId: string): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select(`*, category:categories(*)`)
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Plan[]
}

// ── Query ────────────────────────────────────────────────────────────────────

export function usePlans(coupleId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId],
    queryFn: () => fetchPlans(coupleId),
    enabled: !!coupleId,
  })
}

// ── Client-side filter ───────────────────────────────────────────────────────

export function filterPlans(plans: Plan[], filters: PlanFilters): Plan[] {
  const query = filters.search.trim().toLowerCase()

  return plans.filter((p) => {
    if (filters.categoryId !== 'all' && p.category_id !== filters.categoryId) return false
    if (filters.proposedBy !== 'all' && p.proposed_by !== (filters.proposedBy as string)) return false
    if (filters.mutualOnly && !isMutual(p)) return false
    if (query) {
      const haystack = [p.name, p.description, p.location_text, p.category?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}

// ── Client-side sort ─────────────────────────────────────────────────────────

const PRIORITY_RANK: Record<PlanPriority, number> = { high: 0, normal: 1, low: 2 }

/** Newest first — the app's baseline order and the tiebreaker for every sort. */
const byNewest = (a: Plan, b: Plan) => b.created_at.localeCompare(a.created_at)

/** A plan's effective date, or null when it's a "someday" plan. */
const effectiveDate = (p: Plan) => (!p.is_someday && p.ideal_date ? p.ideal_date : null)

/**
 * Compare two nullable values, always pushing nulls to the end regardless of
 * direction. Returns null when both sides are null so the caller can fall
 * through to the newest-first tiebreaker.
 */
function compareNullable(a: number | null, b: number | null, dir: 1 | -1): number | null {
  if (a == null && b == null) return null
  if (a == null) return 1
  if (b == null) return -1
  return a === b ? null : (a - b) * dir
}

export function sortPlans(plans: Plan[], sort: PlanSort): Plan[] {
  const out = [...plans]

  switch (sort) {
    case 'priority':
      return out.sort(
        (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byNewest(a, b)
      )

    case 'wanted':
      // What you both want floats to the top — a far better signal than the
      // priority someone set by hand when they created the plan.
      return out.sort(
        (a, b) => b.hearted_by.length - a.hearted_by.length || byNewest(a, b)
      )

    case 'date':
      return out.sort((a, b) => {
        const [ad, bd] = [effectiveDate(a), effectiveDate(b)]
        if (ad == null && bd == null) return byNewest(a, b)
        if (ad == null) return 1
        if (bd == null) return -1
        return ad.localeCompare(bd) || byNewest(a, b)
      })

    case 'budget':
      return out.sort(
        (a, b) => compareNullable(a.budget_estimate, b.budget_estimate, 1) ?? byNewest(a, b)
      )

    case 'rating':
      return out.sort(
        (a, b) => compareNullable(a.maps_rating, b.maps_rating, -1) ?? byNewest(a, b)
      )

    case 'recent':
    default:
      return out.sort(byNewest)
  }
}

// ── Optimistic cache helpers ─────────────────────────────────────────────────

/** Resolve the joined `category` relation from the categories cache. */
function resolveCategory(
  qc: QueryClient,
  coupleId: string,
  categoryId: string | null | undefined
): Category | undefined {
  if (!categoryId) return undefined
  const categories = qc.getQueryData<Category[]>(['categories', coupleId])
  return categories?.find((c) => c.id === categoryId)
}

/**
 * Snapshot the plans cache and apply `update` to it. The returned context is
 * passed to onError so the snapshot can be restored on failure.
 */
async function optimisticallyWrite(
  qc: QueryClient,
  coupleId: string,
  update: (plans: Plan[]) => Plan[]
): Promise<RollbackContext> {
  await qc.cancelQueries({ queryKey: plansKey(coupleId) })
  const previous = qc.getQueryData<Plan[]>(plansKey(coupleId))
  if (previous) qc.setQueryData<Plan[]>(plansKey(coupleId), update(previous))
  return { previous, coupleId }
}

function rollback(qc: QueryClient, ctx: RollbackContext | undefined) {
  if (ctx?.previous) qc.setQueryData<Plan[]>(plansKey(ctx.coupleId), ctx.previous)
}

function invalidate(qc: QueryClient, coupleId: string) {
  qc.invalidateQueries({ queryKey: plansKey(coupleId) })
  qc.invalidateQueries({ queryKey: [ACTIVITIES_KEY, coupleId] })
}

// ── Create ───────────────────────────────────────────────────────────────────

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ actorName, ...payload }: CreatePlanPayload & { actorName?: string }) => {
      const { data, error } = await supabase
        .from('plans')
        .insert(payload)
        .select(`*, category:categories(*)`)
        .single()
      if (error) throw error

      // Fire-and-forget: create activity record (non-fatal if it fails)
      if (actorName) {
        supabase.from('activities').insert({
          couple_id: payload.couple_id,
          type: 'plan_created',
          actor_name: actorName,
          plan_id: (data as Plan).id,
          plan_name: payload.name,
        }).then()
      }

      return data as Plan
    },
    onMutate: ({ actorName: _actorName, ...payload }) => {
      const now = new Date().toISOString()
      const optimistic: Plan = {
        id: `optimistic-${now}-${Math.random().toString(36).slice(2, 8)}`,
        couple_id: payload.couple_id,
        category_id: payload.category_id,
        proposed_by: payload.proposed_by,
        name: payload.name,
        description: payload.description ?? null,
        status: 'to_do',
        priority: payload.priority,
        budget_estimate: payload.budget_estimate ?? null,
        location_text: payload.location_text ?? null,
        maps_url: payload.maps_url ?? null,
        maps_rating: payload.maps_rating ?? null,
        instagram_ref: payload.instagram_ref ?? null,
        tiktok_url: payload.tiktok_url ?? null,
        menu_url: payload.menu_url ?? null,
        completion_note: null,
        ideal_date: payload.ideal_date ?? null,
        is_someday: payload.is_someday,
        images: payload.images,
        hearted_by: payload.hearted_by ?? [],
        created_at: now,
        completed_at: null,
        updated_at: now,
        category: resolveCategory(qc, payload.couple_id, payload.category_id),
      }
      return optimisticallyWrite(qc, payload.couple_id, (plans) => [optimistic, ...plans])
    },
    onError: (_err, _vars, ctx) => rollback(qc, ctx),
    onSettled: (_data, _err, vars) => invalidate(qc, vars.couple_id),
  })
}

// ── Update ───────────────────────────────────────────────────────────────────

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      coupleId,
      payload,
    }: {
      id: string
      coupleId: string
      payload: UpdatePlanPayload
    }) => {
      const { data, error } = await supabase
        .from('plans')
        .update(payload)
        .eq('id', id)
        .select(`*, category:categories(*)`)
        .single()
      if (error) throw error

      // Fire-and-forget: keep activity plan_name in sync when the plan is renamed
      if (payload.name) {
        supabase
          .from('activities')
          .update({ plan_name: payload.name })
          .eq('plan_id', id)
          .then()
      }

      return { plan: data as Plan, coupleId }
    },
    onMutate: ({ id, coupleId, payload }) =>
      optimisticallyWrite(qc, coupleId, (plans) =>
        plans.map((p) => {
          if (p.id !== id) return p
          const next: Plan = { ...p, ...payload, updated_at: new Date().toISOString() }
          // Keep the joined relation in sync when the category itself changed
          if ('category_id' in payload) {
            next.category = resolveCategory(qc, coupleId, payload.category_id)
          }
          return next
        })
      ),
    onError: (_err, _vars, ctx) => rollback(qc, ctx),
    onSettled: (_data, _err, vars) => invalidate(qc, vars.coupleId),
  })
}

// ── Delete ───────────────────────────────────────────────────────────────────

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ plan }: { plan: Plan }) => {
      for (const url of plan.images) {
        await deleteFileByUrl(PLAN_IMAGES_BUCKET, url)
      }
      const { error } = await supabase.from('plans').delete().eq('id', plan.id)
      if (error) throw error
      return plan.couple_id
    },
    onMutate: ({ plan }) =>
      optimisticallyWrite(qc, plan.couple_id, (plans) =>
        plans.filter((p) => p.id !== plan.id)
      ),
    onError: (_err, _vars, ctx) => rollback(qc, ctx),
    onSettled: (_data, _err, vars) => invalidate(qc, vars.plan.couple_id),
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if proposed_by is a valid PartnerKey */
export function isValidProposer(v: string | null): v is PartnerKey {
  return v === 'one' || v === 'two'
}
