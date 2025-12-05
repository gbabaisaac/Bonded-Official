import React, { useRef, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { Dimensions, View, Text, TouchableOpacity, ScrollView, Platform, Pressable, Image } from 'react-native'
import { GestureHandlerRootView, DrawerLayout } from 'react-native-gesture-handler'
import { Ionicons } from '@expo/vector-icons'
import QueryProvider from '../providers/QueryProvider'
import { StoriesProvider } from '../contexts/StoriesContext'
import { EventsProvider } from '../contexts/EventsContext'
import { ClubsProvider, useClubsContext } from '../contexts/ClubsContext'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'
import { ThemeProvider } from './theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const DrawerItem = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
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
      color={theme.colors.white}
      style={{ opacity: 0.95, marginRight: wp(3) }}
    />
    <Text
      style={{
        fontSize: hp(1.8),
        color: theme.colors.white,
        fontFamily: theme.typography.fontFamily.body,
        fontWeight: '500',
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
)

const DrawerContent = ({ onNavigate }: { onNavigate: (path: string) => void }) => {
  // Get user clubs and admin clubs - wrapped in try-catch in case context isn't available
  let userClubs: any[] = []
  let adminClubs: any[] = []
  try {
    const clubsContext = useClubsContext()
    userClubs = clubsContext.getUserClubs()
    adminClubs = clubsContext.getAdminClubs()
  } catch (e) {
    // Context not available, use empty array
  }
  
  // Mock forum data
  const mockClasses = ['CS 201 – Data Structures', 'ENGL 101 – Writing', 'MATH 150 – Calc I']
  const mockPublicForums = ['Campus Events', 'Clubs & Orgs']
  const mockPrivateForums = ['Roommates', 'Project Group']
  
  const [classesExpanded, setClassesExpanded] = React.useState(true)
  const [publicExpanded, setPublicExpanded] = React.useState(true)
  const [privateExpanded, setPrivateExpanded] = React.useState(true)

  // Mock user data - replace with real data
  const mockUser = {
    name: 'Alex Smith',
    headline: 'CS major @ URI 🎓 Always down to study or grab coffee ☕ Love hooping at the rec and late night coding sessions 💻 Hit me up if you need a study buddy!',
    location: 'Kingston, RI',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    profileViewers: 334,
    socialLinks: {
      instagram: '@alexsmith',
      spotify: 'Alex Smith',
      appleMusic: 'Alex Smith',
    },
  }

  return (
    <Pressable
      style={{
        flex: 1,
        backgroundColor: '#000000',
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.3,
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
            borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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
                    borderColor: theme.colors.charcoal,
                  }}
                >
                  <Text
                    style={{
                      fontSize: hp(4),
                      fontWeight: '800',
                      color: theme.colors.white,
                      fontFamily: theme.typography.fontFamily.heading,
                    }}
                  >
                    {mockUser.name.charAt(0)}
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
                  color: theme.colors.white,
                  fontFamily: theme.typography.fontFamily.heading,
                  marginRight: wp(1),
                }}
              >
                {mockUser.name}
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
                color: theme.colors.offWhite,
                opacity: 0.9,
                fontFamily: theme.typography.fontFamily.body,
                textAlign: 'center',
                marginBottom: hp(0.5),
                paddingHorizontal: wp(2),
              }}
              numberOfLines={2}
            >
              {mockUser.headline}
            </Text>

            {/* Location */}
            <Text
              style={{
                fontSize: hp(1.3),
                color: theme.colors.offWhite,
                opacity: 0.7,
                fontFamily: theme.typography.fontFamily.body,
                textAlign: 'center',
                marginBottom: hp(2),
              }}
            >
              {mockUser.location}
            </Text>

          </TouchableOpacity>

          {/* Statistics Section */}
          <View
            style={{
              paddingVertical: hp(2),
              paddingHorizontal: wp(4),
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={{ fontSize: hp(1.4), color: theme.colors.offWhite, opacity: 0.9, fontFamily: theme.typography.fontFamily.body }}>
                <Text style={{ color: '#70B5F9', fontWeight: '600' }}>{mockUser.profileViewers}</Text> profile viewers
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Links Section */}
          {mockUser.socialLinks && (
            <View
              style={{
                paddingVertical: hp(2),
                paddingHorizontal: wp(4),
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Text
                style={{
                  fontSize: hp(1.6),
                  fontWeight: '600',
                  color: theme.colors.white,
                  fontFamily: theme.typography.fontFamily.body,
                  marginBottom: hp(1.5),
                }}
              >
                Connect
              </Text>
              <View style={{ gap: hp(1) }}>
                {mockUser.socialLinks.instagram && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: hp(1),
                      paddingHorizontal: wp(3),
                      borderRadius: theme.radius.md,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <Ionicons name="logo-instagram" size={hp(2.2)} color="#E4405F" style={{ marginRight: wp(2) }} />
                    <Text
                      style={{
                        fontSize: hp(1.6),
                        color: theme.colors.offWhite,
                        fontFamily: theme.typography.fontFamily.body,
                        opacity: 0.9,
                      }}
                    >
                      {mockUser.socialLinks.instagram}
                    </Text>
                  </TouchableOpacity>
                )}
                {mockUser.socialLinks.spotify && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: hp(1),
                      paddingHorizontal: wp(3),
                      borderRadius: theme.radius.md,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <Ionicons name="musical-notes" size={hp(2.2)} color="#1DB954" style={{ marginRight: wp(2) }} />
                    <Text
                      style={{
                        fontSize: hp(1.6),
                        color: theme.colors.offWhite,
                        fontFamily: theme.typography.fontFamily.body,
                        opacity: 0.9,
                      }}
                    >
                      {mockUser.socialLinks.spotify}
                    </Text>
                  </TouchableOpacity>
                )}
                {mockUser.socialLinks.appleMusic && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: hp(1),
                      paddingHorizontal: wp(3),
                      borderRadius: theme.radius.md,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <Ionicons name="musical-note" size={hp(2.2)} color="#FA243C" style={{ marginRight: wp(2) }} />
                    <Text
                      style={{
                        fontSize: hp(1.6),
                        color: theme.colors.offWhite,
                        fontFamily: theme.typography.fontFamily.body,
                        opacity: 0.9,
                      }}
                    >
                      {mockUser.socialLinks.appleMusic}
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
              borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Text
              style={{
                fontSize: hp(1.6),
                fontWeight: '600',
                color: theme.colors.white,
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
                backgroundColor: 'rgba(164, 92, 255, 0.1)',
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
                  color: theme.colors.white,
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
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: wp(3),
                  }}
                >
                  <Ionicons
                    name="school-outline"
                    size={hp(2)}
                    color={theme.colors.offWhite}
                  />
                </View>
                <Text
                  style={{
                    fontSize: hp(1.8),
                    color: theme.colors.white,
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
                color={theme.colors.offWhite}
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
            {classesExpanded &&
              mockClasses.map((name) => {
                // Find forum image for this class
                const classForum = {
                  'CS 201 – Data Structures': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
                  'ENGL 101 – Writing': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
                  'MATH 150 – Calc I': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
                }[name] || null

                return (
                  <TouchableOpacity
                    key={name}
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
                    {classForum ? (
                      <Image
                        source={{ uri: classForum }}
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
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          marginRight: wp(2),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="school-outline" size={hp(1.5)} color={theme.colors.offWhite} />
                      </View>
                    )}
                    <Text
                      style={{
                        fontSize: hp(1.6),
                        color: theme.colors.offWhite,
                        fontFamily: theme.typography.fontFamily.body,
                        opacity: 0.85,
                      }}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                )
              })}

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
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: wp(3),
                  }}
                >
                  <Ionicons
                    name="people-outline"
                    size={hp(2)}
                    color={theme.colors.offWhite}
                  />
                </View>
                <Text
                  style={{
                    fontSize: hp(1.8),
                    color: theme.colors.white,
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
                color={theme.colors.offWhite}
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
            {publicExpanded &&
              mockPublicForums.map((name) => {
                const publicForumImages = {
                  'Campus Events': 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
                  'Clubs & Orgs': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
                }
                const forumImage = publicForumImages[name] || null

                return (
                  <TouchableOpacity
                    key={name}
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
                    {forumImage ? (
                      <Image
                        source={{ uri: forumImage }}
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
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          marginRight: wp(2),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="people-outline" size={hp(1.5)} color={theme.colors.offWhite} />
                      </View>
                    )}
                    <Text
                      style={{
                        fontSize: hp(1.6),
                        color: theme.colors.offWhite,
                        fontFamily: theme.typography.fontFamily.body,
                        opacity: 0.85,
                      }}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                )
              })}

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
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: wp(3),
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={hp(2)}
                    color={theme.colors.offWhite}
                  />
                </View>
                <Text
                  style={{
                    fontSize: hp(1.8),
                    color: theme.colors.white,
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
                color={theme.colors.offWhite}
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
            {privateExpanded &&
              mockPrivateForums.map((name) => {
                const privateForumImages = {
                  'Roommates': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
                  'Project Group': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
                }
                const forumImage = privateForumImages[name] || null

                return (
                  <TouchableOpacity
                    key={name}
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
                    {forumImage ? (
                      <Image
                        source={{ uri: forumImage }}
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
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          marginRight: wp(2),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="lock-closed-outline" size={hp(1.5)} color={theme.colors.offWhite} />
                      </View>
                    )}
                    <Text
                      style={{
                        fontSize: hp(1.6),
                        color: theme.colors.offWhite,
                        fontFamily: theme.typography.fontFamily.body,
                        opacity: 0.85,
                      }}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
          </View>

          {/* Manage Organizations Section */}
          {adminClubs.length > 0 && (
            <View
              style={{
                paddingVertical: hp(2),
                paddingHorizontal: wp(4),
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Text
                style={{
                  fontSize: hp(1.6),
                  fontWeight: '600',
                  color: theme.colors.white,
                  fontFamily: theme.typography.fontFamily.body,
                  marginBottom: hp(1.5),
                }}
              >
                Manage organizations
              </Text>
              {adminClubs.map((club: any) => (
                <TouchableOpacity
                  key={club.id}
                  activeOpacity={0.7}
                  onPress={() => onNavigate(`/clubs/${club.id}`)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: hp(1.5),
                  }}
                >
                  <View
                    style={{
                      width: hp(3.5),
                      height: hp(3.5),
                      borderRadius: hp(0.5),
                      backgroundColor: theme.colors.bondedPurple,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: wp(2),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: hp(1.5),
                        fontWeight: '700',
                        color: theme.colors.white,
                      }}
                    >
                      {club.name.charAt(0)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: hp(1.5),
                      color: theme.colors.offWhite,
                      opacity: 0.9,
                      fontFamily: theme.typography.fontFamily.body,
                      flex: 1,
                    }}
                  >
                    {club.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Create Organization */}
          <View
            style={{
              paddingVertical: hp(2),
              paddingHorizontal: wp(4),
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigate('/clubs/create')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: hp(1.5),
              }}
            >
              <View
                style={{
                  width: hp(3.5),
                  height: hp(3.5),
                  borderRadius: hp(0.5),
                  backgroundColor: 'rgba(164, 92, 255, 0.2)',
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
            <DrawerItem
              icon="people-outline"
              label="My Network"
              onPress={() => onNavigate('/yearbook')}
            />
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
            <DrawerItem
              icon="school-outline"
              label="Rate My Professor"
              onPress={() => onNavigate('/rate-professor')}
            />
            <DrawerItem
              icon="people-circle-outline"
              label="Clubs & Organizations"
              onPress={() => onNavigate('/clubs')}
            />
            <DrawerItem
              icon="sparkles"
              label="Link AI"
              onPress={() => onNavigate('/link-ai')}
            />
          </View>

          {/* Settings */}
          <View
            style={{
              paddingTop: hp(2),
              paddingHorizontal: wp(4),
              borderTopWidth: 1,
              borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
                color={theme.colors.offWhite}
                style={{ opacity: 0.9, marginRight: wp(3) }}
              />
              <Text
                style={{
                  fontSize: hp(1.8),
                  color: theme.colors.white,
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
  const drawerRef = useRef<DrawerLayout | null>(null)

  const navigateAndClose = (path: string) => {
    router.push(path as never)
    drawerRef.current?.closeDrawer()
  }

  const renderDrawer = () => {
    return <DrawerContent onNavigate={navigateAndClose} />
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <DrawerLayout
          ref={drawerRef}
          drawerWidth={SCREEN_WIDTH * 0.75}
          drawerPosition="left"
          drawerType="front"
          edgeWidth={SCREEN_WIDTH * 0.4}
          renderNavigationView={renderDrawer}
        >
          <StoriesProvider>
            <EventsProvider>
              <ClubsProvider>
                <QueryProvider>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      gestureEnabled: false,
                      animation: 'none',
                    }}
                  />
                </QueryProvider>
              </ClubsProvider>
            </EventsProvider>
          </StoriesProvider>
        </DrawerLayout>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

export default RootLayout

