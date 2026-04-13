import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * Subscribe to real-time changes for a couple's plans and profiles.
 * Invalidates the corresponding queries when Supabase pushes an update.
 */
export function useRealtime(coupleId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!coupleId) return

    const channel = supabase
      .channel(`couple-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plans',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['plans', coupleId] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['profiles', coupleId] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['categories', coupleId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [coupleId, qc])
}
