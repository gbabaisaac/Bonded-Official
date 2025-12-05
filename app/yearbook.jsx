import React, { useMemo, useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, Pressable, ScrollView, Platform, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Filter, ArrowLeft, MoreHorizontal, School, Calendar, User, MapPin, UserPlus, MessageCircle, X } from '../components/Icons'
import { useRouter } from 'expo-router'
import { hp, wp } from '../helpers/common'
import BottomNav from '../components/BottomNav'
import Picker from '../components/Picker'
import AppTopBar from '../components/AppTopBar'
import AppCard from '../components/AppCard'
import { LinearGradient } from 'expo-linear-gradient'
import { generateProfiles } from '../services/profileGenerator'
import { fetchMultiplePhotos, getPhotoUrl } from '../services/unsplashService'
import { useAppTheme } from './theme'
import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

const YEARS = ['2025', '2024', '2023', '2022']

export default function Yearbook() {
  const router = useRouter()
  const theme = useAppTheme()
  const [selectedYear, setSelectedYear] = useState(YEARS[0])
  const [sortOption, setSortOption] = useState('recent')
  const [gradeFilter, setGradeFilter] = useState(null)
  const [ageFilter, setAgeFilter] = useState(null)
  const [majorFilter, setMajorFilter] = useState(null)
  const [genderFilter, setGenderFilter] = useState(null)
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false)
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

  const filteredProfiles = useMemo(() => {
    if (profiles.length === 0) return []
    
    let result = profiles.filter((p) => p.year === selectedYear)

    if (gradeFilter) {
      result = result.filter((p) => p.grade === gradeFilter)
    }

    if (majorFilter) {
      result = result.filter((p) => p.major === majorFilter)
    }

    if (genderFilter) {
      result = result.filter((p) => p.gender === genderFilter)
    }

    if (ageFilter) {
      result = result.filter((p) => {
        if (ageFilter === '18-19') return p.age >= 18 && p.age <= 19
        if (ageFilter === '20-21') return p.age >= 20 && p.age <= 21
        if (ageFilter === '22+') return p.age >= 22
        return true
      })
    }

    // Simple sort mock
    if (sortOption === 'alpha') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [profiles, selectedYear, gradeFilter, majorFilter, genderFilter, ageFilter, sortOption])

  const numColumns = 3
  const gap = wp(1.5) // Gap between columns
  const padding = wp(2) // Horizontal padding matches listContent
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
            {/* Purple Badge - Below Quote */}
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{item.major.split(' ')[0]}</Text>
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
          <AppTopBar
            schoolName="University of Rhode Island"
            onPressProfile={() => router.push('/profile')}
            onPressSchool={() => {}}
            onPressNotifications={() => router.push('/notifications')}
          />

          {/* University and Year Header */}
          <View style={styles.headerContent}>
            <Text style={styles.universityYearTitle}>
              University of Rhode Island {selectedYear}
            </Text>
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
        </Animated.View>

        {/* Profile Grid - Instagram Style */}
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
                      // TODO: Open menu
                    }}
                  >
                    <View style={styles.profileModalTopBarCircle}>
                      <MoreHorizontal size={hp(2)} color={theme.colors.textPrimary} strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.profileModalScrollView}
                  contentContainerStyle={styles.profileModalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Hero Image Section */}
                  <View style={styles.profileModalHeroSection}>
                    <Image source={{ uri: activeProfile.photoUrl }} style={styles.profileModalHeroImage} />
                    
                    {/* Photo Carousel Dots (if multiple photos) */}
                    <View style={styles.profileModalCarouselDots}>
                      <View style={[styles.profileModalDot, styles.profileModalDotActive]} />
                      <View style={styles.profileModalDot} />
                      <View style={styles.profileModalDot} />
                    </View>
                  </View>

                  {/* Profile Info Section */}
                  <View style={styles.profileModalInfoSection}>
                    {/* Name */}
                    <Text style={styles.profileModalName}>{activeProfile.name}</Text>
                    
                    {/* Handle (generated from name) */}
                    <Text style={styles.profileModalHandle}>
                      @{activeProfile.name.toLowerCase().replace(/\s+/g, '').slice(0, 8)}
                    </Text>
                    
                    {/* GroupJam Score */}
                    <View style={styles.profileModalGroupJamScore}>
                      <View style={styles.groupJamScoreRow}>
                        <Text style={styles.groupJamScoreLabel}>GroupJam Score</Text>
                        <Text style={styles.groupJamScoreValue}>{activeProfile.groupjamScore || 85}%</Text>
                      </View>
                      <View style={styles.groupJamScoreBar}>
                        <View 
                          style={[
                            styles.groupJamScoreFill, 
                            { width: `${activeProfile.groupjamScore || 85}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.groupJamScoreDescription}>
                        High compatibility for friendship
                      </Text>
                    </View>
                    
                    {/* Bio (using quote) */}
                    <Text style={styles.profileModalBio}>{activeProfile.quote}</Text>
                    
                    {/* Action Buttons */}
                    <View style={styles.profileModalActionButtonsRow}>
                      <TouchableOpacity
                        style={styles.profileModalActionButtonSecondary}
                        activeOpacity={0.7}
                        onPress={() => {
                          // TODO: Add friend
                        }}
                      >
                        <UserPlus size={hp(2)} color={theme.colors.textPrimary} strokeWidth={2} />
                        <Text style={styles.profileModalActionButtonSecondaryText}>Add friend</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.profileModalActionButtonPrimary}
                        activeOpacity={0.7}
                        onPress={() => {
                          // TODO: Navigate to messages
                        }}
                      >
                        <MessageCircle size={hp(2)} color={theme.colors.white} strokeWidth={2} />
                        <Text style={styles.profileModalActionButtonPrimaryText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Meta Info Pills */}
                    <View style={styles.profileModalMetaRow}>
                      <View style={styles.profileModalMetaPill}>
                        <School
                          size={hp(1.6)}
                          color={theme.colors.textSecondary}
                          strokeWidth={2}
                          style={{ marginRight: wp(1) }}
                        />
                        <Text style={styles.profileModalMetaPillText}>
                          {activeProfile.major}
                        </Text>
                      </View>
                      <View style={styles.profileModalMetaPill}>
                        <Calendar
                          size={hp(1.6)}
                          color={theme.colors.textSecondary}
                          strokeWidth={2}
                          style={{ marginRight: wp(1) }}
                        />
                        <Text style={styles.profileModalMetaPillText}>
                          Class of {activeProfile.year}
                        </Text>
                      </View>
                      <View style={styles.profileModalMetaPill}>
                        <User
                          size={hp(1.6)}
                          color={theme.colors.textSecondary}
                          strokeWidth={2}
                          style={{ marginRight: wp(1) }}
                        />
                        <Text style={styles.profileModalMetaPillText}>
                          {activeProfile.grade}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Tags Section */}
                    <View style={styles.profileModalTagsSection}>
                      <Text style={styles.profileModalTagsTitle}>Highlights</Text>
                      <View style={styles.profileModalTagsRow}>
                        <View style={styles.profileModalTag}>
                          <Text style={styles.profileModalTagText}>Interests</Text>
                        </View>
                        <View style={styles.profileModalTag}>
                          <Text style={styles.profileModalTagText}>Study matches</Text>
                        </View>
                        <View style={styles.profileModalTag}>
                          <Text style={styles.profileModalTagText}>Roommate fit</Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Location */}
                    <View style={styles.profileModalLocationRow}>
                      <MapPin size={hp(1.8)} color={theme.colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.profileModalLocationText}>
                        {activeProfile.location || 'University of Rhode Island'}
                      </Text>
                    </View>
                    
                    {/* Interests Section */}
                    {activeProfile.interests && activeProfile.interests.length > 0 && (
                      <View style={styles.profileModalTagsSection}>
                        <Text style={styles.profileModalTagsTitle}>Interests</Text>
                        <View style={styles.profileModalTagsRow}>
                          {activeProfile.interests.slice(0, 6).map((interest, idx) => (
                            <View key={idx} style={styles.profileModalTag}>
                              <Text style={styles.profileModalTagText}>{interest}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
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
                    color={theme.colors.charcoal}
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
  },
  filterIconButton: {
    padding: hp(0.5),
  },
  universityYearTitle: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: wp(2), // Add padding for text readability
    paddingTop: hp(12), // Moved higher since we removed the yearbook label
    paddingBottom: hp(10), // Space for bottom nav
  },
  cardRow: {
    justifyContent: 'flex-start',
    marginBottom: hp(2.5), // More space between rows for text
    gap: wp(1.5), // Gap between columns
  },
  cardWrapper: {
    marginBottom: hp(2),
  },
  card: {
    overflow: 'hidden',
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
    backgroundColor: theme.colors.accent,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: 9999,
    marginTop: hp(1),
  },
  cardBadgeText: {
    fontSize: hp(1.1),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(3),
    zIndex: 1,
  },
  cardName: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: hp(0.2),
  },
  cardMajor: {
    fontSize: hp(1.3),
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  cardInfo: {
    padding: wp(3),
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
    backgroundColor: theme.colors.white,
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
    justifyContent: 'space-between',
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
  profileModalCarouselDots: {
    position: 'absolute',
    bottom: hp(2),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(1.5),
  },
  profileModalDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileModalDotActive: {
    backgroundColor: theme.colors.info, // Blue color
    width: wp(2.5),
    height: wp(2.5),
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
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  profileModalTagText: {
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
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
    backgroundColor: theme.colors.white,
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



