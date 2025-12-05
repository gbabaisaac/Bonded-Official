import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Linking,
  Modal,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { hp, wp } from '../../helpers/common'
import theme from '../../constants/theme'
import AppTopBar from '../../components/AppTopBar'
import BottomNav from '../../components/BottomNav'
import { useMockEvents } from '../../hooks/events/useMockEvents'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Share2, 
  Heart, 
  HeartFill, 
  ChevronLeft,
  UserPlus,
  ChevronRight,
} from '../../components/Icons'

export default function EventDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const { data: allEvents = [] } = useMockEvents()

  const event = allEvents.find((e) => e.id === id)
  const [isGoing, setIsGoing] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showGuestList, setShowGuestList] = useState(false)

  // Mock guest list
  const guestList = [
    { id: 'user-1', name: 'Danielle Williams', avatar: 'DW' },
    { id: 'user-2', name: 'John Smith', avatar: 'JS' },
    { id: 'user-3', name: 'Sarah Johnson', avatar: 'SJ' },
    { id: 'user-4', name: 'Mike Chen', avatar: 'MC' },
    { id: 'user-5', name: 'Emma Davis', avatar: 'ED' },
  ]

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${event.title}\n${event.description || ''}`,
        title: event.title,
      })
    } catch (error) {
      console.log('Share error:', error)
    }
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  const openMaps = () => {
    if (!event.location_name) return
    
    const encodedLocation = encodeURIComponent(event.location_name)
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${encodedLocation}`,
      android: `geo:0,0?q=${encodedLocation}`,
    })
    
    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error('Error opening maps:', err)
        // Fallback to web maps
        Linking.openURL(`https://maps.google.com/?q=${encodedLocation}`)
      })
    }
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <AppTopBar
            schoolName="University of Rhode Island"
            onPressProfile={() => router.push('/profile')}
            onPressSchool={() => {}}
            onPressNotifications={() => router.push('/notifications')}
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Event not found</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const monthDay = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return `${dayName}, ${monthDay}`
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const attendeesCount = event.attendees_count || 0

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header with Back, Share, and Heart */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={hp(2.5)} color={theme.colors.white} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <Share2 size={hp(2.2)} color={theme.colors.white} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              {isSaved ? (
                <HeartFill size={hp(2.2)} color="#FF3B30" strokeWidth={2.5} fill="#FF3B30" />
              ) : (
                <Heart size={hp(2.2)} color={theme.colors.white} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Image */}
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverImagePlaceholder}>
              <Calendar size={hp(8)} color={theme.colors.bondedPurple} />
            </View>
          )}

          {/* Event Info */}
          <View style={styles.content}>
            <Text style={styles.title}>{event.title}</Text>

            {/* Date & Time */}
            <View style={styles.infoRow}>
              <Calendar size={hp(2.2)} color={theme.colors.bondedPurple} />
              <Text style={styles.infoValue}>
                {formatDate(event.start_at)} • {formatTime(event.start_at)}
                {event.end_at && ` - ${formatTime(event.end_at)}`}
              </Text>
            </View>

            {/* Location - Clickable for Maps */}
            {event.location_name && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={openMaps}
                activeOpacity={0.7}
              >
                <MapPin size={hp(2.2)} color={theme.colors.bondedPurple} />
                <Text style={[styles.infoValue, styles.locationLink]}>{event.location_name}</Text>
                <ChevronRight size={hp(1.8)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Organizer Section */}
            {event.org && (
              <View style={styles.organizerSection}>
                <View style={styles.organizerHeader}>
                  <View style={styles.organizerLeft}>
                    <View style={styles.organizerAvatar}>
                      <Text style={styles.organizerAvatarText}>
                        {event.org.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.organizerInfo}>
                      <Text style={styles.organizerLabel}>Organized by</Text>
                      <Text style={styles.organizerName}>{event.org.name}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      isFollowing && styles.followButtonActive,
                    ]}
                    onPress={handleFollow}
                    activeOpacity={0.8}
                  >
                    <UserPlus
                      size={hp(1.6)}
                      color={isFollowing ? theme.colors.white : theme.colors.bondedPurple}
                      strokeWidth={2.5}
                    />
                    <Text
                      style={[
                        styles.followButtonText,
                        isFollowing && styles.followButtonTextActive,
                      ]}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Guest List Section */}
            {!event.hide_guest_list && (
              <TouchableOpacity
                style={styles.guestListSection}
                onPress={() => setShowGuestList(true)}
                activeOpacity={0.7}
              >
                <View style={styles.guestListHeader}>
                  <Text style={styles.guestListTitle}>Guest List</Text>
                  <ChevronRight size={hp(2)} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.guestListAvatars}>
                  {guestList.slice(0, 8).map((guest, i) => (
                    <View key={guest.id} style={styles.guestAvatar}>
                      <Text style={styles.guestAvatarText}>{guest.avatar}</Text>
                    </View>
                  ))}
                  {guestList.length > 8 && (
                    <View style={styles.moreGuests}>
                      <Text style={styles.moreGuestsText}>+{guestList.length - 8}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.guestListCount}>
                  {attendeesCount} {attendeesCount === 1 ? 'person' : 'people'} going
                </Text>
              </TouchableOpacity>
            )}

            {/* Description */}
            {event.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionTitle}>About this event</Text>
                <Text style={styles.descriptionText}>{event.description}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              {!event.requires_approval && !event.is_paid && (
                <TouchableOpacity
                  style={[styles.actionButton, isGoing && styles.actionButtonActive]}
                  onPress={() => setIsGoing(!isGoing)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonText, isGoing && styles.actionButtonTextActive]}>
                    {isGoing ? 'Going ✓' : 'Going'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Guest List Modal */}
        <Modal
          visible={showGuestList}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGuestList(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Guest List</Text>
                <TouchableOpacity
                  onPress={() => setShowGuestList(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>
                  {attendeesCount} {attendeesCount === 1 ? 'person' : 'people'} going
                </Text>
                {guestList.map((guest) => (
                  <View key={guest.id} style={styles.guestListItem}>
                    <View style={styles.guestListItemAvatar}>
                      <Text style={styles.guestListItemAvatarText}>{guest.avatar}</Text>
                    </View>
                    <Text style={styles.guestListItemName}>{guest.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <BottomNav />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offWhite,
  },
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1),
    zIndex: 100,
  },
  headerButton: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: wp(2),
  },
  headerIconButton: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(10),
  },
  coverImage: {
    width: '100%',
    height: hp(30),
    resizeMode: 'cover',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: hp(30),
    backgroundColor: theme.colors.bondedPurple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: wp(4),
  },
  title: {
    fontSize: hp(3.5),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '800',
    color: theme.colors.charcoal,
    marginBottom: hp(2),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(1.5),
  },
  infoValue: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.charcoal,
    flex: 1,
  },
  locationLink: {
    textDecorationLine: 'underline',
  },
  organizerSection: {
    marginTop: hp(2),
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  organizerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  organizerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  organizerAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  organizerAvatarText: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.white,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerLabel: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginBottom: hp(0.2),
  },
  organizerName: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.bondedPurple,
    backgroundColor: theme.colors.white,
    gap: wp(1.5),
  },
  followButtonActive: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.bondedPurple,
  },
  followButtonText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.bondedPurple,
  },
  followButtonTextActive: {
    color: theme.colors.white,
  },
  guestListSection: {
    marginTop: hp(2),
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  guestListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  guestListTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
  },
  guestListAvatars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(1),
  },
  guestAvatar: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAvatarText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  moreGuests: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreGuestsText: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  guestListCount: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
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
    color: theme.colors.charcoal,
  },
  modalCloseText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.bondedPurple,
  },
  modalBody: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  modalSubtitle: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginBottom: hp(2),
  },
  guestListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  guestListItemAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  guestListItemAvatarText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  guestListItemName: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  descriptionSection: {
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  descriptionTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
    marginBottom: hp(1),
  },
  descriptionText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
    lineHeight: hp(2.4),
  },
  goingSection: {
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  goingSectionTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
    marginBottom: hp(1),
  },
  goingAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  avatarPlaceholder: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  moreAttendees: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.softBlack,
  },
  actionSection: {
    flexDirection: 'row',
    gap: wp(2),
    marginTop: hp(2),
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  actionButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  actionButtonTextActive: {
    color: theme.colors.white,
  },
  declineButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.bondedPurple,
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.bondedPurple,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(4),
  },
  errorText: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    marginBottom: hp(2),
  },
  backButton: {
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.xl,
  },
  backButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
})
