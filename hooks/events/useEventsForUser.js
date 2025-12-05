import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

/**
 * Hook to fetch events for a user
 * Returns events the user can see based on visibility rules
 */
export function useEventsForUser(userId) {
  return useQuery({
    queryKey: ['eventsForUser', userId],
    queryFn: async () => {
      // Get user's org memberships
      const { data: orgMemberships } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', userId)

      const orgIds = orgMemberships?.map((m) => m.org_id) || []

      // Get events user is attending
      const { data: attendance } = await supabase
        .from('event_attendance')
        .select('event_id')
        .eq('user_id', userId)
        .in('status', ['going', 'approved', 'maybe', 'requested'])

      const attendingEventIds = attendance?.map((a) => a.event_id) || []

      // Query events
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          org:orgs(id, name, avatar_url),
          ticket_types:event_ticket_types(*),
          attendees_count:event_attendance(count)
        `)
        .or(
          `visibility.eq.public,visibility.eq.school,${
            orgIds.length > 0
              ? `and(visibility.eq.org_only,org_id.in.(${orgIds.join(',')}))`
              : 'id.eq.00000000-0000-0000-0000-000000000000' // Empty condition if no orgs
          }`
        )
        .order('start_at', { ascending: true })

      if (error) throw error

      // Also get invite-only events user is invited to or attending
      const { data: inviteOnlyEvents } = await supabase
        .from('events')
        .select(`
          *,
          org:orgs(id, name, avatar_url),
          ticket_types:event_ticket_types(*),
          attendees_count:event_attendance(count)
        `)
        .eq('visibility', 'invite_only')
        .or(
          `id.in.(${attendingEventIds.join(',') || '00000000-0000-0000-0000-000000000000'})`
        )
        .order('start_at', { ascending: true })

      // Combine and deduplicate
      const allEvents = [...(events || []), ...(inviteOnlyEvents || [])]
      const uniqueEvents = Array.from(
        new Map(allEvents.map((e) => [e.id, e])).values()
      )

      // Transform attendees_count from array to number
      return uniqueEvents.map((event) => ({
        ...event,
        attendees_count: Array.isArray(event.attendees_count)
          ? event.attendees_count[0]?.count || 0
          : event.attendees_count || 0,
      }))
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

