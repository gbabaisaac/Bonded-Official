/**
 * Hook to save schedule data and create section chats
 * Handles course/section/component creation and chat setup
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useSaveSchedule() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ courses, selectedSections, universityId }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to save schedule')
      }

      if (!universityId) {
        throw new Error('University ID is required')
      }

      const sectionKeys = new Set(selectedSections)

      // Process each course
      for (const course of courses) {
        // 1. Find or create course
        // Parse course code like "CSC 305" into subject_code and course_number
        const codeParts = course.courseCode.trim().split(/\s+/)
        const subjectCode = codeParts[0] || ''
        const courseNumber = codeParts.slice(1).join(' ') || codeParts[0] || ''

        let { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id')
          .eq('full_code', course.courseCode.trim())
          .single()

        if (courseError && courseError.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is fine
          console.error('Error finding course:', courseError)
          throw courseError
        }

        let courseId
        if (!courseData) {
          // Create course with subject_code and course_number (full_code is auto-generated)
          const { data: newCourse, error: createError } = await supabase
            .from('courses')
            .insert({
              subject_code: subjectCode,
              course_number: courseNumber,
            })
            .select('id')
            .single()

          if (createError) {
            console.error('Error creating course:', createError)
            throw createError
          }
          courseId = newCourse.id
        } else {
          courseId = courseData.id
        }

        // 2. Find or create section
        let { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .select('id')
          .eq('course_id', courseId)
          .eq('section_code', course.sectionId)
          .single()

        if (sectionError && sectionError.code !== 'PGRST116') {
          console.error('Error finding section:', sectionError)
          throw sectionError
        }

        let sectionId
        if (!sectionData) {
          // Create section
          const { data: newSection, error: createError } = await supabase
            .from('sections')
            .insert({
              course_id: courseId,
              section_code: course.sectionId,
            })
            .select('id')
            .single()

          if (createError) {
            console.error('Error creating section:', createError)
            throw createError
          }
          sectionId = newSection.id
        } else {
          sectionId = sectionData.id
        }

        // 3. Create or update components
        for (const component of course.components) {
          // Check if component exists
          const { data: existingComponent } = await supabase
            .from('course_components')
            .select('id')
            .eq('section_id', sectionId)
            .eq('component_type', component.type)
            .eq('start_time', component.startTime)
            .single()

          if (!existingComponent) {
            // Create component
            const { error: componentError } = await supabase.from('course_components').insert({
              section_id: sectionId,
              component_type: component.type,
              days: component.days,
              start_time: component.startTime,
              end_time: component.endTime,
              location: component.location || null,
            })

            if (componentError) {
              console.error('Error creating component:', componentError)
              throw componentError
            }
          }
        }

        // 4. Add user to section (if not already a member)
        const { error: memberError } = await supabase
          .from('section_members')
          .insert({
            user_id: user.id,
            section_id: sectionId,
          })
          .select()
          .single()

        // Ignore duplicate key errors (user already enrolled)
        if (memberError && memberError.code !== '23505') {
          console.error('Error adding user to section:', memberError)
          throw memberError
        }

        // 5. If section is selected and has a Lecture component, ensure chat exists and user is added
        const sectionKey = `${course.courseCode}-${course.sectionId}`
        const hasLecture = course.components.some((c) => c.type === 'Lecture')

        if (sectionKeys.has(sectionKey) && hasLecture) {
          // Chat should be created automatically by trigger, but ensure user is added
          // The trigger should handle this, but we'll verify
          const { data: chatData } = await supabase
            .from('section_chats')
            .select('id')
            .eq('section_id', sectionId)
            .single()

          if (chatData) {
            // Ensure user is in chat participants (trigger should handle this, but double-check)
            await supabase
              .from('chat_participants')
              .insert({
                chat_id: chatData.id,
                user_id: user.id,
              })
              .select()
              .single()
            // Ignore duplicate errors
          }
        }
      }

      return { success: true }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      console.log('✅ Schedule saved successfully')
    },
    retry: 1,
  })
}




