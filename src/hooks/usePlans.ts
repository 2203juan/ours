import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { PLAN_IMAGES_BUCKET, deleteFileByUrl } from '../lib/supabase'
import type { Plan, PlanFilters, CreatePlanPayload, UpdatePlanPayload } from '../types'

const QUERY_KEY = 'plans'

// ── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchPlans(coupleId: string): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select(
      `*,
       category:categories(*),
       proposer:profiles(*)`
    )
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
    if (filters.status !== 'all' && p.status !== filters.status) return false
    if (filters.categoryId !== 'all' && p.category_id !== filters.categoryId) return false
    if (filters.proposedBy !== 'all' && p.proposed_by !== filters.proposedBy) return false
    return true
  })
}

// ── Create ───────────────────────────────────────────────────────────────────

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreatePlanPayload) => {
      const { data, error } = await supabase
        .from('plans')
        .insert(payload)
        .select(`*, category:categories(*), proposer:profiles(*)`)
        .single()
      if (error) throw error
      return data as Plan
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, data.couple_id] })
    },
  })
}

// ── Update ───────────────────────────────────────────────────────────────────

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, coupleId, payload }: { id: string; coupleId: string; payload: UpdatePlanPayload }) => {
      const { data, error } = await supabase
        .from('plans')
        .update(payload)
        .eq('id', id)
        .select(`*, category:categories(*), proposer:profiles(*)`)
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
      // Delete associated images from storage (best-effort)
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
