import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppTopBar from '../../components/AppTopBar'
import BottomNav from '../../components/BottomNav'
import EventCard from '../../components/Events/EventCard'
import { Add, Search } from '../../components/Icons'
import { hp, wp } from '../../helpers/common'
import { useEventsForUser } from '../../hooks/events/useEventsForUser'
import { useAuthStore } from '../../stores/authStore'
import { isFeatureEnabled } from '../../utils/featureGates'
import ThemedText from '../components/ThemedText'
import ThemedView from '../components/ThemedView'
import { useAppTheme } from '../theme'

const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'free', label: 'Free' },
  { id: 'onCampus', label: 'On Campus' },
]

const TAB_OPTIONS = [
  { id: 'browse', label: 'Browse' },
  { id: 'going', label: 'Going' },
  { id: 'pending', label: 'Pending' },
  { id: 'myEvents', label: 'My Events' },
]

export default function EventsHome() {
  const router = useRouter()
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('browse')
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const { user } = useAuthStore()

  // Attendance is still local UI state for immediate feedback
  const [eventAttendance, setEventAttendance] = useState({}) // { eventId: 'going' | 'pending' }

  const currentUserId = user?.id || 'anonymous'

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useEventsForUser(user?.id)

  // Flatten paginated data into a single array
  const events = useMemo(() => {
    console.log('📊 Events data structure:', {
      hasPagesArray: !!data?.pages,
      pagesCount: data?.pages?.length || 0,
      firstPageEvents: data?.pages?.[0]?.events?.length || 0,
      totalPages: data?.pages?.length,
    })

    if (!data?.pages) {
      console.log('⚠️ No pages data available')
      return []
    }

    const flattenedEvents = data.pages.flatMap((page) => page.events || [])
    console.log('✅ Flattened events count:', flattenedEvents.length)

    return flattenedEvents
  }, [data])

  // Check if any page has RLS errors (degraded mode)
  const hasRlsError = useMemo(() => {
    return data?.pages?.some((page) => page.rlsError) || false
  }, [data])

  // Log loading state and errors
  React.useEffect(() => {
    console.log('📡 Events loading state:', { isLoading, hasData: !!data, eventCount: events.length, error: error?.message })
  }, [isLoading, data, events.length, error])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  const loadMoreEvents = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const tabEvents = useMemo(() => {
    switch (activeTab) {
      case 'going':
        return events.filter((event) => eventAttendance[event.id] === 'going')
      case 'pending':
        return events.filter((event) => eventAttendance[event.id] === 'pending')
      case 'myEvents':
        // Filter events where current user is the organizer
        return events.filter((event) => event.organizer_id === user?.id)
      case 'browse':
      default:
        return events
    }
  }, [events, activeTab, eventAttendance, user?.id])

  const filteredEvents = useMemo(() => {
    let result = tabEvents

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((event) => {
        return (
          event.title?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location_name?.toLowerCase().includes(query) ||
          event.org?.name?.toLowerCase().includes(query)
        )
      })
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    switch (activeFilter) {
      case 'today':
        result = result.filter((event) => {
          const eventDate = new Date(event.start_at)
          return eventDate >= today && eventDate <= endOfToday
        })
        break
      case 'thisWeek':
        result = result.filter((event) => {
          const eventDate = new Date(event.start_at)
          return eventDate >= startOfWeek && eventDate <= endOfWeek
        })
        break
      case 'free':
        // If paid events are disabled, filter them out
        if (!isFeatureEnabled('PAID_EVENTS')) {
          result = result.filter((event) => !event.is_paid)
        } else {
          result = result.filter((event) => !event.is_paid)
        }
        break
      case 'onCampus':
        result = result.filter((event) => {
          const location = event.location_name?.toLowerCase() || ''
          return !location.includes('off-campus') && !location.includes('off campus')
        })
        break
      default:
        break
    }

    return result.sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
  }, [tabEvents, searchQuery, activeFilter])

  const sections = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    const tonight = new Date(today)
    tonight.setHours(18, 0, 0, 0)

    const featured = []
    const tonightEvents = []
    const upcoming = []

    filteredEvents.forEach((event) => {
      const eventDate = new Date(event.start_at)

      if (eventDate >= today && eventDate <= endOfToday && eventDate >= tonight) {
        tonightEvents.push(event)
      } else if (eventDate > endOfToday) {
        upcoming.push(event)
      }

      if (event.visibility === 'public' && (event.attendees_count || 0) > 10) {
        featured.push(event)
      }
    })

    return {
      featured: featured.slice(0, 5),
      tonight: tonightEvents,
      upcoming,
    }
  }, [filteredEvents])

  const handleEventAction = useCallback((eventId, action) => {
    if (action === 'going') {
      setEventAttendance((prev) => ({
        ...prev,
        [eventId]: prev[eventId] === 'going' ? null : 'going',
      }))
    } else if (action === 'request') {
      setEventAttendance((prev) => ({
        ...prev,
        [eventId]: 'pending',
      }))
    }
  }, [])

  const renderEventCard = ({ item }) => (
    <View style={styles.eventCardWrapper}>
      <EventCard
        event={item}
        onPress={() => {
          if (activeTab === 'myEvents') {
            router.push({ pathname: '/events/manage/[id]', params: { id: item.id } })
          } else {
            router.push({ pathname: '/events/[id]', params: { id: item.id } })
          }
        }}
        currentUserId={currentUserId}
        attendanceStatus={eventAttendance[item.id]}
        onAction={handleEventAction}
      />
      {activeTab === 'myEvents' && (
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => router.push(`/events/manage/${item.id}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderSection = (title, events, showIfEmpty = false) => {
    if (events.length === 0 && !showIfEmpty) return null

    return (
      <View style={styles.section}>
        {title && (
          <ThemedText style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {title}
          </ThemedText>
        )}
        {events.map((event) => (
          <View key={event.id} style={styles.eventCardWrapper}>
            <EventCard
              event={event}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })}
              currentUserId={currentUserId}
            />
          </View>
        ))}
      </View>
    )
  }

  const renderScrollableHeader = () => (
    <>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
          <Search size={hp(2)} color={theme.colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.push('/events/create')} style={styles.createEventIconButton} activeOpacity={0.7}>
              <Add size={hp(2.2)} color={theme.colors.accent} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
        {activeTab === 'browse' && (
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.filterToggleButton, { backgroundColor: showFilters ? theme.colors.accent : theme.colors.surface, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth }]}
              onPress={() => setShowFilters(!showFilters)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterToggleText, { color: showFilters ? '#FFFFFF' : theme.colors.textPrimary }]}>Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={[styles.tabContainer, { backgroundColor: 'transparent', borderBottomColor: 'transparent' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {TAB_OPTIONS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, { backgroundColor: activeTab === tab.id ? theme.colors.accent : theme.colors.surface, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth }]}
              onPress={() => {
                setActiveTab(tab.id)
                if (tab.id !== 'browse') setShowFilters(false)
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, { color: activeTab === tab.id ? '#FFFFFF' : theme.colors.textPrimary }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  )

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <AppTopBar
          schoolName="University of Rhode Island"
          onPressProfile={() => router.push('/profile')}
          onPressSchool={() => {}}
          onPressNotifications={() => router.push('/notifications')}
          style={{ backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }}
          titleStyle={{ color: theme.colors.textPrimary }}
          iconColor={theme.colors.textPrimary}
        />
        {hasRlsError && (
          <View style={[styles.rlsWarningBanner, { backgroundColor: theme.colors.warning || '#FFA500' }]}>
            <Text style={styles.rlsWarningText}>
              Some events may not be visible. Pull to refresh or try again later.
            </Text>
          </View>
        )}
        {activeTab === 'browse' && showFilters && (
          <View style={styles.filterChipsFixed}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
              {FILTER_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.filterChip, { backgroundColor: activeFilter === chip.id ? theme.colors.accent : theme.colors.surface, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth }]}
                  onPress={() => setActiveFilter(chip.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, { color: activeFilter === chip.id ? '#FFFFFF' : theme.colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit={true}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : filteredEvents.length === 0 && !isLoading ? (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {renderScrollableHeader()}
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>
                {activeTab === 'going' && "No events you're going to"}
                {activeTab === 'pending' && 'No pending confirmations'}
                {activeTab === 'myEvents' && "You haven't created any events"}
                {activeTab === 'browse' && 'No events found'}
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                {activeTab === 'going' && 'RSVP to events to see them here'}
                {activeTab === 'pending' && 'Events waiting for approval will appear here'}
                {activeTab === 'myEvents' && 'Create your first event to get started'}
                {activeTab === 'browse' && (searchQuery.trim() || activeFilter !== 'all' ? 'Try adjusting your filters or search' : 'Be the first to create an event!')}
              </Text>
              {(activeTab === 'myEvents' || (activeTab === 'browse' && !searchQuery.trim() && activeFilter === 'all')) && (
                <TouchableOpacity 
                  style={[styles.createFirstButton, { backgroundColor: theme.colors.accent }]} 
                  onPress={() => router.push('/events/create')} 
                  activeOpacity={0.8}
                >
                  <Text style={styles.createFirstButtonText}>Create Event</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={filteredEvents}
            renderItem={renderEventCard}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <>
                {renderScrollableHeader()}
                {activeTab === 'browse' ? (
                  <View style={{ paddingTop: hp(1.5) }}>
                    {renderSection('', sections.featured)}
                    {renderSection('Tonight', sections.tonight)}
                  </View>
                ) : <View style={{ paddingTop: hp(1.5) }} />}
              </>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreEvents}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={{ padding: hp(2), alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.textSecondary }}>Loading more events...</Text>
                </View>
              ) : null
            }
          />
        )}
        <BottomNav />
      </ThemedView>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  searchContainer: { paddingHorizontal: theme.spacing.xl, paddingTop: hp(0.4), paddingBottom: theme.spacing.xs, gap: theme.spacing.xs },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.radius.xl, paddingHorizontal: wp(4), paddingVertical: hp(1.2), gap: wp(2), ...theme.shadows.sm },
  searchInput: { flex: 1, fontSize: hp(1.6), fontFamily: theme.typography.fontFamily.body, color: theme.colors.textPrimary },
  clearButton: { paddingHorizontal: wp(2) },
  clearButtonText: { fontSize: hp(1.4), fontFamily: theme.typography.fontFamily.body, color: theme.colors.accent, fontWeight: '600' },
  tabContainer: { paddingVertical: hp(0.5) },
  tabScrollContent: { paddingHorizontal: wp(5), gap: wp(3) },
  tab: { paddingHorizontal: wp(5), paddingVertical: hp(1.5), borderRadius: theme.radius.xl, marginRight: wp(2), backgroundColor: theme.colors.surface, minHeight: hp(4.4), justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: hp(1.5), fontFamily: theme.typography.fontFamily.body, fontWeight: '600', color: theme.colors.textPrimary, textAlign: 'center', includeFontPadding: false },
  filterContainer: { paddingHorizontal: theme.spacing.xl, paddingVertical: hp(0.8), paddingRight: theme.spacing.xl, backgroundColor: theme.colors.background, gap: theme.spacing.md },
  filterChip: { paddingHorizontal: theme.spacing.xl, paddingVertical: hp(1.3), borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface, borderWidth: 0, minHeight: hp(4), minWidth: wp(24), justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  filterChipText: { fontSize: hp(1.5), fontFamily: theme.typography.fontFamily.body, fontWeight: '600', color: theme.colors.textPrimary, letterSpacing: 0.2, includeFontPadding: false, textAlignVertical: 'center' },
  manageButton: { marginTop: hp(1), paddingVertical: hp(1), paddingHorizontal: wp(4), backgroundColor: theme.colors.accent, borderRadius: theme.radius.lg, alignItems: 'center' },
  manageButtonText: { fontSize: hp(1.5), fontFamily: theme.typography.fontFamily.body, fontWeight: '700', color: theme.colors.white },
  listContent: { paddingBottom: hp(12), paddingHorizontal: wp(4) },
  section: { marginBottom: hp(3) },
  sectionTitle: { fontSize: hp(2.2), fontFamily: theme.typography.fontFamily.heading, fontWeight: '700', color: theme.colors.textPrimary, paddingHorizontal: wp(5), marginBottom: hp(1.5) },
  eventCardWrapper: { paddingHorizontal: wp(4), marginBottom: hp(2) },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: hp(10) },
  loadingText: { fontSize: hp(1.8), fontFamily: theme.typography.fontFamily.body, color: theme.colors.textSecondary },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: hp(10), paddingHorizontal: wp(4) },
  emptyText: { fontSize: hp(2), fontFamily: theme.typography.fontFamily.heading, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: hp(1) },
  emptySubtext: { fontSize: hp(1.5), fontFamily: theme.typography.fontFamily.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: hp(0.5) },
  createFirstButton: { marginTop: hp(3), backgroundColor: theme.colors.accent, paddingHorizontal: wp(6), paddingVertical: hp(1.5), borderRadius: theme.radius.xl },
  createFirstButtonText: { fontSize: hp(1.7), fontFamily: theme.typography.fontFamily.body, fontWeight: '700', color: theme.colors.white },
  createEventIconButton: { padding: hp(0.5) },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2.5), justifyContent: 'flex-end' },
  filterToggleButton: { paddingHorizontal: wp(4), paddingVertical: hp(0.8), borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface, ...theme.shadows.sm },
  filterToggleText: { fontSize: hp(1.4), fontFamily: theme.typography.fontFamily.body, fontWeight: '600', color: theme.colors.textPrimary },
  filterChipsFixed: { backgroundColor: theme.colors.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, zIndex: 10 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: hp(12) },
  rlsWarningBanner: { paddingVertical: hp(1), paddingHorizontal: wp(4), alignItems: 'center' },
  rlsWarningText: { fontSize: hp(1.4), fontFamily: theme.typography.fontFamily.body, color: '#FFFFFF', textAlign: 'center' },
})
