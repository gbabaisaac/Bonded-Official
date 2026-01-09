import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppCard from '../components/AppCard'
import AppTopBar from '../components/AppTopBar'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Calendar, MessageCircle, School } from '../components/Icons'
import { hp, wp } from '../helpers/common'
import { generateProfiles } from '../services/profileGenerator'
import { fetchMultiplePhotos, getPhotoUrl } from '../services/unsplashService'
import { useAppTheme } from './theme'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

// Mock connections - in production, this would come from a relationships/friends API
const getConnections = (allProfiles) => {
  // For demo purposes, return first 50 profiles as "connections"
  // In production, filter by actual friend/connection relationships
  return allProfiles.slice(0, 50)
}

export default function Network() {
  const router = useRouter()
  const theme = useAppTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeProfile, setActiveProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const scrollY = useRef(new Animated.Value(0)).current
  const lastScrollY = useRef(0)
  const headerTranslateY = useRef(new Animated.Value(0)).current
  const isAnimating = useRef(false)

  // Generate profiles on mount - cached per session
  useEffect(() => {
    const generateData = async () => {
      setIsLoading(true)
      try {
        // Fetch photos from Unsplash (will use cache if available)
        const photoUrls = await fetchMultiplePhotos(200)
        
        // Generate profiles with Unsplash photos
        const generatedProfiles = generateProfiles(200, (width, height, seed) => {
          // Extract index from seed (e.g., "profile-5" -> 5)
          let index = 0
          if (seed && seed.startsWith('profile-')) {
            index = parseInt(seed.replace('profile-', '')) || 0
          }
          // Use the fetched Unsplash photos, fallback to Picsum if needed
          return photoUrls[index] || getPhotoUrl(width, height, seed)
        })
        
        setProfiles(generatedProfiles)
      } catch (error) {
        console.error('❌ Error generating profiles:', error)
        // Fallback to Picsum Photos
        const generatedProfiles = generateProfiles(200, getPhotoUrl)
        setProfiles(generatedProfiles)
      } finally {
        setIsLoading(false)
      }
    }
    generateData()
  }, [])

  const connections = useMemo(() => {
    return getConnections(profiles)
  }, [profiles])

  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections
    
    const query = searchQuery.toLowerCase()
    return connections.filter((profile) => {
      return (
        profile.name.toLowerCase().includes(query) ||
        profile.major.toLowerCase().includes(query) ||
        (profile.quote && profile.quote.toLowerCase().includes(query))
      )
    })
  }, [connections, searchQuery])

  const numColumns = 3
  const gap = theme.spacing.sm
  const padding = theme.spacing.sm
  const cardWidth = (wp(100) - (padding * 2) - (gap * (numColumns - 1))) / numColumns

  const renderProfileCard = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={[styles.cardWrapper, { width: cardWidth }]}
        activeOpacity={0.9}
        onPress={() => {
          setActiveProfile(item)
        }}
      >
        <AppCard radius="md" padding={false} style={styles.card}>
          <View style={styles.cardImageWrapper}>
            <Image source={{ uri: item.photoUrl }} style={styles.cardImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
              style={styles.cardGradient}
            />
            {/* Name Over Image */}
            <View style={styles.cardOverlayContent}>
              <Text numberOfLines={1} style={styles.cardName}>
                {item.name}
              </Text>
            </View>
          </View>
          {/* Tagline and Major Badge */}
          <View style={styles.cardInfo}>
            <Text numberOfLines={2} style={styles.cardQuote}>
              {item.quote}
            </Text>
            {/* Major Badge - Below Quote */}
            <View style={styles.cardBadge}>
              <Text 
                style={styles.cardBadgeText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.major.split(' ')[0]}
              </Text>
            </View>
          </View>
        </AppCard>
      </TouchableOpacity>
    )
  }

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y
        const scrollDifference = currentScrollY - lastScrollY.current
  
        // Prevent multiple animations from running
        if (isAnimating.current) {
          lastScrollY.current = currentScrollY
          return
        }
  
        // Ignore small scrolls
        if (Math.abs(scrollDifference) < 3) {
          return
        }
  
        if (currentScrollY <= 0) {
          // At the very top - always show
          isAnimating.current = true
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            isAnimating.current = false
          })
        } else if (scrollDifference > 0) {
          // Scrolling down - hide header
          isAnimating.current = true
          Animated.timing(headerTranslateY, {
            toValue: -200,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            isAnimating.current = false
          })
        } else if (scrollDifference < 0) {
          // Scrolling up - show header
          isAnimating.current = true
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            isAnimating.current = false
          })
        }
  
        lastScrollY.current = currentScrollY
      },
    }
  )

  const styles = createStyles(theme)

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Animated.View
          style={{
            transform: [{ translateY: headerTranslateY }],
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: theme.colors.background,
            paddingHorizontal: wp(4),
          }}
        >
          <AppTopBar
            schoolName="My Network"
            onPressProfile={() => router.push('/profile')}
            onPressSchool={() => {}}
            onPressNotifications={() => router.push('/notifications')}
          />

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={hp(2)}
              color={theme.colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search connections..."
              placeholderTextColor={theme.colors.textSecondary + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={hp(2)}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Header Info */}
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {filteredConnections.length} {filteredConnections.length === 1 ? 'Connection' : 'Connections'}
            </Text>
          </View>
        </Animated.View>

        {/* Profile Grid */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading connections...</Text>
          </View>
        ) : (
          <AnimatedFlatList
            data={filteredConnections}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            columnWrapperStyle={numColumns > 1 ? styles.cardRow : null}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={renderProfileCard}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="people-outline"
                  size={hp(6)}
                  color={theme.colors.textSecondary}
                  style={{ opacity: 0.3 }}
                />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No connections found' : 'No connections yet'}
                </Text>
                {searchQuery && (
                  <Text style={styles.emptyStateSubtext}>
                    Try searching with a different name
                  </Text>
                )}
              </View>
            }
          />
        )}

        {/* Profile Modal */}
        <Modal
          visible={!!activeProfile}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveProfile(null)}
        >
          <View style={styles.profileModalContainer}>
            {activeProfile && (
              <>
                {/* Top Bar Overlay */}
                <View style={styles.profileModalTopBar}>
                  <TouchableOpacity
                    style={styles.profileModalTopBarButton}
                    activeOpacity={0.7}
                    onPress={() => setActiveProfile(null)}
                  >
                    <View style={styles.profileModalTopBarCircle}>
                      <ArrowLeft size={hp(2)} color={theme.colors.textPrimary} strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileModalTopBarButton}
                    activeOpacity={0.7}
                    onPress={() => {
                      router.push(`/messages?userId=${activeProfile.id}`)
                      setActiveProfile(null)
                    }}
                  >
                    <View style={styles.profileModalTopBarCircle}>
                      <MessageCircle size={hp(2)} color={theme.colors.textPrimary} strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.profileModalScroll}
                  contentContainerStyle={styles.profileModalContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Profile Image */}
                  <View style={styles.profileModalImageContainer}>
                    <Image
                      source={{ uri: activeProfile.photoUrl }}
                      style={styles.profileModalImage}
                    />
                  </View>

                  {/* Profile Info */}
                  <View style={styles.profileModalInfo}>
                    <Text style={styles.profileModalName}>{activeProfile.name}</Text>
                    <Text style={styles.profileModalMajor}>{activeProfile.major}</Text>
                    {activeProfile.quote && (
                      <Text style={styles.profileModalQuote}>"{activeProfile.quote}"</Text>
                    )}
                    
                    {/* Details */}
                    <View style={styles.profileModalDetails}>
                      <View style={styles.profileModalDetailItem}>
                        <School size={hp(2)} color={theme.colors.textSecondary} />
                        <Text style={styles.profileModalDetailText}>
                          {activeProfile.grade} • {activeProfile.year}
                        </Text>
                      </View>
                      {activeProfile.age && (
                        <View style={styles.profileModalDetailItem}>
                          <Calendar size={hp(2)} color={theme.colors.textSecondary} />
                          <Text style={styles.profileModalDetailText}>
                            Age {activeProfile.age}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </Modal>

        <BottomNav />
      </View>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  headerContent: {
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
  },
  loadingText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  listContent: {
    paddingTop: hp(18),
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: hp(10),
  },
  cardRow: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  cardWrapper: {
    marginBottom: theme.spacing.sm,
  },
  card: {
    overflow: 'hidden',
  },
  cardImageWrapper: {
    width: '100%',
    height: hp(20),
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  cardOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.sm,
  },
  cardName: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  cardInfo: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  cardQuote: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.sizes.base * 1.4,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
  },
  cardBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.accent,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  profileModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileModalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(2),
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  profileModalTopBarButton: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalTopBarCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalScroll: {
    flex: 1,
  },
  profileModalContent: {
    paddingBottom: hp(10),
  },
  profileModalImageContainer: {
    width: '100%',
    height: hp(40),
    backgroundColor: theme.colors.backgroundSecondary,
  },
  profileModalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileModalInfo: {
    padding: theme.spacing.lg,
  },
  profileModalName: {
    fontSize: theme.typography.sizes.xxl,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  profileModalMajor: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  profileModalQuote: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    fontStyle: 'italic',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    lineHeight: theme.typography.sizes.base * 1.6,
  },
  profileModalDetails: {
    gap: theme.spacing.md,
  },
  profileModalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  profileModalDetailText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
})










