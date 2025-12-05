import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Share, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Calendar, MapPin, Users, Share2, Heart, HeartFill } from '../Icons'
import { hp, wp } from '../../helpers/common'
import AppCard from '../AppCard'
import { useAppTheme } from '../../app/theme'

export default function EventCard({ event, onPress, currentUserId, attendanceStatus, onAction }) {
  const theme = useAppTheme()
  // Use attendance status from parent if provided, otherwise local state
  const [localGoing, setLocalGoing] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const styles = createStyles(theme)
  const isGoing = attendanceStatus === 'going' || localGoing

  const handleShare = async (e) => {
    e.stopPropagation()
    try {
      await Share.share({
        message: `Check out this event: ${event.title}\n${event.description || ''}`,
        title: event.title,
      })
    } catch (error) {
      console.log('Share error:', error)
    }
  }

  const handleSave = (e) => {
    e.stopPropagation()
    setIsSaved(!isSaved)
    // In real app, save to database
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      const monthDay = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      return `${dayName}, ${monthDay}`
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getVisibilityBadge = () => {
    switch (event.visibility) {
      case 'public':
        return null // No badge for public
      case 'org_only':
        return { label: 'Org Only', color: theme.colors.accent }
      case 'invite_only':
        return { label: 'Invite Only', color: '#FF6B6B' }
      case 'school':
        return { label: 'School Event', color: '#4ECDC4' }
      default:
        return null
    }
  }

  const visibilityBadge = getVisibilityBadge()
  const attendeesCount = event.attendees_count || 0

  return (
    <AppCard
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
      radius="lg"
      padding={false}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.cardContent}
      >
        {/* Event Image */}
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Calendar size={hp(4)} color={theme.colors.accent} strokeWidth={2} />
          </View>
        )}

        {/* Gradient Overlay for Text */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
          style={styles.gradient}
        />

        {/* Top Action Buttons */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Share2 size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            {isSaved ? (
              <HeartFill size={hp(2)} color="#FF3B30" strokeWidth={2.5} fill="#FF3B30" />
            ) : (
              <Heart size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>

        {/* Content Overlay */}
        <View style={styles.overlayContent}>
          {/* Visibility Badge */}
          {visibilityBadge && (
            <View
              style={[
                styles.visibilityBadge,
                { backgroundColor: visibilityBadge.color + '40' },
              ]}
            >
              <Text style={styles.visibilityBadgeText}>
                {visibilityBadge.label}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <Calendar size={hp(1.6)} color={theme.colors.white} strokeWidth={2} />
            <Text style={styles.infoText}>
              {formatDate(event.start_at)} • {formatTime(event.start_at)}
            </Text>
          </View>

          {/* Location */}
          {event.location_name && (
            <View style={styles.infoRow}>
              <MapPin size={hp(1.6)} color={theme.colors.white} strokeWidth={2} />
              <Text style={styles.infoText} numberOfLines={1}>
                {event.location_name}
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {/* Host Info */}
              {event.org && (
                <View style={styles.hostInfo}>
                  <Text style={styles.hostText}>Hosted by {event.org.name}</Text>
                </View>
              )}
              
              {/* Attendees Count */}
              {attendeesCount > 0 && (
                <View style={styles.attendeesBadge}>
                  <Users size={hp(1.4)} color={theme.colors.white} strokeWidth={2} />
                  <Text style={styles.attendeesText}>{attendeesCount}</Text>
                </View>
              )}

              {/* Price Badge */}
              {event.is_paid ? (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>
                    ${(event.ticket_types?.[0]?.price_cents || 0) / 100}
                  </Text>
                </View>
              ) : (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeText}>Free</Text>
                </View>
              )}
            </View>

            {/* Going Badge */}
            {isGoing && (
              <View style={styles.goingBadge}>
                <Text style={styles.goingText}>Going ✓</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {!event.requires_approval && !event.is_paid && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isGoing ? styles.actionButtonActive : styles.actionButtonInactive,
            ]}
            onPress={(e) => {
              e.stopPropagation()
              if (onAction) {
                onAction(event.id, 'going')
              } else {
                setLocalGoing(!localGoing)
              }
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.actionButtonText,
                isGoing && styles.actionButtonTextActive,
              ]}
            >
              {isGoing ? 'Going ✓' : 'Going'}
            </Text>
          </TouchableOpacity>
        )}

        {event.requires_approval && attendanceStatus !== 'pending' && !isGoing && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation()
              if (onAction) {
                onAction(event.id, 'request')
              } else {
                onPress()
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Request to Join</Text>
          </TouchableOpacity>
        )}

        {attendanceStatus === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPending]}
            disabled
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextPending]}>
              Pending Approval
            </Text>
          </TouchableOpacity>
        )}

        {event.is_paid && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={(e) => {
              e.stopPropagation()
              onPress()
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
              Buy Ticket
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </AppCard>
  )
}


const createStyles = (theme) =>
  StyleSheet.create({
    card: {
      width: '100%',
    },
    cardContent: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: theme.radius.lg,
    },
    image: {
      width: '100%',
      height: hp(25),
      resizeMode: 'cover',
    },
    imagePlaceholder: {
      width: '100%',
      height: hp(25),
      backgroundColor: theme.colors.accent + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: hp(12),
    },
    topActions: {
      position: 'absolute',
      top: wp(3),
      right: wp(3),
      flexDirection: 'row',
      gap: wp(2),
      zIndex: 10,
    },
    actionIconButton: {
      width: hp(4),
      height: hp(4),
      borderRadius: hp(2),
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlayContent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: wp(3),
    },
    visibilityBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.4),
      borderRadius: theme.radius.pill,
      marginBottom: hp(0.5),
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    visibilityBadgeText: {
      fontSize: hp(1.1),
      fontFamily: theme.typography.fontFamily.body,
      fontWeight: '600',
      color: theme.colors.white,
    },
    title: {
      fontSize: hp(2),
      fontFamily: theme.typography.fontFamily.heading,
      fontWeight: '700',
      color: theme.colors.white,
      marginBottom: hp(0.5),
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
      marginBottom: hp(0.3),
    },
    infoText: {
      fontSize: hp(1.3),
      fontFamily: theme.typography.fontFamily.body,
      color: theme.colors.white,
      opacity: 0.9,
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: hp(0.5),
    },
    footerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
      flex: 1,
    },
    hostInfo: {
      marginRight: wp(1),
    },
    hostText: {
      fontSize: hp(1.2),
      fontFamily: theme.typography.fontFamily.body,
      color: theme.colors.white,
      opacity: 0.9,
    },
    attendeesBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1),
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: theme.radius.pill,
    },
    attendeesText: {
      fontSize: hp(1.2),
      fontFamily: theme.typography.fontFamily.body,
      fontWeight: '600',
      color: theme.colors.white,
    },
    priceBadge: {
      backgroundColor: theme.colors.accent,
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: theme.radius.pill,
    },
    priceText: {
      fontSize: hp(1.1),
      fontFamily: theme.typography.fontFamily.body,
      fontWeight: '600',
      color: theme.colors.white,
    },
    freeBadge: {
      backgroundColor: theme.colors.accent,
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: theme.radius.pill,
    },
    freeText: {
      fontSize: hp(1.1),
      fontFamily: theme.typography.fontFamily.body,
      fontWeight: '600',
      color: theme.colors.white,
    },
    goingBadge: {
      backgroundColor: theme.colors.accent,
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.4),
      borderRadius: theme.radius.pill,
    },
    goingText: {
      fontSize: hp(1.2),
      fontFamily: theme.typography.fontFamily.body,
      fontWeight: '600',
      color: theme.colors.white,
    },
    actionContainer: {
      paddingHorizontal: wp(3),
      paddingBottom: wp(3),
      paddingTop: wp(1.5),
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    actionButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.accent,
      paddingVertical: hp(1),
      paddingHorizontal: wp(4),
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: hp(4),
      width: '100%',
    },
    actionButtonActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    actionButtonInactive: {
      backgroundColor: theme.colors.surface,
    },
    actionButtonPrimary: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    actionButtonPending: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    actionButtonText: {
      fontSize: hp(1.6),
      fontFamily: theme.typography.fontFamily.body,
      fontWeight: '700',
      color: theme.colors.accent,
      textAlign: 'center',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    actionButtonTextActive: {
      color: theme.colors.white,
    },
    actionButtonTextPrimary: {
      color: theme.colors.white,
    },
    actionButtonTextPending: {
      color: theme.colors.textSecondary,
    },
  })

