import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

/**
 * Hook to fetch a single event by ID
 */
export function useEvent(eventId) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(id, name, avatar_url),
          org:orgs(id, name, avatar_url),
          ticket_types:event_ticket_types(*),
          attendance:event_attendance(
            id,
            user_id,
            status,
            ticket_type_id,
            is_host,
            user:profiles(id, name, avatar_url)
          ),
          attendees_count:event_attendance(count)
        `)
        .eq('id', eventId)
        .single()

      if (error) throw error

      // Transform data
      return {
        ...data,
        attendees_count: Array.isArray(data.attendees_count)
          ? data.attendees_count[0]?.count || 0
          : data.attendees_count || 0,
      }
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

