import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

/**
 * Hook to fetch profiles for Yearbook
 * Returns profiles from the same university as the current user
 * Respects RLS policies (campus isolation)
 */
export function useProfiles(filters = {}) {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['profiles', filters, user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to view profiles')
      }

      // Get user's university first to filter profiles
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.university_id) {
        return []
      }

      console.log('🎓 Fetching yearbook profiles for university:', userProfile.university_id)

      // Build query - simplified to avoid RLS recursion
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          username,
          bio,
          avatar_url,
          age,
          grade,
          gender,
          major,
          graduation_year,
          interests,
          personality_tags,
          yearbook_visible,
          onboarding_complete,
          created_at,
          university_id
        `)
        .eq('university_id', userProfile.university_id) // Filter by same university
        .or('yearbook_visible.eq.true,yearbook_visible.is.null') // Show if visible or not set
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.graduationYear) {
        query = query.eq('graduation_year', filters.graduationYear)
      }

      if (filters.grade) {
        query = query.eq('grade', filters.grade)
      }

      if (filters.major) {
        query = query.eq('major', filters.major)
      }

      if (filters.gender) {
        query = query.eq('gender', filters.gender)
      }

      if (filters.searchQuery) {
        const search = filters.searchQuery.toLowerCase().trim()
        query = query.or(`full_name.ilike.%${search}%,major.ilike.%${search}%,bio.ilike.%${search}%`)
      }

      // Age filter (if provided)
      if (filters.ageMin || filters.ageMax) {
        if (filters.ageMin) {
          query = query.gte('age', filters.ageMin)
        }
        if (filters.ageMax) {
          query = query.lte('age', filters.ageMax)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error fetching profiles:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length || 0} profiles for yearbook`)

      // Get university name separately to avoid RLS recursion
      const universityIds = [...new Set((data || []).map(p => p.university_id).filter(Boolean))]
      let universitiesMap = {}
      if (universityIds.length > 0) {
        const { data: universities } = await supabase
          .from('universities')
          .select('id, name')
          .in('id', universityIds)
        if (universities) {
          universitiesMap = Object.fromEntries(universities.map(u => [u.id, u.name]))
        }
      }

      // Transform data to match Yearbook component expectations
      return (data || []).map((profile) => ({
        id: profile.id,
        name: profile.full_name || profile.username || 'Anonymous',
        email: profile.email,
        age: profile.age,
        grade: profile.grade,
        gender: profile.gender,
        major: profile.major || 'Undeclared',
        year: profile.graduation_year?.toString() || '2025',
        bio: profile.bio,
        avatar: profile.avatar_url,
        photoUrl: profile.avatar_url, // Required by Yearbook card
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        personalityTags: Array.isArray(profile.personality_tags) ? profile.personality_tags : [],
        university: universitiesMap[profile.university_id] || 'University',
        // For compatibility with existing Yearbook component
        quote: profile.bio || 'No bio yet',
        photos: profile.avatar_url ? [profile.avatar_url] : [],
      }))
    },
    enabled: !!user, // Only run if user is authenticated
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  })
}

/**
 * Hook to fetch a single profile by ID
 */
export function useProfile(profileId) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      if (!profileId) {
        throw new Error('Profile ID is required')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          university:universities(id, name, domain)
        `)
        .eq('id', profileId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        throw error
      }

      return data
    },
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}
