import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadPhotosToSupabase } from '../helpers/uploadPhotos'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

/**
 * Hook to save onboarding data to the profile
 * Supports partial updates - saves whatever data is provided
 */
export const useSaveOnboarding = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ formData, completedSteps, completionPercentage }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to save onboarding data')
      }

      // Upload photos if present and not already uploaded
      let uploadedPhotos = formData.photos || []
      let photoUploadError = null
      if (formData.photos && formData.photos.length > 0) {
        const needsUpload = formData.photos.some(photo => !photo.uploadedUrl)
        if (needsUpload) {
          console.log(`📸 Uploading ${formData.photos.length} photo(s) to Supabase...`)
          try {
            uploadedPhotos = await uploadPhotosToSupabase(formData.photos, user.id)
            const uploadedCount = uploadedPhotos.filter(p => p.uploadedUrl).length
            console.log(`✅ Successfully uploaded ${uploadedCount} photo(s)`)

            // Check if some photos failed to upload
            const failedCount = formData.photos.length - uploadedCount
            if (failedCount > 0) {
              photoUploadError = `${failedCount} photo(s) failed to upload. They will be retried automatically.`
              console.warn(`⚠️ ${failedCount} photo(s) failed to upload`)
            }
          } catch (error) {
            console.error('❌ Photo upload failed:', error)
            // Don't throw - allow onboarding to continue even if photos fail
            // Photos will be retried on next save
            photoUploadError = 'Photos failed to upload. They will be retried automatically.'
            console.warn('⚠️ Continuing onboarding without photos - will retry on next save')
          }
        } else {
          console.log('✅ All photos already uploaded, skipping upload step')
        }
      }

      // Prepare update object (only include fields that have values)
      const updateData = {
        last_onboarding_update: new Date().toISOString(),
        profile_completion_percentage: completionPercentage,
      }

      // Add photos if uploaded
      if (uploadedPhotos.length > 0) {
        // Set avatar URL (use yearbook photo or first photo)
        const yearbookPhoto = uploadedPhotos.find(p => p.isYearbookPhoto) || uploadedPhotos[0]
        if (yearbookPhoto?.uploadedUrl) {
          updateData.avatar_url = yearbookPhoto.uploadedUrl
        } else if (uploadedPhotos[0]?.uploadedUrl) {
          updateData.avatar_url = uploadedPhotos[0].uploadedUrl
        }

        // Note: profiles table doesn't have 'photos' or 'yearbook_photo_url' columns
        // Photos are stored in the media table via uploadImageToBondedMedia
        // avatar_url is the only photo field in profiles
      }

      // Add basic info if present
      // Map school name to university_id
      if (formData.school) {
        // formData.school might be a name string, need to look up university_id
        // Try to find university by name or domain
        // Use maybeSingle() instead of single() to avoid throwing when no rows found
        const { data: university, error: uniError } = await supabase
          .from('universities')
          .select('id')
          .or(`name.ilike.%${formData.school}%,domain.ilike.%${formData.school}%`)
          .limit(1)
          .maybeSingle()

        if (uniError) {
          console.warn('⚠️ Error looking up university:', uniError.message)
        }

        if (university?.id) {
          updateData.university_id = university.id
          console.log('✅ Mapped school to university_id:', formData.school, '->', university.id)
        } else {
          console.warn('⚠️ Could not find university for school:', formData.school)
          // If school is already a UUID, use it directly
          if (formData.school.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            updateData.university_id = formData.school
          }
        }
      }
      if (formData.fullName) updateData.full_name = formData.fullName.trim()
      if (formData.username) updateData.username = formData.username.toLowerCase().trim()
      if (formData.age) updateData.age = formData.age
      if (formData.grade) updateData.grade = formData.grade
      if (formData.gender) updateData.gender = formData.gender
      if (formData.major) updateData.major = formData.major

      // Add optional fields if present
      if (formData.interests?.length > 0) {
        updateData.interests = formData.interests
      }
      if (formData.personalityTags?.length > 0) {
        updateData.personality_tags = formData.personalityTags
      }
      if (formData.humorStyle) updateData.humor_style = formData.humorStyle
      if (formData.aesthetic) updateData.aesthetic = formData.aesthetic
      if (formData.studyHabits) updateData.study_habits = formData.studyHabits
      if (formData.livingHabits) updateData.living_habits = formData.livingHabits
      if (formData.personalityAnswers && Object.keys(formData.personalityAnswers).length > 0) {
        updateData.personality_answers = formData.personalityAnswers
      }
      if (formData.classSchedule) updateData.class_schedule = formData.classSchedule

      // Save yearbook quote if provided
      if (formData.yearbookQuote) {
        updateData.yearbook_quote = formData.yearbookQuote.trim()
      }

      // Set onboarding step to the last completed step
      if (completedSteps?.length > 0) {
        updateData.onboarding_step = completedSteps[completedSteps.length - 1]
      }

      // Mark onboarding as complete if 100%
      if (completionPercentage >= 100) {
        updateData.onboarding_complete = true
      }

      // Use upsert to create profile if it doesn't exist, or update if it does
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...updateData,
        }, {
          onConflict: 'id',
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving onboarding data:', error)
        throw error
      }

      // Return profile data along with any photo upload errors for UI feedback
      return { profile: data, photoUploadError }
    },
    onSuccess: (data) => {
      // Invalidate profile queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', user?.id] })
      console.log('✅ Profile queries invalidated after onboarding save')
    },
  })
}
