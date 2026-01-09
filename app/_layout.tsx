import { Ionicons } from '@expo/vector-icons'
import { Stack, useRouter, usePathname } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Dimensions, Image, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { DrawerLayout, GestureHandlerRootView } from 'react-native-gesture-handler'
import Loading from '../components/Loading'
import { OnboardingNudge } from '../components/OnboardingNudge'
import { ClubsProvider, useClubsContext } from '../contexts/ClubsContext'
import { EventsProvider } from '../contexts/EventsContext'
import { MessagesProvider } from '../contexts/MessagesContext'
import { StoriesProvider } from '../contexts/StoriesContext'
import { hp, wp } from '../helpers/common'
import { useForums } from '../hooks/useForums'
import { supabase } from '../lib/supabase'
import QueryProvider from '../providers/QueryProvider'
import { useAuthStore } from '../stores/authStore'
import { useOnboardingStore } from '../stores/onboardingStore'
import { isFeatureEnabled } from '../utils/featureGates'
import { ThemeProvider, useAppTheme } from './theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const DrawerItem = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => {
  const theme = useAppTheme()
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1.5),
        marginBottom: hp(0.5),
      }}
    >
      <Ionicons
        name={icon as any}
        size={hp(2.2)}
        color={theme.colors.textPrimary}
        style={{ opacity: 0.95, marginRight: wp(3) }}
      />
      <Text
        style={{
          fontSize: hp(1.8),
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.body,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const DrawerContent = ({ onNavigate }: { onNavigate: (path: string) => void }) => {
  const theme = useAppTheme()
  const { user, isAuthenticated } = useAuthStore()
  
  // Only fetch forums if user is authenticated (hook has enabled: !!user, but check here too)
  const { data: forums = [], isLoading: forumsLoading } = useForums()
  
  // Early return if not authenticated (after hooks are called)
  if (!isAuthenticated || !user) {
    return null
  }
  
  // Get user clubs and admin clubs - wrapped in try-catch in case context isn't available
  let userClubs: any[] = []
  let adminClubs: any[] = []
  try {
    const clubsContext = useClubsContext()
    userClubs = clubsContext.getUserClubs()
    adminClubs = clubsContext.getAdminClubs()
  } catch (e) {
    // Context not available, use empty array
    console.log('ClubsContext error:', e)
  }
  
  // Organize forums by type
  const classForums = forums.filter(f => f.type === 'class')
  const publicForums = forums.filter(f => f.type === 'campus' || f.type === 'public')
  const privateForums = forums.filter(f => f.type === 'private')
  const clubForums = adminClubs.map(club => ({
    name: `${club.name} Forum`,
    clubId: club.id,
    forumId: club.forumId,
  }))
  
  const [classesExpanded, setClassesExpanded] = React.useState(true)
  const [publicExpanded, setPublicExpanded] = React.useState(true)
  const [privateExpanded, setPrivateExpanded] = React.useState(true)

  // Get user profile data (simplified - can be enhanced with useProfiles hook)
  const userProfile = {
    name: user?.email?.split('@')[0] || 'User',
    headline: user?.email || '',
    location: 'University of Rhode Island',
    avatar: null,
    profileViewers: 0,
    socialLinks: null,
  }

  return (
    <Pressable
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
          },
          android: {
            elevation: 8,
          },
        }),
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: hp(4) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section - LinkedIn Style */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onNavigate('/profile')}
          style={{
            paddingTop: hp(6),
            paddingHorizontal: wp(4),
            paddingBottom: hp(3),
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
            <View style={{ position: 'relative', alignItems: 'center', marginBottom: hp(2) }}>
              {/* Profile Picture */}
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    width: hp(10),
                    height: hp(10),
                    borderRadius: hp(5),
                    backgroundColor: theme.colors.bondedPurple,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: theme.colors.white,
                  }}
                >
                  <Text
                    style={{
                      fontSize: hp(4),
                      fontWeight: '800',
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.heading,
                    }}
                  >
                    {userProfile.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: hp(0.5) }}>
              <Text
                style={{
                  fontSize: hp(2.2),
                  fontWeight: '700',
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.heading,
                  marginRight: wp(1),
                }}
              >
                {userProfile.name}
              </Text>
              <View
                style={{
                  width: hp(1.8),
                  height: hp(1.8),
                  borderRadius: hp(0.9),
                  backgroundColor: '#0A66C2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark" size={hp(1)} color={theme.colors.white} />
              </View>
            </View>

            {/* Headline */}
            <Text
              style={{
                fontSize: hp(1.5),
                color: theme.colors.textSecondary,
                opacity: 0.9,
                fontFamily: theme.typography.fontFamily.body,
                textAlign: 'center',
                marginBottom: hp(0.5),
                paddingHorizontal: wp(2),
              }}
              numberOfLines={2}
            >
              {userProfile.headline}
            </Text>

            {/* Location */}
            <Text
              style={{
                fontSize: hp(1.3),
                color: theme.colors.textSecondary,
                opacity: 0.7,
                fontFamily: theme.typography.fontFamily.body,
                textAlign: 'center',
                marginBottom: hp(2),
              }}
            >
              {userProfile.location}
            </Text>

          </TouchableOpacity>

          {/* Statistics Section */}
          <View
            style={{
              paddingVertical: hp(2),
              paddingHorizontal: wp(4),
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={{ fontSize: hp(1.4), color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.body }}>
                <Text style={{ color: '#70B5F9', fontWeight: '600' }}>{userProfile.profileViewers}</Text> profile viewers
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Links Section */}
          {userProfile.socialLinks && (
            <View
              style={{
                paddingVertical: hp(2),
                paddingHorizontal: wp(4),
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: hp(1.6),
                  fontWeight: '600',
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.body,
                  marginBottom: hp(1.5),
                }}
              >
                Connect
              </Text>
              <View style={{ gap: hp(1) }}>
                {userProfile.socialLinks?.instagram && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: hp(1),
                      paddingHorizontal: wp(3),
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.backgroundSecondary,
                    }}
                  >
                    <Ionicons name="logo-instagram" size={hp(2.2)} color="#E4405F" style={{ marginRight: wp(2) }} />
                    <Text
                      style={{
                        fontSize: hp(1.6),
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.fontFamily.body,
                      }}
                    >
                      {userProfile.socialLinks.instagram}
                    </Text>
                  </TouchableOpacity>
                )}
                {userProfile.socialLinks?.spotify && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: hp(1),
                      paddingHorizontal: wp(3),
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.backgroundSecondary,
                    }}
                  >
                    <Ionicons name="musical-notes" size={hp(2.2)} color="#1DB954" style={{ marginRight: wp(2) }} />
                    <Text
                      style={{
                        fontSize: hp(1.6),
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.fontFamily.body,
                      }}
                    >
                      {userProfile.socialLinks.spotify}
                    </Text>
                  </TouchableOpacity>
                )}
                {userProfile.socialLinks?.appleMusic && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: hp(1),
                      paddingHorizontal: wp(3),
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.backgroundSecondary,
                    }}
                  >
                    <Ionicons name="musical-note" size={hp(2.2)} color="#FA243C" style={{ marginRight: wp(2) }} />
                    <Text
                      style={{
                        fontSize: hp(1.6),
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.fontFamily.body,
                      }}
                    >
                      {userProfile.socialLinks.appleMusic}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Forums Section */}
          <View
            style={{
              paddingVertical: hp(2),
              paddingHorizontal: wp(4),
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text
              style={{
                fontSize: hp(1.6),
                fontWeight: '600',
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.body,
                marginBottom: hp(1.5),
              }}
            >
              Forums
            </Text>

            {/* Main Forum */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: hp(1.2),
                paddingHorizontal: wp(3),
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.backgroundSecondary,
                marginBottom: hp(0.5),
              }}
              activeOpacity={0.7}
              onPress={() => onNavigate('/forum')}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800' }}
                style={{
                  width: hp(3.5),
                  height: hp(3.5),
                  borderRadius: hp(1.75),
                  marginRight: wp(3),
                }}
                resizeMode="cover"
              />
              <Text
                style={{
                  fontSize: hp(1.8),
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.body,
                  fontWeight: '600',
                }}
              >
                Main forum
              </Text>
            </TouchableOpacity>

            {/* Your classes (expandable) */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: hp(1.2),
                paddingHorizontal: wp(3),
                borderRadius: theme.radius.lg,
                marginBottom: hp(0.5),
              }}
              activeOpacity={0.7}
              onPress={() => setClassesExpanded((prev) => !prev)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: hp(2.8),
                    height: hp(2.8),
                    borderRadius: hp(1.4),
                    backgroundColor: theme.colors.backgroundSecondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: wp(3),
                  }}
                >
                  <Ionicons
                    name="school-outline"
                    size={hp(2)}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <Text
                  style={{
                    fontSize: hp(1.8),
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.body,
                    fontWeight: '500',
                  }}
                >
                  Your classes
                </Text>
              </View>
              <Ionicons
                name={classesExpanded ? 'chevron-up' : 'chevron-down'}
                size={hp(2.2)}
                color={theme.colors.textSecondary}
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
            {classesExpanded &&
              classForums.map((forum) => (
                <TouchableOpacity
                  key={forum.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: wp(12),
                    paddingVertical: hp(1),
                    paddingRight: wp(3),
                    borderRadius: theme.radius.md,
                    marginLeft: wp(3),
                    marginBottom: hp(0.3),
                  }}
                  activeOpacity={0.7}
                  onPress={() => onNavigate('/forum')}
                >
                  <View
                    style={{
                      width: hp(3),
                      height: hp(3),
                      borderRadius: hp(1.5),
                      backgroundColor: theme.colors.backgroundSecondary,
                      marginRight: wp(2),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="school-outline" size={hp(1.5)} color={theme.colors.textSecondary} />
                  </View>
                  <Text
                    style={{
                      fontSize: hp(1.6),
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.fontFamily.body,
                      opacity: 0.85,
                    }}
                  >
                    {forum.code ? `${forum.code} – ${forum.name}` : forum.name}
                  </Text>
                </TouchableOpacity>
              ))}

            {/* Public forums (expandable) */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: hp(1.2),
                paddingHorizontal: wp(3),
                borderRadius: theme.radius.lg,
                marginBottom: hp(0.5),
              }}
              activeOpacity={0.7}
              onPress={() => setPublicExpanded((prev) => !prev)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: hp(2.8),
                    height: hp(2.8),
                    borderRadius: hp(1.4),
                    backgroundColor: theme.colors.backgroundSecondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: wp(3),
                  }}
                >
                  <Ionicons
                    name="people-outline"
                    size={hp(2)}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <Text
                  style={{
                    fontSize: hp(1.8),
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.body,
                    fontWeight: '500',
                  }}
                >
                  Public forums
                </Text>
              </View>
              <Ionicons
                name={publicExpanded ? 'chevron-up' : 'chevron-down'}
                size={hp(2.2)}
                color={theme.colors.textSecondary}
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
            {publicExpanded &&
              publicForums.map((forum) => (
                <TouchableOpacity
                  key={forum.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: wp(12),
                    paddingVertical: hp(1),
                    paddingRight: wp(3),
                    borderRadius: theme.radius.md,
                    marginLeft: wp(3),
                    marginBottom: hp(0.3),
                  }}
                  activeOpacity={0.7}
                  onPress={() => onNavigate('/forum')}
                >
                  {forum.image ? (
                    <Image
                      source={{ uri: forum.image }}
                      style={{
                        width: hp(3),
                        height: hp(3),
                        borderRadius: hp(1.5),
                        marginRight: wp(2),
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: hp(3),
                        height: hp(3),
                        borderRadius: hp(1.5),
                        backgroundColor: theme.colors.backgroundSecondary,
                        marginRight: wp(2),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="people-outline" size={hp(1.5)} color={theme.colors.textSecondary} />
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: hp(1.6),
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.fontFamily.body,
                      opacity: 0.85,
                    }}
                  >
                    {forum.name}
                  </Text>
                </TouchableOpacity>
              ))}

            {/* Private forums (expandable) */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: hp(1.2),
                paddingHorizontal: wp(3),
                borderRadius: theme.radius.lg,
                marginBottom: hp(0.5),
              }}
              activeOpacity={0.7}
              onPress={() => setPrivateExpanded((prev) => !prev)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: hp(2.8),
                    height: hp(2.8),
                    borderRadius: hp(1.4),
                    backgroundColor: theme.colors.backgroundSecondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: wp(3),
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={hp(2)}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <Text
                  style={{
                    fontSize: hp(1.8),
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily.body,
                    fontWeight: '500',
                  }}
                >
                  Private forums
                </Text>
              </View>
              <Ionicons
                name={privateExpanded ? 'chevron-up' : 'chevron-down'}
                size={hp(2.2)}
                color={theme.colors.textSecondary}
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
            {privateExpanded && (
              <>
                {/* Regular private forums */}
                {privateForums.map((forum) => (
                  <TouchableOpacity
                    key={forum.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingLeft: wp(12),
                      paddingVertical: hp(1),
                      paddingRight: wp(3),
                      borderRadius: theme.radius.md,
                      marginLeft: wp(3),
                      marginBottom: hp(0.3),
                    }}
                    activeOpacity={0.7}
                    onPress={() => onNavigate(`/forum?forumId=${forum.id}`)}
                  >
                    {forum.image ? (
                      <Image
                        source={{ uri: forum.image }}
                        style={{
                          width: hp(3),
                          height: hp(3),
                          borderRadius: hp(1.5),
                          marginRight: wp(2),
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: hp(3),
                          height: hp(3),
                          borderRadius: hp(1.5),
                          backgroundColor: theme.colors.backgroundSecondary,
                          marginRight: wp(2),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="lock-closed-outline" size={hp(1.5)} color={theme.colors.textSecondary} />
                      </View>
                    )}
                    <Text
                      style={{
                        fontSize: hp(1.6),
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.fontFamily.body,
                        opacity: 0.85,
                      }}
                    >
                      {forum.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {/* Club forums (not the clubs themselves) */}
                {clubForums.map((clubForum) => {
                  const club = adminClubs.find(c => c.id === clubForum.clubId)
                  return (
                    <TouchableOpacity
                      key={clubForum.forumId}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingLeft: wp(12),
                        paddingVertical: hp(1),
                        paddingRight: wp(3),
                        borderRadius: theme.radius.md,
                        marginLeft: wp(3),
                        marginBottom: hp(0.3),
                      }}
                      activeOpacity={0.7}
                      onPress={() => onNavigate(`/forum?forumId=${clubForum.forumId}`)}
                    >
                      {club?.avatar ? (
                        <Image
                          source={{ uri: club.avatar }}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            borderRadius: hp(1.5),
                            marginRight: wp(2),
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: hp(3),
                            height: hp(3),
                            borderRadius: hp(1.5),
                            backgroundColor: theme.colors.backgroundSecondary,
                            marginRight: wp(2),
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: hp(1.5),
                              color: theme.colors.accent,
                              fontFamily: theme.typography.fontFamily.heading,
                              fontWeight: '700',
                            }}
                          >
                            {club?.name?.charAt(0).toUpperCase() || 'C'}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={{
                          fontSize: hp(1.6),
                          color: theme.colors.textSecondary,
                          fontFamily: theme.typography.fontFamily.body,
                          opacity: 0.85,
                        }}
                      >
                        {clubForum.name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </>
            )}
          </View>

          {/* Create Organization - with admin clubs in same box */}
          <View
            style={{
              paddingVertical: hp(2),
              paddingHorizontal: wp(4),
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigate('/clubs/create')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: hp(1.5),
                marginBottom: adminClubs.length > 0 ? hp(1.5) : 0,
              }}
            >
              <View
                style={{
                  width: hp(3.5),
                  height: hp(3.5),
                  borderRadius: hp(0.5),
                  backgroundColor: theme.colors.backgroundSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: wp(2),
                  borderWidth: 1,
                  borderColor: theme.colors.bondedPurple,
                }}
              >
                <Ionicons
                  name="add"
                  size={hp(2)}
                  color={theme.colors.bondedPurple}
                />
              </View>
              <Text
                style={{
                  fontSize: hp(1.6),
                  color: theme.colors.bondedPurple,
                  fontFamily: theme.typography.fontFamily.body,
                  fontWeight: '600',
                }}
              >
                Create organization
              </Text>
            </TouchableOpacity>

            {/* Admin clubs in same box */}
            {(adminClubs && adminClubs.length > 0) && (
              <>
                {adminClubs.map((club) => {
                  if (!club || !club.id) return null
                  return (
                  <TouchableOpacity
                    key={club.id}
                    activeOpacity={0.7}
                    onPress={() => onNavigate(`/clubs/${club.id}`)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: hp(1.2),
                      paddingHorizontal: wp(2),
                      borderRadius: theme.radius.md,
                      marginBottom: hp(0.5),
                      marginTop: hp(0.5),
                    }}
                  >
                    {club.avatar ? (
                      <Image
                        source={{ uri: club.avatar }}
                        style={{
                          width: hp(3.5),
                          height: hp(3.5),
                          borderRadius: hp(0.5),
                          marginRight: wp(2),
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: hp(3.5),
                          height: hp(3.5),
                          borderRadius: hp(0.5),
                          backgroundColor: theme.colors.backgroundSecondary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: wp(2),
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: hp(1.8),
                            color: theme.colors.accent,
                            fontFamily: theme.typography.fontFamily.heading,
                            fontWeight: '700',
                          }}
                        >
                          {club.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text
                    style={{
                      fontSize: hp(1.6),
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.body,
                      fontWeight: '500',
                      flex: 1,
                    }}
                  >
                    {club.name}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={hp(2)}
                    color={theme.colors.textSecondary}
                    style={{ opacity: 0.5 }}
                  />
                </TouchableOpacity>
                  )
                })}
              </>
            )}
          </View>

          {/* Navigation Items */}
          <View
            style={{
              paddingVertical: hp(2),
              paddingHorizontal: wp(4),
            }}
          >
            <DrawerItem
              icon="home-outline"
              label="Home"
              onPress={() => onNavigate('/forum')}
            />
            {/* My Network disabled in V1 (friends-only yearbook in V2). */}
            <DrawerItem
              icon="chatbubbles-outline"
              label="Messaging"
              onPress={() => onNavigate('/messages')}
            />
            <DrawerItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => onNavigate('/notifications')}
            />
            <DrawerItem
              icon="calendar-outline"
              label="Calendar"
              onPress={() => onNavigate('/calendar')}
            />
            {isFeatureEnabled('RATE_MY_PROFESSOR') && (
              <DrawerItem
                icon="school-outline"
                label="Rate My Professor"
                onPress={() => onNavigate('/rate-professor')}
              />
            )}
            <DrawerItem
              icon="people-circle-outline"
              label="Clubs & Organizations"
              onPress={() => onNavigate('/clubs')}
            />
            
            {isFeatureEnabled('LINK_AI') && (
              <DrawerItem
                icon="sparkles"
                label="Link AI"
                onPress={() => onNavigate('/link-ai')}
              />
            )}
          </View>

          {/* Settings */}
          <View
            style={{
              paddingTop: hp(2),
              paddingHorizontal: wp(4),
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigate('/settings')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: hp(1.5),
              }}
            >
              <Ionicons
                name="settings-outline"
                size={hp(2.2)}
                color={theme.colors.textSecondary}
                style={{ marginRight: wp(3) }}
              />
              <Text
                style={{
                  fontSize: hp(1.8),
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.body,
                  fontWeight: '500',
                }}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Pressable>
  )
}

const RootLayout = () => {
  const router = useRouter()
  const pathname = usePathname() // Get current route
  const drawerRef = useRef<DrawerLayout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const { user, isAuthenticated, setUser, setSession, logout } = useAuthStore()
  const { setUserId: setOnboardingUserId, clearUserId: clearOnboardingUserId } = useOnboardingStore()
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const initialCheckCompleteRef = useRef(false)

  // Routes where drawer should be DISABLED (auth, onboarding, welcome)
  const drawerDisabledRoutes = [
    '/',
    '/index',
    '/welcome',
    '/login',
    '/otp',
    '/onboarding',
    '/auth/callback',
  ]

  // Check if current route should have drawer disabled
  const isDrawerDisabledRoute = drawerDisabledRoutes.some(route => pathname === route || pathname?.startsWith('/auth'))

  // Check Supabase session on app startup and sync with authStore
  // This ensures we don't use stale persisted auth state
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if a valid session exists FIRST before any auth changes
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error checking session:', error)
          // Clear auth state if there's an error
          await logout()
          await supabase.auth.signOut()
          setIsCheckingSession(false)
          initialCheckCompleteRef.current = true
          return
        }

        if (session?.user) {
          // Valid session exists - sync with authStore
          console.log('✅ Valid session found, syncing auth state')
          setUser(session.user)
          setSession(session)
          // Sync onboarding store with user ID
          setOnboardingUserId(session.user.id)
        } else {
          // No valid session - clear auth state IMMEDIATELY
          console.log('ℹ️ No valid session found, clearing auth state')
          await logout()
          clearOnboardingUserId()
          // Force clear any persisted state
          await supabase.auth.signOut()
        }
      } catch (error) {
        console.error('❌ Error in checkSession:', error)
        await logout()
        await supabase.auth.signOut()
      } finally {
        setIsCheckingSession(false)
        // Mark initial check as complete IMMEDIATELY (no delay)
        // This prevents race condition where listener fires before flag is set
        initialCheckCompleteRef.current = true
      }
    }

    checkSession()

    // Listen for auth state changes from Supabase
    // IMPORTANT: Only update auth state if we've completed the initial session check
    // This prevents race conditions where the listener fires before we've cleared stale state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.email, 'initialCheckComplete:', initialCheckCompleteRef.current)
      
      // Don't process auth changes until initial check is complete
      if (!initialCheckCompleteRef.current) {
        console.log('⏳ Skipping auth state change - initial check not complete')
        return
      }
      
      if (session?.user) {
        setUser(session.user)
        setSession(session)
        // Sync onboarding store with user ID
        setOnboardingUserId(session.user.id)
      } else {
        // User signed out or session expired
        // Note: logout() is async but we can't await in this callback
        // The async operation will complete in the background
        logout().catch(err => console.error('Error in logout:', err))
        clearOnboardingUserId()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setSession, logout, setOnboardingUserId, clearOnboardingUserId])

  useEffect(() => {
    const preloadResources = async () => {
      try {
        // Preload all background images used across the app
        const backgroundImages = [
          require('../assets/images/bonded-gradient.jpg'),
          require('../assets/images/bonded-gradient2.jpg'),
        ]

        // Preload all background images in parallel
        const preloadPromises = backgroundImages.map(async (image) => {
          try {
            const imageUri = Image.resolveAssetSource(image).uri
            await Image.prefetch(imageUri)
            console.log('✅ Preloaded background image:', imageUri)
            return true
          } catch (error) {
            console.warn('⚠️ Failed to preload image:', error)
            return false
          }
        })

        // Wait for all images to preload
        await Promise.all(preloadPromises)
        
        // Also preload the logo used in loading animation
        const logoImage = require('../assets/images/transparent-bonded.png')
        const logoUri = Image.resolveAssetSource(logoImage).uri
        await Image.prefetch(logoUri)
        
        // Give time for other resources to load
        await new Promise((resolve) => setTimeout(resolve, 500)) // Minimum loading time
      } catch (error) {
        console.log('Error preloading resources:', error)
        // Continue even if preload fails
      } finally {
        // Start fade out animation, then hide after fade completes
        setTimeout(() => {
          // Trigger fade out
          setIsLoading(false)
        }, 1500) // Start fade after 1.5 seconds
      }
    }

    preloadResources()
  }, [])

  const navigateAndClose = (path: string) => {
    router.push(path as never)
    // Only close drawer if authenticated and drawer exists
    if (isAuthenticated && user && drawerRef.current) {
      drawerRef.current.closeDrawer()
    }
  }

  // Show loading screen while resources load OR while checking session
  if (!showContent || isCheckingSession) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <Loading 
            size={80} 
            duration={1200}
            fadeOut={!isLoading && !isCheckingSession}
            onFadeComplete={() => {
              if (!isCheckingSession) {
                setShowContent(true)
              }
            }}
          />
        </ThemeProvider>
      </GestureHandlerRootView>
    )
  }

  // If user is NOT authenticated, render only the Stack (no providers, no drawer)
  // This prevents all data fetching hooks from running on login/welcome screens
  // IMPORTANT: No DrawerLayout at all when not authenticated - like LinkedIn/Instagram
  // The drawer should be completely inaccessible (no swipe, no gestures, no component)
  
  // CRITICAL: Check BOTH authStore state AND ensure session check is complete
  // Also verify user object actually exists (not just truthy check)
  // AND check if current route allows drawer
  const hasValidUser = user && user.id && user.email
  const shouldShowDrawer = isAuthenticated && hasValidUser && !isCheckingSession && !isDrawerDisabledRoute
  
  // CRITICAL: Never render DrawerLayout when not authenticated
  // This prevents any drawer gestures from working
  if (!shouldShowDrawer) {
    // Ensure drawer ref is null when not authenticated
    drawerRef.current = null
    
    // Debug logging
    if (__DEV__) {
      console.log('🚫 Drawer disabled - isAuthenticated:', isAuthenticated, 'hasValidUser:', hasValidUser, 'isCheckingSession:', isCheckingSession, 'isDrawerDisabledRoute:', isDrawerDisabledRoute, 'pathname:', pathname, 'user:', user)
    }
    
    // NO DrawerLayout rendered - drawer is completely inaccessible
    // Using a plain View wrapper instead of GestureHandlerRootView to prevent any gesture handling
    return (
      <View style={{ flex: 1 }}>
        <ThemeProvider>
          <QueryProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
                animation: 'none',
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </View>
    )
  }
  
  // Debug logging when drawer should be shown
  if (__DEV__) {
    console.log('✅ Drawer enabled - isAuthenticated:', isAuthenticated, 'hasValidUser:', hasValidUser, 'isCheckingSession:', isCheckingSession, 'isDrawerDisabledRoute:', isDrawerDisabledRoute, 'pathname:', pathname)
  }

  // User is authenticated - render full app with providers and drawer
  // DrawerLayout is ONLY rendered when authenticated AND session check is complete
  // Double-check authentication before rendering drawer
  if (!isAuthenticated || !user) {
    // Fallback safety check - should never reach here, but just in case
    return (
      <View style={{ flex: 1 }}>
        <ThemeProvider>
          <QueryProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
                animation: 'none',
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryProvider>
          <StoriesProvider>
            <EventsProvider>
              <ClubsProvider>
                <MessagesProvider>
                  <DrawerLayout
                    ref={drawerRef}
                    drawerWidth={SCREEN_WIDTH * 0.75}
                    drawerPosition="left"
                    drawerType="front"
                    edgeWidth={SCREEN_WIDTH * 0.4}
                    drawerLockMode="unlocked"
                    renderNavigationView={() => <DrawerContent onNavigate={navigateAndClose} />}
                  >
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        gestureEnabled: false,
                        animation: 'none',
                      }}
                    />
                  </DrawerLayout>
                  {/* Global onboarding nudge */}
                  <OnboardingNudge />
                </MessagesProvider>
              </ClubsProvider>
            </EventsProvider>
          </StoriesProvider>
        </QueryProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

export default RootLayout
