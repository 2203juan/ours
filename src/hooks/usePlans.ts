import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, PLAN_IMAGES_BUCKET, deleteFileByUrl } from '../lib/supabase'
import type { Plan, PlanFilters, CreatePlanPayload, UpdatePlanPayload, PartnerKey } from '../types'
import { ACTIVITIES_KEY } from './useActivities'

const QUERY_KEY = 'plans'

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
  return plans.filter((p) => {
    if (filters.categoryId !== 'all' && p.category_id !== filters.categoryId) return false
    if (filters.proposedBy !== 'all' && p.proposed_by !== (filters.proposedBy as string)) return false
    return true
  })
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, data.couple_id] })
      qc.invalidateQueries({ queryKey: [ACTIVITIES_KEY, data.couple_id] })
    },
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
      return { plan: data as Plan, coupleId }
    },
    onSuccess: ({ coupleId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] })
    },
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
    onSuccess: (coupleId) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] })
    },
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if proposed_by is a valid PartnerKey */
export function isValidProposer(v: string | null): v is PartnerKey {
  return v === 'one' || v === 'two'
}
