import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native'
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

export default function Settings() {
  const router = useRouter()
  const theme = useAppTheme()
  const { mode, setMode } = useThemeMode()
  const isDarkMode = mode === 'dark'
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const styles = createStyles(theme)

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
                title="Sign Out"
                titleStyle={{ color: '#ED4956' }}
                onPress={() => {
                  // TODO: Handle sign out
                }}
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
    paddingHorizontal: wp(4),
    paddingBottom: hp(10),
  },
  sectionCard: {
    marginBottom: hp(2),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
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
    fontSize: hp(1.9),
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.2),
  },
  settingSubtitle: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.7,
  },
})


