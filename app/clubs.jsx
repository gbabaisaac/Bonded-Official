import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import {
    FlatList,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppCard from '../components/AppCard'
import AppTopBar from '../components/AppTopBar'
import BottomNav from '../components/BottomNav'
import Chip from '../components/Chip'
import { useClubsContext } from '../contexts/ClubsContext'
import { hp, wp } from '../helpers/common'
import { useAppTheme } from './theme'

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'academic', label: 'Academic' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts' },
  { value: 'service', label: 'Service' },
  { value: 'business', label: 'Business' },
  { value: 'social', label: 'Social' },
]

export default function Clubs() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const { getAllClubs, isUserInterested, showInterest, removeInterest } = useClubsContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const allClubs = getAllClubs()

  const filteredClubs = useMemo(() => {
    return allClubs.filter((club) => {
      const matchesSearch =
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' || club.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [allClubs, searchQuery, selectedCategory])

  const handleInterest = (clubId) => {
    if (isUserInterested(clubId)) {
      removeInterest(clubId)
    } else {
      showInterest(clubId)
    }
  }

  const renderClubCard = ({ item }) => {
    const interested = isUserInterested(item.id)
    const memberCount = item.members?.length || 0

    return (
      <TouchableOpacity
        onPress={() => router.push(`/clubs/${item.id}`)}
        activeOpacity={0.7}
        style={styles.clubCardWrapper}
      >
        <AppCard radius="lg" padding={false} style={styles.clubCard}>
          {item.coverImage && (
            <View style={styles.clubImageWrapper}>
              <Image source={{ uri: item.coverImage }} style={styles.clubCover} />
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                style={styles.clubGradient}
              />
              <View style={styles.clubNameOverlay}>
                <Text style={styles.clubName}>{item.name}</Text>
              </View>
            </View>
          )}
          <View style={styles.clubContent}>
            <View style={styles.clubMetaRow}>
              <Chip
                label={item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                style={styles.clubCategoryChip}
              />
              <View style={styles.memberCount}>
                <Ionicons
                  name="people-outline"
                  size={hp(1.4)}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.memberCountText}>{memberCount} members</Text>
              </View>
            </View>
            <Text style={styles.clubDescription} numberOfLines={2}>
              {item.description}
            </Text>
            {item.leadership && item.leadership.length > 0 && (
              <View style={styles.leadershipRow}>
                <Text style={styles.leadershipLabel}>Leadership:</Text>
                {item.leadership.slice(0, 2).map((leader, index) => (
                  <Text key={index} style={styles.leadershipName}>
                    {leader.name}
                    {index < item.leadership.length - 1 && index < 1 && ', '}
                  </Text>
                ))}
                {item.leadership.length > 2 && (
                  <Text style={styles.leadershipMore}>
                    +{item.leadership.length - 2} more
                  </Text>
                )}
              </View>
            )}
            
            {/* Meeting Information */}
            {(item.meetingTimes || item.meetingLocation) && (
              <View style={styles.meetingInfo}>
                {item.meetingTimes && item.meetingTimes.length > 0 && (
                  <View style={styles.meetingInfoRow}>
                    <Ionicons name="time-outline" size={hp(1.4)} color={theme.colors.textSecondary} />
                    <Text style={styles.meetingInfoText} numberOfLines={1}>
                      {item.meetingTimes[0].day} at {new Date(item.meetingTimes[0].time).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                      {item.meetingTimes.length > 1 && ` +${item.meetingTimes.length - 1} more`}
                    </Text>
                    {!item.isMeetingPublic && (
                      <Ionicons name="lock-closed-outline" size={hp(1.2)} color={theme.colors.textSecondary} style={{ marginLeft: theme.spacing.xs }} />
                    )}
                  </View>
                )}
                {item.meetingLocation && (
                  <View style={styles.meetingInfoRow}>
                    <Ionicons name="location-outline" size={hp(1.4)} color={theme.colors.textSecondary} />
                    <Text style={styles.meetingInfoText} numberOfLines={1}>
                      {item.meetingLocation}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </AppCard>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppTopBar
          schoolName="University of Rhode Island"
          onPressProfile={() => router.push('/profile')}
          onPressSchool={() => {}}
          onPressNotifications={() => router.push('/notifications')}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Clubs & Organizations</Text>
            <Text style={styles.subtitle}>
              Discover and join clubs that match your interests
            </Text>
          </View>

          {/* Glass-style Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={hp(1.8)}
              color={theme.colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clubs..."
              placeholderTextColor={theme.colors.textSecondary}
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
                  size={hp(1.8)}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter - Chip Components */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
              <Chip
                key={category.value}
                label={category.label}
                active={selectedCategory === category.value}
                onPress={() => setSelectedCategory(category.value)}
                style={styles.categoryChip}
              />
            ))}
          </ScrollView>

          {/* Results Count */}
          <Text style={styles.resultsCount}>
            {filteredClubs.length}{' '}
            {filteredClubs.length === 1 ? 'club' : 'clubs'} found
          </Text>

          {/* Clubs List */}
          <FlatList
            data={filteredClubs}
            renderItem={renderClubCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.clubsList}
          />
        </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(10),
  },
  header: {
    marginBottom: hp(2),
  },
  title: {
    fontSize: hp(3.5),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 9999,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  searchIcon: {
    marginRight: wp(2),
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
  },
  clearButton: {
    padding: hp(0.5),
  },
  categoriesContainer: {
    gap: wp(2),
    marginBottom: hp(2),
    paddingRight: wp(4),
  },
  categoryChip: {
    marginRight: wp(2),
  },
  resultsCount: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
    marginBottom: hp(1.5),
  },
  clubsList: {
    gap: hp(2),
  },
  clubCardWrapper: {
    marginBottom: hp(2),
  },
  clubCard: {
    overflow: 'hidden',
  },
  clubImageWrapper: {
    width: '100%',
    height: hp(18),
    position: 'relative',
  },
  clubCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  clubGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  clubNameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(4),
    zIndex: 1,
  },
  clubName: {
    fontSize: hp(2),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clubContent: {
    padding: wp(4),
  },
  clubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  clubCategoryChip: {
    backgroundColor: theme.colors.bondedPurple + '15',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  memberCountText: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  interestButton: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: theme.colors.bondedPurple + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.bondedPurple,
  },
  interestButtonActive: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.bondedPurple,
  },
  clubDescription: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    lineHeight: hp(2.4),
    marginBottom: hp(1),
  },
  leadershipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.5),
  },
  leadershipLabel: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  leadershipName: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  leadershipMore: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.bondedPurple,
    fontWeight: '600',
  },
  meetingInfo: {
    marginTop: hp(0.8),
    gap: hp(0.4),
  },
  meetingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  meetingInfoText: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    flex: 1,
  },
})

