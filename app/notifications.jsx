import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppCard from '../components/AppCard'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { hp, wp } from '../helpers/common'
import { useFriendRequests, useAcceptFriendRequest, useDeclineFriendRequest } from '../hooks/useFriends'
import { useAppTheme } from './theme'

// Format time ago
const formatTimeAgo = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / (60 * 1000))
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Notifications() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  
  // Fetch friend requests
  const { data: friendRequests = [], isLoading, refetch } = useFriendRequests()
  const acceptRequest = useAcceptFriendRequest()
  const declineRequest = useDeclineFriendRequest()
  
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  // Transform friend requests into notification format
  const notifications = useMemo(() => {
    return friendRequests.map(request => ({
      id: request.id,
      type: 'friend_request',
      title: 'Friend Request',
      body: `${request.sender?.full_name || request.sender?.username || 'Someone'} wants to be your friend`,
      timeAgo: formatTimeAgo(request.created_at),
      icon: 'person-add-outline',
      read: false,
      sender: request.sender,
      senderId: request.sender_id,
      message: request.message,
    }))
  }, [friendRequests])

  const handleAccept = (item) => {
    acceptRequest.mutate({
      requestId: item.id,
      senderId: item.senderId,
    })
  }

  const handleDecline = (item) => {
    declineRequest.mutate({
      requestId: item.id,
    })
  }

  const FriendRequestItem = React.memo(({ item, index }) => {
    const slideAnim = React.useRef(new Animated.Value(50)).current
    const opacityAnim = React.useRef(new Animated.Value(0)).current
    const isProcessing = acceptRequest.isPending || declineRequest.isPending

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start()
    }, [])

    return (
      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <AppCard style={styles.notificationCardWrapper}>
          <LinearGradient
            colors={['#A855F7', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.unreadStrip}
          />
          <View style={styles.friendRequestCard}>
            {/* Avatar */}
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => {
                // Could navigate to profile
              }}
            >
              {item.sender?.avatar_url ? (
                <Image 
                  source={{ uri: item.sender.avatar_url }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={hp(2.5)} color={theme.colors.white} />
                </View>
              )}
            </TouchableOpacity>
            
            {/* Content */}
            <View style={styles.notificationContent}>
              <Text style={styles.friendRequestTitle}>
                {item.sender?.full_name || item.sender?.username || 'Someone'}
              </Text>
              <Text style={styles.friendRequestSubtitle}>
                wants to be your friend
              </Text>
              {item.message && (
                <Text style={styles.friendRequestMessage}>
                  "{item.message}"
                </Text>
              )}
              <Text style={styles.notificationTime}>{item.timeAgo}</Text>
              
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAccept(item)}
                  disabled={isProcessing}
                >
                  {acceptRequest.isPending ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleDecline(item)}
                  disabled={isProcessing}
                >
                  {declineRequest.isPending ? (
                    <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                  ) : (
                    <Text style={styles.declineButtonText}>Decline</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </AppCard>
      </Animated.View>
    )
  })

  const NotificationItem = React.memo(({ item, index }) => {
    const slideAnim = React.useRef(new Animated.Value(50)).current
    const opacityAnim = React.useRef(new Animated.Value(0)).current

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start()
    }, [])

    return (
      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <AppCard style={styles.notificationCardWrapper}>
          {!item.read && (
            <LinearGradient
              colors={['#A855F7', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.unreadStrip}
            />
          )}
          <TouchableOpacity
            style={styles.notificationCard}
            activeOpacity={0.7}
          >
            <View style={styles.notificationIconContainer}>
              <Ionicons
                name={item.icon}
                size={hp(2.2)}
                color={item.read ? theme.colors.textSecondary : theme.colors.bondedPurple}
              />
            </View>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
                {item.title}
              </Text>
              <Text style={styles.notificationBody}>{item.body}</Text>
              <Text style={styles.notificationTime}>{item.timeAgo}</Text>
            </View>
          </TouchableOpacity>
        </AppCard>
      </Animated.View>
    )
  })

  const renderNotification = ({ item, index }) => {
    if (item.type === 'friend_request') {
      return <FriendRequestItem item={item} index={index} />
    }
    return <NotificationItem item={item} index={index} />
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppHeader
          title="Notifications"
          rightAction={() => {}}
          rightActionLabel=""
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.bondedPurple} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="notifications-off-outline" 
              size={hp(6)} 
              color={theme.colors.textSecondary} 
              style={{ opacity: 0.5 }}
            />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! Friend requests and other notifications will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[theme.colors.bondedPurple]}
                tintColor={theme.colors.bondedPurple}
              />
            }
          />
        )}

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
  listContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(10),
  },
  notificationCardWrapper: {
    marginBottom: hp(1.5),
    position: 'relative',
    overflow: 'hidden',
  },
  unreadStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: wp(4),
    alignItems: 'flex-start',
  },
  friendRequestCard: {
    flexDirection: 'row',
    padding: wp(4),
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: wp(3),
  },
  avatar: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconContainer: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.4),
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationBody: {
    fontSize: hp(1.7),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.4),
    marginBottom: hp(0.5),
  },
  notificationTime: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    opacity: 0.7,
    fontFamily: theme.typography.fontFamily.body,
  },
  friendRequestTitle: {
    fontSize: hp(1.9),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  friendRequestSubtitle: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(0.5),
  },
  friendRequestMessage: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontStyle: 'italic',
    marginBottom: hp(0.5),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: wp(2),
    marginTop: hp(1.5),
  },
  acceptButton: {
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    borderRadius: theme.radius.md,
    minWidth: wp(20),
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
  declineButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: wp(20),
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: hp(10),
  },
  loadingText: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(2),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(10),
    paddingBottom: hp(10),
  },
  emptyTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptySubtitle: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
    lineHeight: hp(2.2),
  },
})
