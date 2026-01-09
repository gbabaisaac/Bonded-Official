import * as Linking from 'expo-linking'
import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    // Handle deep link URL manually (since detectSessionInUrl: false)
    const handleDeepLink = async (url: string) => {
      console.log('🔗 Deep link received:', url)
      
      // Parse URL to extract tokens
      const { queryParams } = Linking.parse(url)
      const { access_token, refresh_token } = queryParams as {
        access_token?: string
        refresh_token?: string
      }

      if (access_token && refresh_token) {
        console.log('🔑 Tokens found in URL, setting session...')
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (error) {
          console.error('❌ Error setting session:', error)
          return
        }

        console.log('✅ SESSION:', data.session)
        if (data.session?.user) {
          console.log('✅ USER:', data.session.user.email)
        }
      } else {
        console.warn('⚠️ No tokens found in URL')
      }
    }

    // Check initial URL (if app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url)
      }
    })

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url)
    })

    // Also check existing session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('❌ Session Error:', error)
        return
      }
      if (data.session) {
        console.log('✅ Existing SESSION:', data.session)
        if (data.session.user) {
          console.log('✅ Existing USER:', data.session.user.email)
        }
      } else {
        console.log('ℹ️ No existing session')
      }
    })

    // Listen for auth state changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth Event:', event)
      if (session) {
        console.log('✅ SESSION (from event):', session)
        console.log('✅ USER (from event):', session.user.email)
      }
    })

    return () => {
      subscription.remove()
      authSubscription.unsubscribe()
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Signing you in…</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#000',
  },
})




