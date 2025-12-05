import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { hp, wp } from '../helpers/common'
import AppTopBar from '../components/AppTopBar'
import { useAppTheme } from './theme'
import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'
import BottomNav from '../components/BottomNav'
import Chip from '../components/Chip'
import { useMockEvents } from '../hooks/events/useMockEvents'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Users, Lock, ChevronDown } from '../components/Icons'

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Color coding for events based on visibility/type
const getEventColor = (event) => {
  if (event.visibility === 'school') return '#007AFF' // Blue for school events
  if (event.visibility === 'org_only') return '#34C759' // Green for org events
  if (event.visibility === 'invite_only') return '#FF9500' // Orange for invite-only
  return '#A45CFF' // Purple for public events
}

export default function Calendar() {
  const router = useRouter()
  const theme = useAppTheme()
  const [viewMode, setViewMode] = useState('month') // 'month', 'week', 'day'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const { data: allEvents = [] } = useMockEvents()

  // Mock current user - replace with real auth
  const currentUserId = 'user-123'

  // Filter events that should appear in calendar
  const calendarEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // Show events user is attending
      // For now, show all events (in real app, filter by attendance)
      return true
    })
  }, [allEvents])

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return calendarEvents.filter((event) => {
      const eventDate = new Date(event.start_at)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Get events for current month
  const monthEvents = useMemo(() => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)

    return calendarEvents.filter((event) => {
      const eventDate = new Date(event.start_at)
      return eventDate >= monthStart && eventDate <= monthEnd
    })
  }, [calendarEvents, selectedDate])

  // Get events for current week
  const weekEvents = useMemo(() => {
    const startOfWeek = new Date(selectedDate)
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return calendarEvents.filter((event) => {
      const eventDate = new Date(event.start_at)
      return eventDate >= startOfWeek && eventDate <= endOfWeek
    })
  }, [calendarEvents, selectedDate])

  // Get events for selected day
  const dayEvents = useMemo(() => {
    return getEventsForDate(selectedDate).sort((a, b) => {
      return new Date(a.start_at) - new Date(b.start_at)
    })
  }, [calendarEvents, selectedDate])

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() + direction)
    setSelectedDate(newDate)
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + direction * 7)
    setSelectedDate(newDate)
  }

  const navigateDay = (direction) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + direction)
    setSelectedDate(newDate)
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatDateShort = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const renderMonthView = () => {
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const calendarDays = []
    // Add days from previous month
    const prevMonthLastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      calendarDays.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, prevMonthLastDay - i),
      })
    }
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i),
      })
    }
    // Add days from next month to fill the grid
    const remainingDays = 42 - calendarDays.length
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, i),
      })
    }

    const today = new Date()
    const isToday = (date) => {
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

    const selectedDayEvents = getEventsForDate(selectedDate)

    return (
      <View style={styles.monthContainer}>
        {/* Calendar Grid */}
        <View style={styles.monthGrid}>
          {DAYS_SHORT.map((day, index) => (
            <View key={`day-header-${index}`} style={styles.monthDayHeader}>
              <Text style={styles.monthDayHeaderText}>{day}</Text>
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
                  styles.monthDayCell,
                  !isCurrentMonth && styles.monthDayCellOtherMonth,
                  dayIsSelected && styles.monthDayCellSelected,
                ]}
                onPress={() => setSelectedDate(date)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.monthDayNumber,
                    !isCurrentMonth && styles.monthDayNumberOtherMonth,
                    dayIsSelected && styles.monthDayNumberSelected,
                  ]}
                >
                  {day}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.monthEventDots}>
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <View
                        key={i}
                        style={[
                          styles.monthEventDot,
                          { backgroundColor: getEventColor(event) },
                        ]}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <Text style={styles.monthEventDotMore}>+{dayEvents.length - 3}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Events List for Selected Day */}
        <View style={styles.monthEventsList}>
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.monthEventItem}
                onPress={() => router.push(`/events/${event.id}`)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.monthEventDotLarge,
                    { backgroundColor: getEventColor(event) },
                  ]}
                />
                <View style={styles.monthEventContent}>
                  <Text style={styles.monthEventTitle}>{event.title}</Text>
                  <Text style={styles.monthEventTime}>
                    {formatDateShort(event.start_at)} {formatTime(event.start_at)}
                  </Text>
                  {event.visibility === 'school' && (
                    <Text style={styles.monthEventBadge}>Official University Event</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noEventsContainer}>
              <Text style={styles.noEventsText}>No events for this day</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(selectedDate)
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const isSelected = (date) => {
      return (
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      )
    }

    return (
      <View style={styles.weekContainer}>
        {/* Week Header */}
        <View style={styles.weekHeader}>
          <View style={styles.weekHeaderTimeColumn} />
          {weekDays.map((day, index) => {
            const dayIsSelected = isSelected(day)
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.weekHeaderDay,
                  dayIsSelected && styles.weekHeaderDaySelected,
                ]}
                onPress={() => setSelectedDate(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.weekHeaderDayName, dayIsSelected && styles.weekHeaderDayNameSelected]}>
                  {DAYS_SHORT[day.getDay()]}
                </Text>
                <Text style={[styles.weekHeaderDayNumber, dayIsSelected && styles.weekHeaderDayNumberSelected]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Week Timeline */}
        <ScrollView style={styles.weekTimeline} showsVerticalScrollIndicator={false}>
          {hours.map((hour) => {
            const hourEvents = weekEvents.filter((event) => {
              const eventDate = new Date(event.start_at)
              return eventDate.getHours() === hour
            })

            return (
              <View key={hour} style={styles.weekHourRow}>
                <View style={styles.weekHourLabel}>
                  <Text style={styles.weekHourText}>
                    {hour === 0 ? '12' : hour <= 12 ? hour : hour - 12}
                    {hour < 12 ? ' AM' : ' PM'}
                  </Text>
                </View>
                <View style={styles.weekHourContent}>
                  {weekDays.map((day, dayIndex) => {
                    const dayEvents = hourEvents.filter((event) => {
                      const eventDate = new Date(event.start_at)
                      return (
                        eventDate.getDate() === day.getDate() &&
                        eventDate.getMonth() === day.getMonth() &&
                        eventDate.getFullYear() === day.getFullYear()
                      )
                    })

                    return (
                      <View key={dayIndex} style={styles.weekDayColumn}>
                        {dayEvents.map((event) => (
                          <TouchableOpacity
                            key={event.id}
                            style={[
                              styles.weekEventBlock,
                              { backgroundColor: getEventColor(event) },
                            ]}
                            onPress={() => router.push(`/events/${event.id}`)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.weekEventTitle} numberOfLines={1}>
                              {event.title}
                            </Text>
                            <Text style={styles.weekEventTime}>
                              {formatTime(event.start_at)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <View style={styles.dayContainer}>
        {/* Day Header */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderDate}>
            {DAYS_FULL[selectedDate.getDay()]}, {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
          </Text>
        </View>

        {/* Day Timeline */}
        <ScrollView style={styles.dayTimeline} showsVerticalScrollIndicator={false}>
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter((event) => {
              const eventDate = new Date(event.start_at)
              return eventDate.getHours() === hour
            })

            return (
              <View key={hour} style={styles.dayHourRow}>
                <View style={styles.dayHourLabel}>
                  <Text style={styles.dayHourText}>
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </Text>
                </View>
                <View style={styles.dayHourContent}>
                  {hourEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.dayEventItem}
                      onPress={() => router.push(`/events/${event.id}`)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.dayEventDot,
                          { backgroundColor: getEventColor(event) },
                        ]}
                      />
                      <View style={styles.dayEventContent}>
                        <Text style={styles.dayEventTitle}>{event.title}</Text>
                        <Text style={styles.dayEventTime}>
                          {formatTime(event.start_at)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {hourEvents.length === 0 && <View style={styles.dayHourLine} />}
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  const renderView = () => {
    switch (viewMode) {
      case 'week':
        return renderWeekView()
      case 'day':
        return renderDayView()
      case 'month':
      default:
        return renderMonthView()
    }
  }

  const styles = createStyles(theme)

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppTopBar
          schoolName="University of Rhode Island"
          onPressProfile={() => router.push('/profile')}
          onPressSchool={() => {}}
          onPressNotifications={() => router.push('/notifications')}
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
        </View>

        {/* View Mode Selector */}
        <View style={styles.viewModeContainer}>
          <Chip
            label="Month"
            active={viewMode === 'month'}
            onPress={() => setViewMode('month')}
            style={styles.viewModeChip}
          />
          <Chip
            label="Week"
            active={viewMode === 'week'}
            onPress={() => setViewMode('week')}
            style={styles.viewModeChip}
          />
          <Chip
            label="Day"
            active={viewMode === 'day'}
            onPress={() => setViewMode('day')}
            style={styles.viewModeChip}
          />
        </View>

        {/* Month Navigation (only for month view) */}
        {viewMode === 'month' && (
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              onPress={() => navigateMonth(-1)}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={hp(2)} color={theme.colors.charcoal} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => navigateMonth(1)}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <ChevronRight size={hp(2)} color={theme.colors.charcoal} />
            </TouchableOpacity>
          </View>
        )}

        {/* Week Navigation (only for week view) */}
        {viewMode === 'week' && (
          <View style={styles.weekNavigation}>
            <TouchableOpacity
              onPress={() => navigateWeek(-1)}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={hp(2)} color={theme.colors.charcoal} />
            </TouchableOpacity>
            <Text style={styles.weekTitle}>
              {(() => {
                const startOfWeek = new Date(selectedDate)
                startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
                const endOfWeek = new Date(startOfWeek)
                endOfWeek.setDate(startOfWeek.getDate() + 6)
                return `${MONTHS[startOfWeek.getMonth()].substring(0, 3)} ${startOfWeek.getDate()} - ${MONTHS[endOfWeek.getMonth()].substring(0, 3)} ${endOfWeek.getDate()}`
              })()}
            </Text>
            <TouchableOpacity
              onPress={() => navigateWeek(1)}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <ChevronRight size={hp(2)} color={theme.colors.charcoal} />
            </TouchableOpacity>
          </View>
        )}

        {/* Day Navigation (only for day view) */}
        {viewMode === 'day' && (
          <View style={styles.dayNavigation}>
            <TouchableOpacity
              onPress={() => navigateDay(-1)}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={hp(2)} color={theme.colors.charcoal} />
            </TouchableOpacity>
            <Text style={styles.dayTitle}>
              {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}
            </Text>
            <TouchableOpacity
              onPress={() => navigateDay(1)}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <ChevronRight size={hp(2)} color={theme.colors.charcoal} />
            </TouchableOpacity>
          </View>
        )}

        {/* Calendar View */}
        {renderView()}

        {/* Create Event Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateEventModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={hp(2.5)} color={theme.colors.white} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Create Calendar Event Modal */}
        {showCreateEventModal && (
          <CreateCalendarEventModal
            visible={showCreateEventModal}
            onClose={() => setShowCreateEventModal(false)}
            selectedDate={selectedDate}
            onEventCreated={() => {
              setShowCreateEventModal(false)
            }}
          />
        )}

        <BottomNav />
      </View>
    </SafeAreaView>
  )
}

// Create Calendar Event Modal Component
function CreateCalendarEventModal({ visible, onClose, selectedDate, onEventCreated }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState(selectedDate || new Date())
  const [startTime, setStartTime] = useState(new Date())
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(new Date().getHours() + 1)))
  const [location, setLocation] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [showInviteesModal, setShowInviteesModal] = useState(false)
  const [showVisibilityModal, setShowVisibilityModal] = useState(false)
  const [selectedInvitees, setSelectedInvitees] = useState([])
  const [visibility, setVisibility] = useState('org_members_only')
  const [isMandatory, setIsMandatory] = useState(false)

  // Mock user orgs (in real app, fetch from API)
  const userOrgs = [
    { id: 'org-cs-club', name: 'CS Club', isAdmin: true },
    { id: 'org-music-society', name: 'Music Society', isAdmin: false },
  ]

  // Mock connections
  const mockConnections = [
    { id: 'user-1', name: 'Danielle Williams', avatar: 'DW', type: 'friend' },
    { id: 'user-2', name: 'John Smith', avatar: 'JS', type: 'friend' },
    { id: 'user-3', name: 'Sarah Johnson', avatar: 'SJ', type: 'friend' },
  ]

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const handleCreate = () => {
    if (!title.trim()) {
      return
    }

    // Navigate to invite request screen
    router.push({
      pathname: '/calendar/invite-requests',
      params: {
        eventId: `event-${Date.now()}`,
        title,
        isMandatory: isMandatory.toString(),
      },
    })

    onEventCreated()
  }

  const toggleInvitee = (id) => {
    setSelectedInvitees((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.createEventModalContent}>
          <View style={styles.createEventModalHeader}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.createEventModalTitle}>New Event</Text>
            <TouchableOpacity onPress={handleCreate} activeOpacity={0.7}>
              <Text style={[styles.modalCancelText, styles.modalCreateText]}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.createEventModalBody} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.createEventField}>
              <Text style={styles.createEventLabel}>Title</Text>
              <TextInput
                style={styles.createEventInput}
                placeholder="General Meeting"
                placeholderTextColor={theme.colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Date */}
            <View style={styles.createEventField}>
              <Text style={styles.createEventLabel}>Date</Text>
              <TouchableOpacity
                style={styles.createEventSelectField}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <CalendarIcon size={hp(2)} color={theme.colors.textSecondary} />
                <Text style={styles.createEventSelectText}>{formatDate(eventDate)}</Text>
              </TouchableOpacity>
            </View>

            {/* Time */}
            <View style={styles.createEventField}>
              <Text style={styles.createEventLabel}>Time</Text>
              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={styles.createEventSelectField}
                  onPress={() => setShowStartTimePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeIcon}>🕐</Text>
                  <Text style={styles.createEventSelectText}>{formatTime(startTime)}</Text>
                </TouchableOpacity>
                <ChevronRight size={hp(2)} color={theme.colors.textSecondary} />
                <TouchableOpacity
                  style={styles.createEventSelectField}
                  onPress={() => setShowEndTimePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeIcon}>🕐</Text>
                  <Text style={styles.createEventSelectText}>{formatTime(endTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location */}
            <View style={styles.createEventField}>
              <Text style={styles.createEventLabel}>Location</Text>
              <View style={styles.createEventSelectField}>
                <MapPin size={hp(2)} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.createEventInput, { flex: 1, borderWidth: 0, padding: 0 }]}
                  placeholder="Add Location"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Recurring */}
            <View style={styles.createEventField}>
              <View style={styles.switchRow}>
                <Text style={styles.createEventLabel}>Recurring</Text>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: theme.colors.offWhite, true: theme.colors.bondedPurple }}
                  thumbColor={theme.colors.white}
                />
              </View>
            </View>

            {/* Invitees */}
            <View style={styles.createEventField}>
              <Text style={styles.createEventLabel}>INVITEES</Text>
              <TouchableOpacity
                style={styles.createEventSelectField}
                onPress={() => setShowInviteesModal(true)}
                activeOpacity={0.7}
              >
                <Users size={hp(2)} color={theme.colors.textSecondary} />
                <Text style={styles.createEventSelectText}>
                  {selectedInvitees.length === 0 ? 'All members' : `${selectedInvitees.length} selected`}
                </Text>
                <ChevronDown size={hp(2)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Visibility */}
            <View style={styles.createEventField}>
              <Text style={styles.createEventLabel}>Visibility</Text>
              <TouchableOpacity
                style={styles.createEventSelectField}
                onPress={() => setShowVisibilityModal(true)}
                activeOpacity={0.7}
              >
                <Lock size={hp(2)} color={theme.colors.textSecondary} />
                <Text style={styles.createEventSelectText}>
                  {visibility === 'org_members_only' ? 'Org members only' : 
                   visibility === 'public' ? 'Public' : 
                   visibility.startsWith('org_') ? `Only ${userOrgs.find(o => `org_${o.id}` === visibility)?.name || 'Org'}` :
                   'Invite only'}
                </Text>
                <ChevronDown size={hp(2)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Mandatory (only if admin) */}
            {userOrgs.some(org => org.isAdmin) && (
              <View style={styles.createEventField}>
                <View style={styles.switchRow}>
                  <Text style={styles.createEventLabel}>Mandatory (auto-add to schedule)</Text>
                  <Switch
                    value={isMandatory}
                    onValueChange={setIsMandatory}
                    trackColor={{ false: theme.colors.offWhite, true: theme.colors.bondedPurple }}
                    thumbColor={theme.colors.white}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Date/Time Pickers for iOS */}
          {Platform.OS === 'ios' && (
            <>
              {showDatePicker && (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.pickerModalOverlay}>
                    <View style={styles.pickerModalContent}>
                      <View style={styles.pickerModalHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={styles.pickerModalButton}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.pickerModalTitle}>Select Date</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={[styles.pickerModalButton, styles.pickerModalButtonDone]}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={eventDate}
                        mode="date"
                        display="spinner"
                        onChange={(event, selectedDate) => {
                          if (selectedDate) {
                            setEventDate(selectedDate)
                          }
                        }}
                        minimumDate={new Date()}
                      />
                    </View>
                  </View>
                </Modal>
              )}
              {showStartTimePicker && (
                <Modal
                  visible={showStartTimePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowStartTimePicker(false)}
                >
                  <View style={styles.pickerModalOverlay}>
                    <View style={styles.pickerModalContent}>
                      <View style={styles.pickerModalHeader}>
                        <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                          <Text style={styles.pickerModalButton}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.pickerModalTitle}>Start Time</Text>
                        <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                          <Text style={[styles.pickerModalButton, styles.pickerModalButtonDone]}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={startTime}
                        mode="time"
                        display="spinner"
                        onChange={(event, selectedTime) => {
                          if (selectedTime) {
                            setStartTime(selectedTime)
                          }
                        }}
                      />
                    </View>
                  </View>
                </Modal>
              )}
              {showEndTimePicker && (
                <Modal
                  visible={showEndTimePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowEndTimePicker(false)}
                >
                  <View style={styles.pickerModalOverlay}>
                    <View style={styles.pickerModalContent}>
                      <View style={styles.pickerModalHeader}>
                        <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                          <Text style={styles.pickerModalButton}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.pickerModalTitle}>End Time</Text>
                        <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                          <Text style={[styles.pickerModalButton, styles.pickerModalButtonDone]}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={endTime}
                        mode="time"
                        display="spinner"
                        onChange={(event, selectedTime) => {
                          if (selectedTime) {
                            setEndTime(selectedTime)
                          }
                        }}
                      />
                    </View>
                  </View>
                </Modal>
              )}
            </>
          )}

          {/* Invitees Modal */}
          <Modal
            visible={showInviteesModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowInviteesModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Invite People</Text>
                  <TouchableOpacity onPress={() => setShowInviteesModal(false)}>
                    <Text style={styles.modalCloseText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  {/* All Members Option */}
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      selectedInvitees.length === 0 && styles.optionRowSelected,
                    ]}
                    onPress={() => setSelectedInvitees([])}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>All members</Text>
                    {selectedInvitees.length === 0 && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>

                  {/* Individual Connections */}
                  {mockConnections.map((connection) => (
                    <TouchableOpacity
                      key={connection.id}
                      style={[
                        styles.inviteeRow,
                        selectedInvitees.includes(connection.id) && styles.inviteeRowSelected,
                      ]}
                      onPress={() => toggleInvitee(connection.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.inviteeLeft}>
                        <View style={styles.inviteeAvatar}>
                          <Text style={styles.inviteeAvatarText}>{connection.avatar}</Text>
                        </View>
                        <Text style={styles.inviteeName}>{connection.name}</Text>
                      </View>
                      {selectedInvitees.includes(connection.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Visibility Modal */}
          <Modal
            visible={showVisibilityModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowVisibilityModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Visibility</Text>
                  <TouchableOpacity onPress={() => setShowVisibilityModal(false)}>
                    <Text style={styles.modalCloseText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  {userOrgs.filter(org => org.isAdmin).map((org) => (
                    <TouchableOpacity
                      key={org.id}
                      style={[
                        styles.optionRow,
                        visibility === `org_${org.id}` && styles.optionRowSelected,
                      ]}
                      onPress={() => {
                        setVisibility(`org_${org.id}`)
                        setShowVisibilityModal(false)
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.optionText}>Only {org.name}</Text>
                      {visibility === `org_${org.id}` && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      visibility === 'org_members_only' && styles.optionRowSelected,
                    ]}
                    onPress={() => {
                      setVisibility('org_members_only')
                      setShowVisibilityModal(false)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>Org members only</Text>
                    {visibility === 'org_members_only' && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      visibility === 'public' && styles.optionRowSelected,
                    ]}
                    onPress={() => {
                      setVisibility('public')
                      setShowVisibilityModal(false)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>Public</Text>
                    {visibility === 'public' && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  header: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    gap: wp(2),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  viewModeChip: {
    flex: 1,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.background,
  },
  navButton: {
    padding: hp(0.5),
  },
  monthTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.background,
  },
  weekTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  dayNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.background,
  },
  dayTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  createButton: {
    position: 'absolute',
    bottom: hp(12),
    right: wp(6),
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.bondedPurple,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  // Month View Styles
  monthContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp(2),
    paddingTop: hp(1),
  },
  monthDayHeader: {
    width: '14.28%',
    paddingVertical: hp(1),
    alignItems: 'center',
  },
  monthDayHeaderText: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  monthDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: wp(1),
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.background,
  },
  monthDayCellOtherMonth: {
    opacity: 0.3,
  },
  monthDayCellSelected: {
    backgroundColor: '#007AFF',
    borderRadius: hp(2),
  },
  monthDayNumber: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginTop: hp(0.3),
  },
  monthDayNumberOtherMonth: {
    color: theme.colors.textSecondary,
  },
  monthDayNumberSelected: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  monthEventDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(0.5),
    marginTop: hp(0.2),
    justifyContent: 'center',
    width: '100%',
  },
  monthEventDot: {
    width: hp(0.6),
    height: hp(0.6),
    borderRadius: hp(0.3),
  },
  monthEventsList: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(10),
  },
  monthEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    gap: wp(3),
  },
  monthEventDotLarge: {
    width: hp(1),
    height: hp(1),
    borderRadius: hp(0.5),
  },
  monthEventContent: {
    flex: 1,
  },
  monthEventTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.2),
  },
  monthEventTime: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  monthEventBadge: {
    fontSize: hp(1.1),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: hp(0.2),
  },
  noEventsContainer: {
    paddingVertical: hp(3),
    alignItems: 'center',
  },
  noEventsText: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  // Week View Styles
  weekContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
    backgroundColor: theme.colors.background,
  },
  weekHeaderTimeColumn: {
    width: wp(15),
    borderRightWidth: 1,
    borderRightColor: theme.colors.offWhite,
  },
  weekHeaderDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(1),
    borderRightWidth: 1,
    borderRightColor: theme.colors.offWhite,
  },
  weekHeaderDaySelected: {
    backgroundColor: '#007AFF',
  },
  weekHeaderDayName: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: hp(0.3),
  },
  weekHeaderDayNameSelected: {
    color: theme.colors.white,
  },
  weekHeaderDayNumber: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  weekHeaderDayNumberSelected: {
    color: theme.colors.white,
  },
  weekTimeline: {
    flex: 1,
  },
  weekHourRow: {
    flexDirection: 'row',
    minHeight: hp(6),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  weekHourLabel: {
    width: wp(15),
    paddingTop: hp(0.5),
    paddingHorizontal: wp(2),
    borderRightWidth: 1,
    borderRightColor: theme.colors.offWhite,
    justifyContent: 'flex-start',
  },
  weekHourText: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  weekHourContent: {
    flex: 1,
    flexDirection: 'row',
  },
  weekDayColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: theme.colors.offWhite,
    padding: wp(0.5),
  },
  weekEventBlock: {
    padding: wp(2),
    borderRadius: theme.radius.md,
    marginBottom: hp(0.5),
  },
  weekEventTitle: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: hp(0.2),
  },
  weekEventTime: {
    fontSize: hp(1.1),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.white,
    opacity: 0.9,
  },
  // Day View Styles
  dayContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dayHeader: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  dayHeaderDate: {
    fontSize: hp(2.5),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  dayTimeline: {
    flex: 1,
  },
  dayHourRow: {
    flexDirection: 'row',
    minHeight: hp(6),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  dayHourLabel: {
    width: wp(15),
    paddingTop: hp(0.5),
    paddingHorizontal: wp(4),
    borderRightWidth: 1,
    borderRightColor: theme.colors.offWhite,
    justifyContent: 'flex-start',
  },
  dayHourText: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  dayHourContent: {
    flex: 1,
    padding: wp(2),
  },
  dayHourLine: {
    height: 1,
    backgroundColor: theme.colors.surface,
    marginTop: hp(0.5),
  },
  dayEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    gap: wp(3),
  },
  dayEventDot: {
    width: hp(1),
    height: hp(1),
    borderRadius: hp(0.5),
  },
  dayEventContent: {
    flex: 1,
  },
  dayEventTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.2),
  },
  dayEventTime: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  createEventModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '90%',
  },
  createEventModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  createEventModalTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modalCancelText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
    color: theme.colors.accent,
  },
  modalCreateText: {
    fontWeight: '600',
  },
  createEventModalBody: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  createEventField: {
    marginBottom: hp(2.5),
  },
  createEventLabel: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(1),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createEventInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  createEventSelectField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
    gap: wp(2),
  },
  createEventSelectText: {
    flex: 1,
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  modalTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modalCloseText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  modalBody: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md,
    marginBottom: hp(1),
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  optionRowSelected: {
    backgroundColor: theme.colors.bondedPurple + '10',
    borderColor: theme.colors.bondedPurple,
  },
  optionText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
  },
  checkmark: {
    fontSize: hp(2),
    color: theme.colors.accent,
    fontWeight: '700',
  },
  inviteeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md,
    marginBottom: hp(1),
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  inviteeRowSelected: {
    backgroundColor: theme.colors.bondedPurple + '10',
    borderColor: theme.colors.bondedPurple,
  },
  inviteeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inviteeAvatar: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  inviteeAvatarText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  inviteeName: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingBottom: hp(2),
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  pickerModalTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  pickerModalButton: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  pickerModalButtonDone: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
})
