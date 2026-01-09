/**
 * Hook for class matching and classmate discovery
 * Matches uploaded classes to course catalog and finds classmates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { normalizeClassCode } from '../services/scheduleParser'
import { useAuthStore } from '../stores/authStore'

/**
 * Match a class to the course catalog
 * Returns existing class or creates new one
 */
export function useMatchClass() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ classCode, className, professor, semester, days, startTime, endTime, location }) => {
      if (!user) {
        throw new Error('User must be authenticated')
      }
      
      // Get user's university
      const { data: profile } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user.id)
        .single()
      
      if (!profile?.university_id) {
        throw new Error('User university not found')
      }
      
      const normalizedCode = normalizeClassCode(classCode)
      
      // Try to find existing class
      let { data: existingClass, error: findError } = await supabase
        .from('classes')
        .select('*')
        .eq('university_id', profile.university_id)
        .or(`class_code.eq.${classCode},class_code.eq.${normalizedCode}`)
        .limit(1)
        .single()
      
      let classId
      
      if (existingClass) {
        // Class exists, use it
        classId = existingClass.id
        
        // Update class name if provided and different
        if (className && className !== existingClass.class_name) {
          await supabase
            .from('classes')
            .update({ class_name: className })
            .eq('id', classId)
        }
      } else {
        // Create new class
        const { data: newClass, error: createError } = await supabase
          .from('classes')
          .insert({
            university_id: profile.university_id,
            class_code: classCode,
            class_name: className || '',
            department: extractDepartment(classCode)
          })
          .select()
          .single()
        
        if (createError) {
          throw createError
        }
        
        classId = newClass.id
      }
      
      // Find or create class section
      let sectionId = null
      
      if (professor || days || startTime || location) {
        // Try to find existing section
        const { data: existingSection } = await supabase
          .from('class_sections')
          .select('id')
          .eq('class_id', classId)
          .eq('professor_name', professor || '')
          .eq('semester', semester || '')
          .limit(1)
          .single()
        
        if (existingSection) {
          sectionId = existingSection.id
        } else {
          // Create new section
          const { data: newSection, error: sectionError } = await supabase
            .from('class_sections')
            .insert({
              class_id: classId,
              professor_name: professor || null,
              semester: semester || null,
              days_of_week: days || [],
              start_time: startTime || null,
              end_time: endTime || null,
              location: location || null
            })
            .select()
            .single()
          
          if (!sectionError && newSection) {
            sectionId = newSection.id
          }
        }
      }
      
      return {
        classId,
        sectionId,
        class: existingClass || { id: classId, class_code: classCode, class_name: className }
      }
    },
    onSuccess: () => {
      // Invalidate class-related queries
      queryClient.invalidateQueries(['classes'])
      queryClient.invalidateQueries(['enrollments'])
    }
  })
}

/**
 * Enroll user in a class
 */
export function useEnrollInClass() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ classId, sectionId, semester, termCode }) => {
      if (!user) {
        throw new Error('User must be authenticated')
      }
      
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('user_class_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('class_id', classId)
        .eq('semester', semester || '')
        .limit(1)
        .single()
      
      if (existing) {
        // Already enrolled, just return
        return existing
      }
      
      // Create enrollment
      const { data, error } = await supabase
        .from('user_class_enrollments')
        .insert({
          user_id: user.id,
          class_id: classId,
          section_id: sectionId || null,
          semester: semester || getCurrentSemester(),
          term_code: termCode || getCurrentTermCode(),
          is_active: true
        })
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['enrollments'])
      queryClient.invalidateQueries(['classmates'])
    }
  })
}

/**
 * Find classmates (users in same classes)
 * Filters by same professor if provided
 */
export function useClassmates(classId, professorName = null) {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['classmates', classId, professorName, user?.id],
    queryFn: async () => {
      if (!user || !classId) {
        return []
      }
      
      // Build query to find classmates
      let query = supabase
        .from('user_class_enrollments')
        .select(`
          user_id,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url,
            major,
            grade
          ),
          section:section_id (
            professor_name
          )
        `)
        .eq('class_id', classId)
        .eq('is_active', true)
        .neq('user_id', user.id) // Exclude current user
      
      // If professor specified, filter by section
      if (professorName) {
        query = query.eq('section.professor_name', professorName)
      }
      
      const { data, error } = await query
      
      if (error) {
        throw error
      }
      
      // Transform data
      return (data || []).map(enrollment => ({
        userId: enrollment.user_id,
        profile: enrollment.profiles,
        professor: enrollment.section?.professor_name || null
      }))
    },
    enabled: !!user && !!classId
  })
}

/**
 * Get all classmates across all user's classes
 */
export function useAllClassmates() {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['all-classmates', user?.id],
    queryFn: async () => {
      if (!user) {
        return []
      }
      
      // Get user's enrollments
      const { data: enrollments } = await supabase
        .from('user_class_enrollments')
        .select('class_id, section_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      if (!enrollments || enrollments.length === 0) {
        return []
      }
      
      const classIds = enrollments.map(e => e.class_id)
      const sectionIds = enrollments.map(e => e.section_id).filter(Boolean)
      
      // Find all users in same classes
      let query = supabase
        .from('user_class_enrollments')
        .select(`
          user_id,
          class_id,
          section_id,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url,
            major,
            grade
          ),
          class:class_id (
            class_code,
            class_name
          ),
          section:section_id (
            professor_name
          )
        `)
        .in('class_id', classIds)
        .eq('is_active', true)
        .neq('user_id', user.id)
      
      // If sections exist, filter by same section
      if (sectionIds.length > 0) {
        query = query.in('section_id', sectionIds)
      }
      
      const { data, error } = await query
      
      if (error) {
        throw error
      }
      
      // Group by user and collect shared classes
      const classmatesMap = new Map()
      
      data.forEach(enrollment => {
        const userId = enrollment.user_id
        if (!classmatesMap.has(userId)) {
          classmatesMap.set(userId, {
            userId,
            profile: enrollment.profiles,
            sharedClasses: []
          })
        }
        
        const classmate = classmatesMap.get(userId)
        classmate.sharedClasses.push({
          classCode: enrollment.class?.class_code,
          className: enrollment.class?.class_name,
          professor: enrollment.section?.professor_name
        })
      })
      
      return Array.from(classmatesMap.values())
    },
    enabled: !!user
  })
}

/**
 * Helper: Extract department from class code (e.g., "CS201" -> "Computer Science")
 */
function extractDepartment(classCode) {
  const deptMap = {
    'CS': 'Computer Science',
    'MATH': 'Mathematics',
    'ENG': 'English',
    'HIST': 'History',
    'BIO': 'Biology',
    'CHEM': 'Chemistry',
    'PHYS': 'Physics',
    'PSY': 'Psychology',
    'ECON': 'Economics',
    'BUS': 'Business',
    'MKT': 'Marketing',
    'FIN': 'Finance',
    'ACCT': 'Accounting'
  }
  
  const match = classCode.match(/^([A-Z]+)/)
  if (match) {
    return deptMap[match[1]] || match[1]
  }
  
  return null
}

/**
 * Helper: Get current semester (e.g., "Fall 2024")
 */
function getCurrentSemester() {
  const now = new Date()
  const month = now.getMonth() // 0-11
  const year = now.getFullYear()
  
  if (month >= 0 && month <= 4) {
    return `Spring ${year}`
  } else if (month >= 5 && month <= 7) {
    return `Summer ${year}`
  } else {
    return `Fall ${year}`
  }
}

/**
 * Helper: Get current term code (e.g., "2024FA")
 */
function getCurrentTermCode() {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  
  if (month >= 0 && month <= 4) {
    return `${year}SP`
  } else if (month >= 5 && month <= 7) {
    return `${year}SU`
  } else {
    return `${year}FA`
  }
}
