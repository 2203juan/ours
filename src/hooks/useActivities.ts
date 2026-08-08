import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Activity } from '../types'

export const ACTIVITIES_KEY = 'activities'

export function useActivities(coupleId: string) {
  return useQuery({
    queryKey: [ACTIVITIES_KEY, coupleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        // Deep enough for the Recent list and for the unseen badge to give a
        // useful count rather than capping at a handful.
        .limit(20)
      if (error) throw error
      return data as Activity[]
    },
    enabled: !!coupleId,
  })
}
