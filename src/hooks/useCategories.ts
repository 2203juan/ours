import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'

// ── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchCategories(coupleId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('couple_id', coupleId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data as Category[]
}

// ── Query ────────────────────────────────────────────────────────────────────

export function useCategories(coupleId: string) {
  return useQuery({
    queryKey: ['categories', coupleId],
    queryFn: () => fetchCategories(coupleId),
    enabled: !!coupleId,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      coupleId,
      name,
      emoji,
    }: {
      coupleId: string
      name: string
      emoji: string
    }) => {
      // Get next sort_order
      const { data: existing } = await supabase
        .from('categories')
        .select('sort_order')
        .eq('couple_id', coupleId)
        .order('sort_order', { ascending: false })
        .limit(1)

      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

      const { data, error } = await supabase
        .from('categories')
        .insert({ couple_id: coupleId, name, emoji, sort_order: nextOrder })
        .select()
        .single()
      if (error) throw error
      return data as Category
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['categories', variables.coupleId] })
    },
  })
}
