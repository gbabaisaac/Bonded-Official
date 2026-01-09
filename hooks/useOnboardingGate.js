import { useRouter } from 'expo-router'
import { Alert } from 'react-native'
import { useCurrentUserProfile } from './useCurrentUserProfile'

/**
 * Hook to gate features based on onboarding completion
 * Returns functions to check if user can access features and show nudges
 */
export function useOnboardingGate() {
  const { data: profile } = useCurrentUserProfile()
  const router = useRouter()
  
  const isOnboardingComplete = profile?.onboarding_complete || false
  const completionPercentage = profile?.profile_completion_percentage || 0
  
  /**
   * Check if user can access a feature
   * Returns { canAccess: boolean, reason?: string }
   */
  const canAccessFeature = (featureName) => {
    if (isOnboardingComplete) {
      return { canAccess: true }
    }
    
    // Define which features require complete onboarding
    const requiresCompleteOnboarding = [
      'create_post',
      'create_event',
      'send_message',
      'view_yearbook',
      'browse_profiles',
    ]
    
    if (requiresCompleteOnboarding.includes(featureName)) {
      return {
        canAccess: false,
        reason: 'Please complete onboarding to use this feature',
      }
    }
    
    // Some features are available with partial onboarding
    return { canAccess: true }
  }
  
  /**
   * Show nudge to complete onboarding
   */
  const showOnboardingNudge = (featureName = 'this feature') => {
    Alert.alert(
      'Complete Your Profile',
      `To use ${featureName}, please complete your onboarding first. You're ${completionPercentage}% done!`,
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Complete Now',
          onPress: () => router.push('/onboarding'),
          style: 'default',
        },
      ]
    )
  }
  
  /**
   * Gate a feature - shows nudge if not complete, returns if access is allowed
   */
  const gateFeature = (featureName, showNudge = true) => {
    const { canAccess, reason } = canAccessFeature(featureName)
    
    if (!canAccess && showNudge) {
      showOnboardingNudge(featureName)
    }
    
    return canAccess
  }
  
  return {
    isOnboardingComplete,
    completionPercentage,
    canAccessFeature,
    showOnboardingNudge,
    gateFeature,
  }
}
