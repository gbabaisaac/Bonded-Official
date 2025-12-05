import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Search, Filter, Add, Calendar as CalendarIcon, List } from '../../components/Icons'
import { hp, wp } from '../../helpers/common'
import theme from '../../constants/theme'
import AppTopBar from '../../components/AppTopBar'
import BottomNav from '../../components/BottomNav'
import Chip from '../../components/Chip'
import EventCard from '../../components/Events/EventCard'
import { useEventsForUser } from '../../hooks/events/useEventsForUser'
import { useMockEvents } from '../../hooks/events/useMockEvents'
import { useAppTheme } from '../theme'
import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('browse')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  // Mock attendance state - in real app this would come from database
  const [eventAttendance, setEventAttendance] = useState({
    'event-spring-festival': 'going',
    'event-art-exhibition': 'pending',
  }) // { eventId: 'going' | 'pending' }
  
  // Mock my events - in real app this would come from database
  const [myEvents, setMyEvents] = useState([
    // Add some events as "created by user" for demo
    // In real app, filter events where created_by === currentUserId
  ])

  // Mock current user - replace with real auth
  const currentUserId = 'user-123'
  
  // Use mock events for now (until database is set up)
  // TODO: Switch to useEventsForUser once database is ready
  const { data: events = [], isLoading, refetch } = useMockEvents()

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  // Get events based on active tab
  const tabEvents = useMemo(() => {
    switch (activeTab) {
      case 'going':
        return events.filter((event) => eventAttendance[event.id] === 'going')
      case 'pending':
        return events.filter((event) => eventAttendance[event.id] === 'pending')
      case 'myEvents':
        return myEvents
      case 'browse':
      default:
        return events
    }
  }, [events, activeTab, eventAttendance, myEvents])

  // Filter events based on search and active filter
  const filteredEvents = useMemo(() => {
    let result = tabEvents

    // Search filter
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

    // Time filters
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
        result = result.filter((event) => !event.is_paid)
        break
      case 'onCampus':
        result = result.filter((event) => {
          const location = event.location_name?.toLowerCase() || ''
          return !location.includes('off-campus') && !location.includes('off campus')
        })
        break
      default:
        // 'all' - no additional filtering
        break
    }

    // Sort by start date (upcoming first)
    return result.sort((a, b) => {
      return new Date(a.start_at) - new Date(b.start_at)
    })
  }, [tabEvents, searchQuery, activeFilter])

  // Group events into sections
  const sections = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)
    
    const tonight = new Date(today)
    tonight.setHours(18, 0, 0, 0) // 6 PM

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
      
      // Featured: public events with high attendance or recent
      if (event.visibility === 'public' && event.attendees_count > 10) {
        featured.push(event)
      }
    })

    return {
      featured: featured.slice(0, 5),
      tonight: tonightEvents,
      upcoming: upcoming,
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
            router.push(`/events/manage/${item.id}`)
          } else {
            router.push(`/events/${item.id}`)
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
              onPress={() => router.push(`/events/${event.id}`)}
              currentUserId={currentUserId}
            />
          </View>
        ))}
      </View>
    )
  }

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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <Search size={hp(2)} color={theme.colors.textSecondary} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* View Toggle - List / Calendar */}
          <View
            style={[
              styles.viewToggleContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'list' && styles.viewToggleButtonActive,
                { backgroundColor: viewMode === 'list' ? theme.colors.accent : theme.colors.surface },
              ]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.7}
            >
              <List
                size={hp(2)}
                color={viewMode === 'list' ? '#FFFFFF' : theme.colors.textSecondary}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.viewToggleText,
                  { color: viewMode === 'list' ? '#FFFFFF' : theme.colors.textSecondary },
                ]}
              >
                List
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'calendar' && styles.viewToggleButtonActive,
                { backgroundColor: viewMode === 'calendar' ? theme.colors.accent : theme.colors.surface },
              ]}
              onPress={() => setViewMode('calendar')}
              activeOpacity={0.7}
            >
              <CalendarIcon
                size={hp(2)}
                color={viewMode === 'calendar' ? '#FFFFFF' : theme.colors.textSecondary}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.viewToggleText,
                  { color: viewMode === 'calendar' ? '#FFFFFF' : theme.colors.textSecondary },
                ]}
              >
                Calendar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selector */}
        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: 'transparent',
              borderBottomColor: 'transparent',
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {TAB_OPTIONS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor:
                      activeTab === tab.id ? theme.colors.accent : theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: StyleSheet.hairlineWidth,
                  },
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color:
                        activeTab === tab.id ? '#FFFFFF' : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filter Chips - Only show on Browse tab */}
        {activeTab === 'browse' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.filterContainer,
              { backgroundColor: 'transparent' , paddingBottom: hp(3) },
            ]}
          >
            {FILTER_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      activeFilter === chip.id ? theme.colors.accent : theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: StyleSheet.hairlineWidth,
                  },
                ]}
                onPress={() => setActiveFilter(chip.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        activeFilter === chip.id ? '#FFFFFF' : theme.colors.textPrimary,
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Events List or Calendar */}
        {viewMode === 'calendar' ? (
          <EventsCalendarView
            events={filteredEvents}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onEventPress={(eventId) => router.push(`/events/${eventId}`)}
            onAddToCalendar={(eventId) => {
              console.log('Adding event to calendar:', eventId)
            }}
          />
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'going' && 'No events you\'re going to'}
              {activeTab === 'pending' && 'No pending confirmations'}
              {activeTab === 'myEvents' && 'You haven\'t created any events'}
              {activeTab === 'browse' && 'No events found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'going' && 'RSVP to events to see them here'}
              {activeTab === 'pending' && 'Events waiting for approval will appear here'}
              {activeTab === 'myEvents' && 'Create your first event to get started'}
              {activeTab === 'browse' && 'Try adjusting your filters or search'}
            </Text>
            {activeTab === 'myEvents' && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => router.push('/events/create')}
                activeOpacity={0.8}
              >
                <Text style={styles.createFirstButtonText}>Create Event</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            renderItem={renderEventCard}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              activeTab === 'browse' ? (
                <View style={{ paddingTop: hp(1.5) }}>
                  {renderSection('Featured', sections.featured)}
                  {renderSection('Tonight', sections.tonight)}
                </View>
              ) : <View style={{ paddingTop: hp(1.5) }} />
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Create Event FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/events/create')}
          activeOpacity={0.8}
        >
          <Add size={hp(3)} color={theme.colors.white} strokeWidth={2.5} />
        </TouchableOpacity>

        <BottomNav />
      </ThemedView>
    </SafeAreaView>
  )
}

// Events Calendar View Component
function EventsCalendarView({ events, selectedDate, onDateSelect, onEventPress, onAddToCalendar }) {
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const { ChevronLeft, ChevronRight } = require('../../components/Icons')

  const getEventsForDate = (date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_at)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getEventColor = (event) => {
    if (event.visibility === 'school') return '#007AFF'
    if (event.visibility === 'org_only') return '#34C759'
    if (event.visibility === 'invite_only') return '#FF9500'
    return '#A45CFF'
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() + direction)
    onDateSelect(newDate)
  }

  const isToday = (date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    
    const days = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push({
        day: currentDate.getDate(),
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }, [selectedDate])

  const selectedDayEvents = getEventsForDate(selectedDate)

  return (
    <View style={styles.calendarContainer}>
      {/* Month Navigation */}
      <View style={styles.calendarMonthNavigation}>
        <TouchableOpacity
          onPress={() => navigateMonth(-1)}
          style={styles.calendarNavButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={hp(2)} color={theme.colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.calendarMonthTitle}>
          {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
        <TouchableOpacity
          onPress={() => navigateMonth(1)}
          style={styles.calendarNavButton}
          activeOpacity={0.7}
        >
          <ChevronRight size={hp(2)} color={theme.colors.charcoal} />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {DAYS_SHORT.map((day, index) => (
          <View key={`day-header-${index}`} style={styles.calendarDayHeader}>
            <Text style={styles.calendarDayHeaderText}>{day}</Text>
          </View>
        ))}
        {calendarDays.map(({ day, isCurrentMonth, date }, index) => {
          const dayEvents = getEventsForDate(date)
          const dayIsToday = isToday(date)
          const dayIsSelected = isSelected(date)

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDayCell,
                !isCurrentMonth && styles.calendarDayCellOtherMonth,
                dayIsSelected && styles.calendarDayCellSelected,
              ]}
              onPress={() => onDateSelect(date)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.calendarDayNumber,
                  !isCurrentMonth && styles.calendarDayNumberOtherMonth,
                  dayIsSelected && styles.calendarDayNumberSelected,
                ]}
              >
                {day}
              </Text>
              {dayEvents.length > 0 && (
                <View style={styles.calendarEventDots}>
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <View
                      key={i}
                      style={[
                        styles.calendarEventDot,
                        { backgroundColor: getEventColor(event) },
                      ]}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <Text style={styles.calendarEventDotMore}>+{dayEvents.length - 3}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Selected Date Events */}
      {selectedDayEvents.length > 0 && (
        <View style={styles.calendarEventsList}>
          <Text style={styles.calendarEventsTitle}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {selectedDayEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.calendarEventItem}
              onPress={() => onEventPress(event.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.calendarEventColorBar, { backgroundColor: getEventColor(event) }]} />
              <View style={styles.calendarEventContent}>
                <Text style={styles.calendarEventItemTitle}>{event.title}</Text>
                <Text style={styles.calendarEventItemTime}>
                  {new Date(event.start_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {event.location_name && ` • ${event.location_name}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addToCalendarButton}
                onPress={() => onAddToCalendar(event.id)}
                activeOpacity={0.7}
              >
                <CalendarIcon size={hp(2)} color={theme.colors.accent} strokeWidth={2} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(0.5),
    gap: hp(0.8),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    gap: wp(2),
    ...theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
  },
  clearButton: {
    paddingHorizontal: wp(2),
  },
  clearButtonText: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  tabContainer: {
    paddingVertical: hp(0.8),
  },
  tabScrollContent: {
    paddingHorizontal: wp(5),
    gap: wp(3),
  },
  tab: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.xl,
    marginRight: wp(2),
    backgroundColor: theme.colors.surface,
    minHeight: hp(4.4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
  },
  tabLabel: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabLabelActive: {
    color: theme.colors.white,
  },
  filterContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.2),
    paddingRight: wp(5),
    backgroundColor: theme.colors.background,
    gap: wp(2.5),
  },
  filterChip: {
    paddingHorizontal: wp(5.5),
    paddingVertical: hp(1.6),
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 0,
    minHeight: hp(4.6),
    minWidth: wp(24),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  filterChipText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  manageButton: {
    marginTop: hp(1),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  listContent: {
    paddingBottom: hp(12),
    paddingHorizontal: wp(4),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    paddingHorizontal: wp(5),
    marginBottom: hp(1.5),
  },
  horizontalList: {
    paddingHorizontal: wp(4),
    gap: wp(3),
  },
  eventCardWrapper: {
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
  },
  loadingText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(4),
  },
  emptyText: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(1),
  },
  emptySubtext: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: hp(0.5),
  },
  createFirstButton: {
    marginTop: hp(3),
    backgroundColor: theme.colors.accent,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.xl,
  },
  createFirstButtonText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: hp(12),
    right: wp(4),
    width: hp(6.5),
    height: hp(6.5),
    borderRadius: hp(3.25),
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    marginTop: hp(0.5),
    backgroundColor: theme.colors.surface,
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    borderRadius: theme.radius.xl,
    ...theme.shadows.sm,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    gap: wp(1),
  },
  viewToggleButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  viewToggleText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  viewToggleTextActive: {
    color: theme.colors.white,
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  calendarMonthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  calendarNavButton: {
    padding: hp(0.5),
  },
  calendarMonthTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp(2),
    paddingTop: hp(1),
    backgroundColor: theme.colors.background,
  },
  calendarDayHeader: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: hp(0.8),
  },
  calendarDayHeaderText: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: hp(0.5),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  calendarDayCellOtherMonth: {
    opacity: 0.3,
  },
  calendarDayCellSelected: {
    backgroundColor: theme.colors.accent + '20',
    borderRadius: theme.radius.md,
    borderColor: theme.colors.accent,
  },
  calendarDayNumber: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  calendarDayNumberOtherMonth: {
    color: theme.colors.textSecondary,
  },
  calendarDayNumberSelected: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
  calendarEventDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: wp(0.5),
    marginTop: hp(0.2),
    width: '100%',
  },
  calendarEventDot: {
    width: wp(1.5),
    height: wp(1.5),
    borderRadius: wp(0.75),
  },
  calendarEventDotMore: {
    fontSize: hp(1),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  calendarEventsList: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
  },
  calendarEventsTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: hp(1.5),
  },
  calendarEventItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: hp(1),
    padding: wp(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  calendarEventColorBar: {
    width: wp(1),
    height: '100%',
    borderRadius: theme.radius.pill,
    marginRight: wp(2),
  },
  calendarEventContent: {
    flex: 1,
  },
  calendarEventItemTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.3),
  },
  calendarEventItemTime: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  addToCalendarButton: {
    padding: hp(0.8),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
})

