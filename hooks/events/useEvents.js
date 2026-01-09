/**
 * Hook to fetch events from Supabase
 * Replaces useMockEvents.js
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

/**
 * Fetch events for the current user's university
 */
export function useEvents(filters = {}) {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['events', filters, user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to view events')
      }

      // Get user's university
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        throw profileError
      }

      if (!profile?.university_id) {
        return []
      }

      // Build query
      let query = supabase
        .from('uri_events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url),
          created_by_profile:profiles!events_created_by_fkey(id, full_name, avatar_url)
        `)
        .order('start_at', { ascending: true })

      // Apply filters
      if (filters.date) {
        query = query.gte('start_at', filters.date)
      }
      
      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility)
      }
      
      // Filter by university (through organizer's university)
      // Note: This assumes events are created by users from same university
      // You may need to add university_id directly to events table if needed

      const { data, error } = await query

      if (error) {
        console.error('Error fetching events:', error)
        throw error
      }

      // Transform data to match component expectations
      return (data || []).map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location_name,
        startDate: event.start_at,
        endDate: event.end_at,
        category: event.category || 'campus',
        isPublic: event.visibility === 'public',
        maxAttendees: event.max_attendees,
        requireApproval: event.requires_approval || false,
        allowPlusOnes: event.allow_plus_ones || false,
        coverImage: event.cover_image_url,
        organizer: event.organizer ? {
          id: event.organizer.id,
          name: event.organizer.full_name,
          avatar: event.organizer.avatar_url
        } : null,
        createdAt: event.created_at,
        // Add attendance data if needed (separate query)
        attendees: [],
        interested: [],
        comments: [],
      }))
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  })
}

/**
 * Fetch a single event by ID
 */
export function useEvent(eventId) {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['event', eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user) {
        throw new Error('Event ID and user are required')
      }

      const { data, error } = await supabase
        .from('uri_events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url),
          created_by_profile:profiles!events_created_by_fkey(id, full_name, avatar_url)
        `)
        .eq('id', eventId)
        .single()

      if (error) {
        console.error('Error fetching event:', error)
        throw error
      }

      if (!data) return null

      // Transform to match component expectations
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        location: data.location_name,
        startDate: data.start_at,
        endDate: data.end_at,
        category: data.category || 'campus',
        isPublic: data.visibility === 'public',
        maxAttendees: data.max_attendees,
        requireApproval: data.requires_approval || false,
        allowPlusOnes: data.allow_plus_ones || false,
        coverImage: data.cover_image_url,
        organizer: data.organizer ? {
          id: data.organizer.id,
          name: data.organizer.full_name,
          avatar: data.organizer.avatar_url
        } : null,
        createdAt: data.created_at,
      }
    },
    enabled: !!eventId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}







