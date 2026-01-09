import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

// Helpers for common Supabase RLS recursion error
const isRlsRecursionError = (error) =>
  error?.code === '42P17' || error?.message?.toLowerCase()?.includes('infinite recursion')

const logRlsFixHint = (table = 'event_attendance') => {
  console.warn(`⚠️ RLS recursion detected on ${table} – using fallback query`)
  console.warn('💡 Fix the RLS policy on event_attendance table in Supabase to resolve this')
  console.warn('💡 The event will still load, but attendance details may be limited')
}

/**
 * Hook to fetch a single event by ID
 */
export function useEvent(eventId) {
  // Normalize eventId - ensure it's a string and handle array/undefined cases
  const normalizedId = eventId 
    ? (Array.isArray(eventId) ? String(eventId[0]) : String(eventId))
    : null
  
  return useQuery({
    queryKey: ['event', normalizedId],
    queryFn: async () => {
      if (!normalizedId) {
        console.warn('⚠️ useEvent - No eventId provided')
        throw new Error('Event ID is required')
      }

      console.log('🔍 useEvent - Fetching event with ID:', normalizedId, 'type:', typeof normalizedId)

      // Try full query with attendance first
      let query = supabase
        .from('uri_events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url),
          org:orgs(id, name),
          ticket_types:event_ticket_types(*),
          attendance:event_attendance(
            id,
            user_id,
            status,
            ticket_type_id,
            is_host,
            user:profiles(id, full_name, avatar_url)
          ),
          attendees_count:event_attendance(count)
        `)
        .eq('id', normalizedId)
        .single()

      let { data, error } = await query

      // If RLS recursion error, fall back to simpler query without attendance
      if (error && isRlsRecursionError(error)) {
        logRlsFixHint('event_attendance')
        console.warn('⚠️ Falling back to simpler query without attendance join')
        
        // Try without attendance join
        query = supabase
          .from('uri_events')
          .select(`
            *,
            organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url),
            org:orgs(id, name),
            ticket_types:event_ticket_types(*)
          `)
          .eq('id', normalizedId)
          .single()

        const result = await query
        data = result.data
        error = result.error

        // If still error, try even simpler query
        if (error && isRlsRecursionError(error)) {
          console.warn('⚠️ Trying minimal query without any joins')
          query = supabase
            .from('uri_events')
            .select('*')
            .eq('id', normalizedId)
            .single()

          const minimalResult = await query
          data = minimalResult.data
          error = minimalResult.error
        }
      }

      if (error) {
        console.error('❌ useEvent - Supabase error:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      if (!data) {
        console.warn('⚠️ useEvent - No data returned for event ID:', normalizedId)
        return null
      }

      console.log('✅ useEvent - Event fetched successfully:', { id: data.id, title: data.title })

      // Transform data
      return {
        ...data,
        attendance: data.attendance || [],
        attendees_count: Array.isArray(data.attendees_count)
          ? data.attendees_count[0]?.count || 0
          : data.attendees_count || 0,
      }
    },
    enabled: !!normalizedId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  })
}
