import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Animated, FlatList, Image, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppCard from '../components/AppCard'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Calendar, Check, Clock, Filter, MapPin, MessageCircle, School, User, UserMinus, UserPlus, X } from '../components/Icons'
import Picker from '../components/Picker'
import { hp, wp } from '../helpers/common'
import { useFriendshipStatus, useSendFriendRequest, useAcceptFriendRequest, useCancelFriendRequest, useRemoveFriend } from '../hooks/useFriends'
import { useProfiles } from '../hooks/useProfiles'
import { useCreateConversation } from '../hooks/useMessages'
import { useAuthStore } from '../stores/authStore'
import { useAppTheme } from './theme'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

const YEARS = ['All', '2025', '2024', '2023', '2022']

// Profile Modal Component - extracted to use hooks
const ProfileModalContent = ({ activeProfile, setActiveProfile, theme, router, currentUserInterests }) => {
  if (!activeProfile) return null

  // Track scroll position for pull-to-dismiss
  const scrollY = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  // Friend status hooks
  const { data: friendshipStatus, isLoading: statusLoading } = useFriendshipStatus(activeProfile.id)
  const sendRequest = useSendFriendRequest()
  const acceptRequest = useAcceptFriendRequest()
  const cancelRequest = useCancelFriendRequest()
  const removeFriend = useRemoveFriend()
  const createConversation = useCreateConversation()

  const handleFriendAction = () => {
    switch (friendshipStatus?.status) {
      case 'none':
        sendRequest.mutate({ receiverId: activeProfile.id })
        break
      case 'request_sent':
        Alert.alert(
          'Cancel Request?',
          'Are you sure you want to cancel this friend request?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes, Cancel', style: 'destructive', onPress: () => {
              cancelRequest.mutate({ requestId: friendshipStatus.requestId })
            }}
          ]
        )
        break
      case 'request_received':
        acceptRequest.mutate({ 
          requestId: friendshipStatus.requestId, 
          senderId: activeProfile.id 
        })
        break
      case 'friends':
        Alert.alert(
          'Remove Friend?',
          `Are you sure you want to remove ${activeProfile.name} as a friend?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => {
              removeFriend.mutate({ friendId: activeProfile.id })
            }}
          ]
        )
        break
    }
  }

  const handleMessage = async () => {
    try {
      const conversationId = await createConversation.mutateAsync({ 
        otherUserId: activeProfile.id 
      })
      setActiveProfile(null)
      router.push({
        pathname: '/chat',
        params: { 
          conversationId,
          userId: activeProfile.id, 
          userName: activeProfile.name 
        }
      })
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const getFriendButtonConfig = () => {
    if (statusLoading) {
      return { icon: null, text: 'Loading...', loading: true, style: 'secondary' }
    }
    switch (friendshipStatus?.status) {
      case 'friends':
        return { icon: Check, text: 'Friends', style: 'friends' }
      case 'request_sent':
        return { icon: Clock, text: 'Pending', style: 'pending' }
      case 'request_received':
        return { icon: UserPlus, text: 'Accept', style: 'accept' }
      default:
        return { icon: UserPlus, text: 'Add friend', style: 'secondary' }
    }
  }

  const buttonConfig = getFriendButtonConfig()
  const isActionLoading = sendRequest.isPending || cancelRequest.isPending || 
                          acceptRequest.isPending || removeFriend.isPending

  // Pull-to-dismiss handlers
  const handleScroll = useCallback((event) => {
    scrollY.current = event.nativeEvent.contentOffset.y
  }, [])

  const handleScrollBeginDrag = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleScrollEndDrag = useCallback((event) => {
    setIsDragging(false)
    const offsetY = event.nativeEvent.contentOffset.y
    // If user is at top and pulls down past threshold, dismiss
    if (offsetY < -80) {
      setActiveProfile(null)
    }
  }, [setActiveProfile])

  const styles = createProfileModalStyles(theme)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Drag indicator at very top */}
      <View style={styles.dragIndicatorContainer}>
        <View style={styles.dragIndicator} />
      </View>
      
      {/* Hero Image - extends past notch */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: activeProfile.photoUrl }} 
          style={styles.heroImage} 
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent', 'rgba(0,0,0,0.5)']}
          style={styles.heroGradient}
        />
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => setActiveProfile(null)}
        >
          <View style={styles.backButtonCircle}>
            <ArrowLeft size={hp(2)} color="#fff" strokeWidth={2} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
      >
        {/* Name */}
        <Text style={styles.name}>{activeProfile.name}</Text>
        
        {/* Handle */}
        <Text style={styles.handle}>
          @{activeProfile.name.toLowerCase().replace(/\s+/g, '').slice(0, 8)}
        </Text>
        
        {/* Bio */}
        <Text style={styles.bio}>{activeProfile.quote}</Text>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              buttonConfig.style === 'friends' && styles.actionButtonFriends,
              buttonConfig.style === 'pending' && styles.actionButtonPending,
              buttonConfig.style === 'accept' && styles.actionButtonAccept,
              buttonConfig.style === 'secondary' && styles.actionButtonSecondary,
            ]}
            activeOpacity={0.7}
            onPress={handleFriendAction}
            disabled={isActionLoading || buttonConfig.loading}
          >
            {isActionLoading || buttonConfig.loading ? (
              <ActivityIndicator size="small" color={theme.colors.textPrimary} />
            ) : (
              <>
                {buttonConfig.icon && (
                  <buttonConfig.icon 
                    size={hp(2)} 
                    color={buttonConfig.style === 'accept' ? theme.colors.white : theme.colors.textPrimary} 
                    strokeWidth={2} 
                  />
                )}
                <Text style={[
                  styles.actionButtonText,
                  buttonConfig.style === 'accept' && styles.actionButtonTextAccept
                ]}>
                  {buttonConfig.text}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButtonPrimary}
            activeOpacity={0.7}
            onPress={handleMessage}
            disabled={createConversation.isPending}
          >
            {createConversation.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <>
                <MessageCircle size={hp(2)} color={theme.colors.white} strokeWidth={2} />
                <Text style={styles.actionButtonPrimaryText}>Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Meta Info Pills */}
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <School size={hp(1.6)} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={styles.metaPillText}>{activeProfile.major}</Text>
          </View>
          <View style={styles.metaPill}>
            <Calendar size={hp(1.6)} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={styles.metaPillText}>Class of {activeProfile.year}</Text>
          </View>
          {activeProfile.grade && (
            <View style={styles.metaPill}>
              <User size={hp(1.6)} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={styles.metaPillText}>{activeProfile.grade}</Text>
            </View>
          )}
        </View>
        
        {/* Location */}
        <View style={styles.locationRow}>
          <MapPin size={hp(1.8)} color={theme.colors.textSecondary} strokeWidth={2} />
          <Text style={styles.locationText}>
            {activeProfile.location || activeProfile.university || 'University of Rhode Island'}
          </Text>
        </View>
        
        {/* Interests Section */}
        {activeProfile.interests && activeProfile.interests.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsTitle}>Interests</Text>
            <View style={styles.tagsRow}>
              {activeProfile.interests.slice(0, 8).map((interest, idx) => {
                const isShared = currentUserInterests.has(interest)
                return (
                  <View 
                    key={idx} 
                    style={[styles.tag, isShared && styles.tagShared]}
                  >
                    {isShared && (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={hp(1.4)} 
                        color={theme.colors.bondedPurple} 
                        style={{ marginRight: wp(1) }}
                      />
                    )}
                    <Text style={[styles.tagText, isShared && styles.tagTextShared]}>
                      {interest}
                    </Text>
                  </View>
                )
              })}
            </View>
            {currentUserInterests.size > 0 && (
              <Text style={styles.sharedHint}>Highlighted interests match yours</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

// Styles for ProfileModalContent
const createProfileModalStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dragIndicatorContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp(6) : hp(3),
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
    paddingVertical: hp(0.5),
  },
  dragIndicator: {
    width: wp(10),
    height: hp(0.5),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: hp(0.25),
  },
  heroSection: {
    width: '100%',
    height: hp(50),
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp(6) : hp(4),
    left: wp(4),
    zIndex: 10,
  },
  backButtonCircle: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
    paddingBottom: hp(10),
  },
  name: {
    fontSize: hp(3.2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.5),
    letterSpacing: -0.3,
  },
  handle: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(2),
  },
  bio: {
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.5),
    marginBottom: hp(3),
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginBottom: hp(2.5),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.3),
    borderRadius: theme.radius.lg,
    gap: wp(2),
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  actionButtonFriends: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1.5,
    borderColor: '#22c55e',
  },
  actionButtonPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
  },
  actionButtonAccept: {
    backgroundColor: theme.colors.bondedPurple,
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
  actionButtonTextAccept: {
    color: theme.colors.white,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.3),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.info,
    gap: wp(2),
  },
  actionButtonPrimaryText: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(2.5),
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    gap: wp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metaPillText: {
    fontSize: hp(1.4),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginBottom: hp(2.5),
  },
  locationText: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  tagsSection: {
    marginBottom: hp(2.5),
  },
  tagsTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(1.2),
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.9),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagShared: {
    backgroundColor: theme.colors.bondedPurple + '20',
    borderColor: theme.colors.bondedPurple,
  },
  tagText: {
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  tagTextShared: {
    color: theme.colors.bondedPurple,
    fontWeight: '600',
  },
  sharedHint: {
    fontSize: hp(1.2),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(1),
    fontStyle: 'italic',
  },
})

export default function Yearbook() {
  const router = useRouter()
  const theme = useAppTheme()
  const { user } = useAuthStore()
  const [selectedYear, setSelectedYear] = useState('All') // Show all profiles by default
  const [sortOption, setSortOption] = useState('recent')
  const [gradeFilter, setGradeFilter] = useState(null)
  const [ageFilter, setAgeFilter] = useState(null)
  const [majorFilter, setMajorFilter] = useState(null)
  const [genderFilter, setGenderFilter] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false)
  const [activeProfile, setActiveProfile] = useState(null)
  const scrollY = useRef(new Animated.Value(0)).current
  const lastScrollY = useRef(0)
  const headerTranslateY = useRef(new Animated.Value(0)).current
  const isAnimating = useRef(false)

  // Build filters for the query
  const filters = {
    graduationYear: selectedYear && selectedYear !== 'All' ? parseInt(selectedYear) : null,
    grade: gradeFilter,
    major: majorFilter,
    gender: genderFilter,
    searchQuery: searchQuery.trim() || null,
    ageMin: ageFilter === '18-19' ? 18 : ageFilter === '20-21' ? 20 : ageFilter === '22+' ? 22 : null,
    ageMax: ageFilter === '18-19' ? 19 : ageFilter === '20-21' ? 21 : null,
  }

  // Fetch profiles from Supabase
  const { data: profiles = [], isLoading, error, refetch } = useProfiles(filters)

  const yearOptions = YEARS.map((year) => ({ value: year, label: year }))

  const gradeOptions = [
    { value: 'Freshman', label: 'Freshman' },
    { value: 'Sophomore', label: 'Sophomore' },
    { value: 'Junior', label: 'Junior' },
    { value: 'Senior', label: 'Senior' },
  ]

  const ageOptions = [
    { value: '18-19', label: '18–19' },
    { value: '20-21', label: '20–21' },
    { value: '22+', label: '22+' },
  ]

  const majorOptions = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Business Administration', label: 'Business Administration' },
    { value: 'Psychology', label: 'Psychology' },
    { value: 'Biology', label: 'Biology' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Communications', label: 'Communications' },
    { value: 'Economics', label: 'Economics' },
    { value: 'English', label: 'English' },
    { value: 'Political Science', label: 'Political Science' },
    { value: 'Art & Design', label: 'Art & Design' },
    { value: 'Nursing', label: 'Nursing' },
    { value: 'Education', label: 'Education' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Data Science', label: 'Data Science' },
  ]

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
  ]

  const sortOptions = [
    { value: 'recent', label: 'Recently active' },
    { value: 'newest', label: 'Newest profiles' },
    { value: 'alpha', label: 'A–Z' },
  ]

  // Get current user's profile and interests for comparison
  const currentUserProfile = useMemo(() => {
    return profiles.find(p => p.id === user?.id)
  }, [profiles, user?.id])

  const currentUserInterests = useMemo(() => {
    return new Set(currentUserProfile?.interests || [])
  }, [currentUserProfile])

  // Apply sorting and put current user first (filtering is done in the query)
  const filteredProfiles = useMemo(() => {
    if (profiles.length === 0) return []
    
    // Separate current user from others
    const currentUser = profiles.find(p => p.id === user?.id)
    let others = profiles.filter(p => p.id !== user?.id)

    // Apply sorting to others
    if (sortOption === 'alpha') {
      others = others.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortOption === 'recent') {
      // Already sorted by created_at DESC from query
    } else if (sortOption === 'newest') {
      // Already sorted by created_at DESC from query
    }

    // Put current user first (marked as "You")
    if (currentUser) {
      return [{ ...currentUser, isCurrentUser: true }, ...others]
    }

    return others
  }, [profiles, sortOption, user?.id])

  const numColumns = 3
  const gap = theme.spacing.sm // Gap between columns
  const padding = theme.spacing.sm // Horizontal padding matches listContent
  const cardWidth = (wp(100) - (padding * 2) - (gap * (numColumns - 1))) / numColumns

  const renderProfileCard = ({ item, index }) => {
    const isYou = item.isCurrentUser
    
    return (
      <TouchableOpacity
        style={[styles.cardWrapper, { width: cardWidth }]}
        activeOpacity={0.9}
        onPress={() => {
          if (isYou) {
            router.push('/profile')
          } else {
            setActiveProfile(item)
          }
        }}
      >
        <AppCard radius="md" padding={false} style={[styles.card, isYou && styles.cardYou]}>
          <View style={styles.cardImageWrapper}>
            <Image source={{ uri: item.photoUrl }} style={styles.cardImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
              style={styles.cardGradient}
            />
            {/* "You" Badge for current user */}
            {isYou && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>You</Text>
              </View>
            )}
            {/* Name Over Image */}
            <View style={styles.cardOverlayContent}>
              <Text numberOfLines={1} style={styles.cardName}>
                {isYou ? 'You' : item.name}
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
                {item.major?.split(' ')[0] || 'Undeclared'}
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
            toValue: -250,
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
          {/* Top Bar with Bonded logo and notification */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.topBarButton}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={hp(2.4)} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.topBarCenter}>
              <Image
                source={require('../assets/images/transparent-bonded.png')}
                style={styles.topBarLogo}
                resizeMode="contain"
              />
              <Text style={styles.topBarTitle}>Bonded</Text>
            </View>
            
            <TouchableOpacity
              style={styles.topBarButton}
              activeOpacity={0.7}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={hp(2.4)} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* University and Year Header */}
          <View style={styles.headerContent}>
            <Text style={styles.universityYearTitle}>
              University of Rhode Island {selectedYear}
            </Text>
            
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
                placeholder="Search by name..."
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
            
            {/* Filter button only */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.filterIconButton}
                activeOpacity={0.7}
                onPress={() => setIsFilterModalVisible(true)}
              >
                <Filter
                  size={hp(2.2)}
                  color={theme.colors.textSecondary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Profile Grid - Instagram Style */}
        {error && (
          <View style={styles.errorState}>
            <Text style={styles.errorStateText}>
              Failed to load profiles. Please try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profiles...</Text>
          </View>
        ) : (
          <AnimatedFlatList
            data={filteredProfiles}
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
                  {searchQuery ? 'No profiles found' : 'No profiles available'}
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
          transparent={false}
          animationType="slide"
          presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
          onRequestClose={() => setActiveProfile(null)}
        >
          <ProfileModalContent 
            activeProfile={activeProfile}
            setActiveProfile={setActiveProfile}
            theme={theme}
            router={router}
            currentUserInterests={currentUserInterests}
          />
        </Modal>

        {/* Filters Modal */}
        <Modal
          visible={isFilterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsFilterModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsFilterModalVisible(false)}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity
                  onPress={() => setIsFilterModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <X
                    size={hp(2.6)}
                    color={theme.colors.textPrimary}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              </View>

              {/* Pickers inside modal (scrollable) */}
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator={false}
              >
                <Picker
                  label="Year"
                  placeholder="Select year"
                  value={selectedYear}
                  options={yearOptions}
                  onValueChange={setSelectedYear}
                  containerStyle={styles.modalPicker}
                />

                <Picker
                  label="Sort"
                  placeholder="Sort by"
                  value={sortOption}
                  options={sortOptions}
                  onValueChange={setSortOption}
                  containerStyle={styles.modalPicker}
                />

                <Picker
                  label="Class Year"
                  placeholder="All classes"
                  value={gradeFilter}
                  options={gradeOptions}
                  onValueChange={setGradeFilter}
                  containerStyle={styles.modalPicker}
                />

                <Picker
                  label="Major"
                  placeholder="All majors"
                  value={majorFilter}
                  options={majorOptions}
                  onValueChange={setMajorFilter}
                  containerStyle={styles.modalPicker}
                />

                <Picker
                  label="Age"
                  placeholder="All ages"
                  value={ageFilter}
                  options={ageOptions}
                  onValueChange={setAgeFilter}
                  containerStyle={styles.modalPicker}
                />

                <Picker
                  label="Gender"
                  placeholder="Any gender"
                  value={genderFilter}
                  options={genderOptions}
                  onValueChange={setGenderFilter}
                  containerStyle={styles.modalPicker}
                />
              </ScrollView>

              {/* Modal Footer Actions */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalResetButton]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedYear(YEARS[0])
                    setSortOption('recent')
                    setGradeFilter(null)
                    setAgeFilter(null)
                    setMajorFilter(null)
                    setGenderFilter(null)
                  }}
                >
                  <Text style={styles.modalResetText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalApplyButton]}
                  activeOpacity={0.8}
                  onPress={() => setIsFilterModalVisible(false)}
                >
                  <Text style={styles.modalApplyText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Bottom Navigation */}
        <BottomNav scrollY={scrollY} />
      </View>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
  },
  topBarButton: {
    width: hp(4.5),
    height: hp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  topBarLogo: {
    width: hp(2.5),
    height: hp(2.5),
  },
  topBarTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    letterSpacing: -0.3,
  },
  headerContent: {
    paddingVertical: hp(1),
  },
  headerIconButton: {
    padding: hp(0.5),
  },
  filterIconButton: {
    padding: hp(0.5),
  },
  universityYearTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  listContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: hp(28),
    paddingBottom: hp(10),
  },
  cardRow: {
    justifyContent: 'flex-start',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cardWrapper: {
    marginBottom: hp(2),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  card: {
    overflow: 'hidden',
  },
  cardYou: {
    borderWidth: 2,
    borderColor: theme.colors.bondedPurple,
  },
  youBadge: {
    position: 'absolute',
    top: hp(1),
    right: hp(1),
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.pill,
    zIndex: 2,
  },
  youBadgeText: {
    fontSize: hp(1.1),
    fontWeight: '600',
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
  cardImageWrapper: {
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
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
    height: '40%',
  },
  cardBadge: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.md,
    maxWidth: '100%',
  },
  cardBadgeText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.accent,
  },
  cardOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    zIndex: 1,
  },
  cardName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  cardMajor: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.regular,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  cardInfo: {
    padding: theme.spacing.md,
    width: '100%',
  },
  cardQuote: {
    fontSize: hp(1.2),
    color: theme.colors.textSecondary,
    fontWeight: '400',
    lineHeight: hp(1.6),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  modalTitle: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  modalCloseButton: {
    padding: hp(0.5),
  },
  modalBody: {
    maxHeight: hp(55),
  },
  modalBodyContent: {
    paddingBottom: hp(1),
  },
  modalPicker: {
    marginBottom: hp(1.5),
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
    gap: wp(3),
  },
  modalButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetButton: {
    backgroundColor: theme.colors.surface,
  },
  modalApplyButton: {
    backgroundColor: theme.colors.accent,
  },
  modalResetText: {
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  modalApplyText: {
    fontSize: hp(1.8),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  profileModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: hp(12), // Start lower on screen
  },
  profileModalTopBar: {
    position: 'absolute',
    top: hp(12), // Match container padding
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(1),
    zIndex: 10,
  },
  profileModalTopBarButton: {
    zIndex: 11,
  },
  profileModalTopBarCircle: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileModalScrollView: {
    flex: 1,
  },
  profileModalScrollContent: {
    paddingBottom: hp(10),
  },
  profileModalHeroSection: {
    width: '100%',
    height: hp(32), // Further reduced height
    position: 'relative',
  },
  profileModalHeroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileModalInfoSection: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
    paddingBottom: hp(2),
  },
  profileModalName: {
    fontSize: hp(3.2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.5),
    letterSpacing: -0.3,
  },
  profileModalHandle: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(2),
    fontWeight: '400',
  },
  profileModalBio: {
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.5),
    marginBottom: hp(3),
  },
  profileModalActionButtonsRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginBottom: hp(2.5),
  },
  profileModalActionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.3),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
    gap: wp(2),
  },
  profileModalActionButtonSecondaryText: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
  profileModalActionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.3),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.info, // Blue button
    gap: wp(2),
  },
  profileModalActionButtonPrimaryText: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
  profileModalMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(2.5),
  },
  profileModalMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderWidth: 1.5,
    borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
  },
  profileModalMetaPillText: {
    fontSize: hp(1.4),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  profileModalTagsSection: {
    marginBottom: hp(2.5),
  },
  profileModalTagsTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(1.2),
  },
  profileModalTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  profileModalTag: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.9),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border,
  },
  profileModalTagText: {
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  profileModalTagShared: {
    backgroundColor: theme.colors.bondedPurple + '20',
    borderColor: theme.colors.bondedPurple,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileModalTagTextShared: {
    color: theme.colors.bondedPurple,
    fontWeight: '600',
  },
  sharedInterestsHint: {
    fontSize: hp(1.2),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(1),
    fontStyle: 'italic',
  },
  profileModalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginTop: hp(1),
  },
  profileModalLocationText: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  profileModalGroupJamScore: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(2.5),
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  groupJamScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
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
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
    paddingHorizontal: theme.spacing.lg,
  },
  errorStateText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.error || '#ef4444',
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary || theme.colors.bondedPurple,
    borderRadius: theme.radius.md,
  },
  retryButtonText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  groupJamScoreLabel: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  groupJamScoreValue: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.heading,
  },
  groupJamScoreBar: {
    height: hp(0.6),
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    marginBottom: hp(0.8),
  },
  groupJamScoreFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
  },
  groupJamScoreDescription: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
  },
  loadingText: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
})



