import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

async function fetchProfiles(coupleId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Profile[]
}

export function useProfiles(coupleId: string) {
  return useQuery({
    queryKey: ['profiles', coupleId],
    queryFn: () => fetchProfiles(coupleId),
    enabled: !!coupleId,
    staleTime: 1000 * 60 * 5,
  })
}
