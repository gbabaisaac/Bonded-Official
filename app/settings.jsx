import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { hp, wp } from '../helpers/common'
import AppTopBar from '../components/AppTopBar'
import BottomNav from '../components/BottomNav'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import SectionHeader from '../components/SectionHeader'
import { useAppTheme, useThemeMode } from './theme'
import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function Settings() {
  const router = useRouter()
  const theme = useAppTheme()
  const { mode, setMode } = useThemeMode()
  const { logout } = useAuthStore()
  const isDarkMode = mode === 'dark'
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const styles = createStyles(theme)

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true)
              console.log('🚪 Signing out...')
              
              // Step 1: Sign out from Supabase (clears JWT from SecureStore)
              // This removes the access_token and refresh_token from secure storage
              const { error: signOutError } = await supabase.auth.signOut()
              
              if (signOutError) {
                console.error('❌ Error signing out from Supabase:', signOutError)
                Alert.alert('Error', 'Failed to sign out. Please try again.')
                setIsSigningOut(false)
                return
              }
              
              console.log('✅ Supabase session cleared (JWT removed from SecureStore)')
              
              // Step 2: Clear auth store (clears Zustand state and AsyncStorage)
              // logout() now clears both Zustand state and AsyncStorage
              await logout()
              
              console.log('✅ Signed out successfully - all tokens and auth data cleared')
              console.log('   ✓ JWT cleared from SecureStore (via supabase.auth.signOut)')
              console.log('   ✓ Auth state cleared from Zustand')
              console.log('   ✓ AsyncStorage cleared')
              
              // Step 4: Navigate to login screen
              router.replace('/login')
            } catch (error) {
              console.error('❌ Error during sign out:', error)
              Alert.alert('Error', 'An error occurred while signing out. Please try again.')
              setIsSigningOut(false)
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent, showArrow = true, titleStyle }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name={icon} size={hp(2.2)} color={theme.colors.accent} />
        </View>
        <View style={styles.settingTextContainer}>
          <ThemedText style={[styles.settingTitle, titleStyle]}>{title}</ThemedText>
          {subtitle && <ThemedText variant="secondary" style={styles.settingSubtitle}>{subtitle}</ThemedText>}
        </View>
      </View>
      {rightComponent || (showArrow && (
        <Ionicons
          name="chevron-forward"
          size={hp(2)}
          color={theme.colors.textSecondary}
          style={{ opacity: 0.5 }}
        />
      ))}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <AppHeader title="Settings" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Appearance */}
          <SectionHeader title="Appearance" />
          <AppCard style={styles.sectionCard}>
              <SettingItem
                icon="moon-outline"
                title="Dark Mode"
                subtitle="Switch to dark theme"
                rightComponent={
                  <Switch
                    value={isDarkMode}
                    onValueChange={(value) => setMode(value ? 'dark' : 'light')}
                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                    thumbColor={theme.colors.white}
                    ios_backgroundColor={theme.colors.surface}
                  />
                }
                showArrow={false}
              />
          </AppCard>

          {/* Notifications */}
          <SectionHeader title="Notifications" />
          <AppCard style={styles.sectionCard}>
              <SettingItem
                icon="notifications-outline"
                title="Push Notifications"
                subtitle="Receive notifications on your device"
                rightComponent={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                    thumbColor={theme.colors.white}
                    ios_backgroundColor={theme.colors.surface}
                  />
                }
                showArrow={false}
              />
              <SettingItem
                icon="mail-outline"
                title="Email Notifications"
                subtitle="Get notified via email"
                rightComponent={
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                    thumbColor={theme.colors.white}
                    ios_backgroundColor={theme.colors.surface}
                  />
                }
                showArrow={false}
              />
          </AppCard>

          {/* Preferences */}
          <SectionHeader title="Preferences" />
          <AppCard style={styles.sectionCard}>
              <SettingItem
                icon="person-outline"
                title="Edit Profile"
                onPress={() => router.push('/profile')}
              />
              <SettingItem
                icon="lock-closed-outline"
                title="Privacy & Security"
                onPress={() => {}}
              />
              <SettingItem
                icon="language-outline"
                title="Language"
                subtitle="English"
                onPress={() => {}}
              />
          </AppCard>

          {/* About */}
          <SectionHeader title="About" />
          <AppCard style={styles.sectionCard}>
              <SettingItem
                icon="help-circle-outline"
                title="Help & Support"
                onPress={() => {}}
              />
              <SettingItem
                icon="document-text-outline"
                title="Terms of Service"
                onPress={() => {}}
              />
              <SettingItem
                icon="shield-checkmark-outline"
                title="Privacy Policy"
                onPress={() => {}}
              />
              <SettingItem
                icon="information-circle-outline"
                title="App Version"
                subtitle="1.0.0"
                showArrow={false}
              />
          </AppCard>

          {/* Account */}
          <SectionHeader title="Account" />
          <AppCard style={styles.sectionCard}>
              <SettingItem
                icon="log-out-outline"
                title={isSigningOut ? 'Signing Out...' : 'Sign Out'}
                titleStyle={{ color: '#ED4956' }}
                onPress={handleSignOut}
                showArrow={!isSigningOut}
              />
          </AppCard>
        </ScrollView>

        <BottomNav />
      </ThemedView>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: hp(10),
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: theme.spacing.xs,
  },
  settingSubtitle: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    opacity: theme.ui.metaOpacity,
  },
})


