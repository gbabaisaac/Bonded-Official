import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  Alert,
    FlatList,
    Image,
  Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppTopBar from '../../components/AppTopBar'
import BottomNav from '../../components/BottomNav'
import EventPost from '../../components/Events/EventPost'
import InviteModal from '../../components/InviteModal'
import ShareModal from '../../components/ShareModal'
import { useClubsContext } from '../../contexts/ClubsContext'
import { useEventsContext } from '../../contexts/EventsContext'
import { hp, wp } from '../../helpers/common'
import { useAppTheme } from '../theme'

export default function ClubDetail() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const {
    getClub,
    isUserMember,
    hasUserRequested,
    isUserInterested,
    requestToJoin,
    showInterest,
    removeInterest,
    leaveClub,
    isUserAdmin,
    removeMember,
    currentUserId,
  } = useClubsContext()
  const { getAllEvents } = useEventsContext()
  const [activeTab, setActiveTab] = useState('posts') // Default to posts for Instagram-like view
  const [viewMode, setViewMode] = useState('member') // LinkedIn-style view switcher ('member' | 'admin')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const club = getClub(id)
  const allEvents = getAllEvents()
  const clubEvents = allEvents.filter((event) =>
    club?.events?.includes(event.id)
  )
  const isAdmin = club ? isUserAdmin(club.id) : false

  // Auto-switch to admin view if user is admin
  useEffect(() => {
    if (isAdmin && viewMode === 'member') {
      setViewMode('admin')
    }
  }, [isAdmin])

  if (!club) {
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
            <Text style={styles.errorText}>Club not found</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
          <BottomNav />
        </View>
      </SafeAreaView>
    )
  }

  const isMember = isUserMember(club.id)
  const hasRequested = hasUserRequested(club.id)
  const interested = isUserInterested(club.id)
  const memberCount = club.members?.length || 0

  const handleJoin = () => {
    if (isMember) {
      leaveClub(club.id)
    } else {
      requestToJoin(club.id)
    }
  }

  const handleInterest = () => {
    if (interested) {
      removeInterest(club.id)
    } else {
      showInterest(club.id)
    }
  }

  const renderMember = ({ item: userId }) => {
    // Mock member data - replace with real user data
    const memberNames = {
      'user-1': 'Alex Johnson',
      'user-2': 'Sarah Williams',
      'user-3': 'Mike Chen',
      'user-4': 'Emily Davis',
      'user-123': 'You',
    }
    const memberAvatars = {
      'user-1': 'https://randomuser.me/api/portraits/men/20.jpg',
      'user-2': 'https://randomuser.me/api/portraits/women/21.jpg',
      'user-3': 'https://randomuser.me/api/portraits/men/22.jpg',
      'user-4': 'https://randomuser.me/api/portraits/women/23.jpg',
      'user-123': 'https://randomuser.me/api/portraits/men/1.jpg',
    }

    const isCurrentUser = userId === currentUserId
    const canRemove = isAdmin && viewMode === 'admin' && !isCurrentUser && !club.admins?.includes(userId)

    const handleRemoveMember = () => {
      Alert.alert(
        'Remove Member',
        `Are you sure you want to remove ${memberNames[userId] || 'this member'} from ${club.name}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              const success = removeMember(club.id, userId)
              if (success) {
                Alert.alert('Success', 'Member removed successfully')
              } else {
                Alert.alert('Error', 'Failed to remove member')
              }
            },
          },
        ]
      )
    }

    return (
      <View style={styles.memberItem}>
        <Image
          source={{ uri: memberAvatars[userId] || 'https://randomuser.me/api/portraits/men/1.jpg' }}
          style={styles.memberAvatar}
        />
        <Text style={styles.memberName} numberOfLines={1}>
          {memberNames[userId] || 'Member'}
        </Text>
        {canRemove && (
          <TouchableOpacity
            style={styles.removeMemberButton}
            onPress={handleRemoveMember}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={hp(1.8)} color={theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{item.title || 'Club Post'}</Text>
        <Text style={styles.postDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {item.body && (
        <Text style={styles.postBody} numberOfLines={3}>
          {item.body}
        </Text>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppTopBar
          schoolName="Your University"
          onPressProfile={() => router.push('/profile')}
          onPressSchool={() => {}}
          onPressNotifications={() => router.push('/notifications')}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Image / Banner */}
          <View style={styles.coverImageContainer}>
            {club.coverImage ? (
              <Image source={{ uri: club.coverImage }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverImagePlaceholder}>
                <Ionicons name="image-outline" size={hp(4)} color={theme.colors.softBlack} style={{ opacity: 0.3 }} />
              </View>
            )}
            {/* Avatar / Profile Picture */}
            <View style={styles.avatarContainer}>
              {club.avatar ? (
                <Image source={{ uri: club.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {club.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Club Header */}
          <View style={styles.clubHeader}>
            <View style={styles.clubInfo}>
              <Text style={styles.clubName}>{club.name}</Text>
              <View style={styles.clubMeta}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {club.category.charAt(0).toUpperCase() + club.category.slice(1)}
                  </Text>
                </View>
                <View style={styles.memberCount}>
                  <Ionicons
                    name="people"
                    size={hp(1.8)}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.memberCountText}>{memberCount} members</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={() => setShowShareModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="share-outline"
                  size={hp(2)}
                  color={theme.colors.bondedPurple}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  interested && styles.interestButtonActive,
                ]}
                onPress={handleInterest}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={interested ? 'heart' : 'heart-outline'}
                  size={hp(2)}
                  color={interested ? theme.colors.white : theme.colors.bondedPurple}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{club.description}</Text>

          {/* Meeting Information */}
          {(club.meetingTimes || club.meetingLocation) && (
            <View style={styles.meetingInfoSection}>
              <Text style={styles.sectionTitle}>Meeting Information</Text>
              {club.meetingTimes && club.meetingTimes.length > 0 && (
                <View style={styles.meetingTimesContainer}>
                  {club.meetingTimes.map((meeting, index) => (
                    <View key={index} style={styles.meetingTimeCard}>
                      <View style={styles.meetingTimeHeader}>
                        <Ionicons name="time-outline" size={hp(2)} color={theme.colors.accent} />
                        <Text style={styles.meetingDay}>{meeting.day}</Text>
                        {!club.isMeetingPublic && (
                          <Ionicons name="lock-closed-outline" size={hp(1.5)} color={theme.colors.textSecondary} style={{ marginLeft: theme.spacing.xs }} />
                        )}
                      </View>
                      <Text style={styles.meetingTime}>
                        {new Date(meeting.time).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {club.meetingLocation && (
                <View style={styles.meetingLocationCard}>
                  <Ionicons name="location-outline" size={hp(2)} color={theme.colors.accent} />
                  <Text style={styles.meetingLocationText}>{club.meetingLocation}</Text>
                </View>
              )}
            </View>
          )}

          {/* Stats Row - Instagram style */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{memberCount}</Text>
              <Text style={styles.statLabel}>members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{club.posts?.length || 0}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{clubEvents.length}</Text>
              <Text style={styles.statLabel}>events</Text>
            </View>
          </View>

          {/* View Switcher - LinkedIn style (Admin only) */}
          {isAdmin && (
            <View style={styles.viewSwitcherContainer}>
              <View style={styles.viewSwitcher}>
                <TouchableOpacity
                  style={[
                    styles.viewSwitcherButton,
                    viewMode === 'member' && styles.viewSwitcherButtonActive,
                  ]}
                  onPress={() => setViewMode('member')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.viewSwitcherText,
                      viewMode === 'member' && styles.viewSwitcherTextActive,
                    ]}
                  >
                    Member view
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.viewSwitcherButton,
                    viewMode === 'admin' && styles.viewSwitcherButtonActive,
                  ]}
                  onPress={() => setViewMode('admin')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.viewSwitcherText,
                      viewMode === 'admin' && styles.viewSwitcherTextActive,
                    ]}
                  >
                    Admin view
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons Row */}
          {isAdmin ? (
            <View style={styles.adminActionsRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  router.push(`/clubs/create?id=${club.id}&edit=true`)
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => {
                  // TODO: Navigate to settings
                  Alert.alert('Settings', 'Club settings coming soon')
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={hp(2.2)} color={theme.colors.charcoal} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtonsRow}>
              {hasRequested ? (
                <View style={styles.requestedBadge}>
                  <Ionicons
                    name="time-outline"
                    size={hp(2)}
                    color={theme.colors.bondedPurple}
                  />
                  <Text style={styles.requestedText}>Request Pending</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.joinButton,
                    isMember && styles.leaveButton,
                  ]}
                  onPress={handleJoin}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isMember ? 'checkmark-circle' : 'add-circle-outline'}
                    size={hp(2)}
                    color={theme.colors.white}
                  />
                  <Text style={styles.joinButtonText}>
                    {isMember ? 'Leave Club' : 'Join Club'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* Invite Button - Only show if member */}
              {isMember && (
                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={() => setShowInviteModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={hp(2)}
                    color={theme.colors.bondedPurple}
                  />
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Forum Button - Navigate to organization's forum */}
          {isMember && (
            <TouchableOpacity
              style={styles.forumButton}
              onPress={() => {
                // Navigate to forum with the club's forumId
                router.push(`/forum?forumId=${club.forumId}`)
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={hp(2)} color={theme.colors.white} />
              <Text style={styles.forumButtonText}>View Forum</Text>
            </TouchableOpacity>
          )}

          {/* Create Post Button - Admin only */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.createPostButton}
              onPress={() => {
                // TODO: Navigate to create post
                Alert.alert('Create Post', 'Post creation coming soon')
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={hp(2.5)} color={theme.colors.white} />
              <Text style={styles.createPostButtonText}>Create Post</Text>
            </TouchableOpacity>
          )}

          {/* Tabs - Instagram style */}
          <View style={styles.tabs}>
            {isAdmin && viewMode === 'admin'
              ? ['posts', 'events', 'members', 'requests', 'analytics'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      activeTab === tab && styles.tabActive,
                    ]}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        tab === 'posts' ? 'grid-outline' :
                        tab === 'events' ? 'calendar-outline' :
                        tab === 'members' ? 'people-outline' :
                        tab === 'requests' ? 'person-add-outline' :
                        'stats-chart-outline'
                      }
                      size={hp(2.2)}
                      color={activeTab === tab ? theme.colors.textPrimary : theme.colors.textSecondary}
                      style={{ opacity: activeTab === tab ? 1 : 0.5 }}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab && styles.tabTextActive,
                      ]}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))
              : ['posts', 'events', 'members'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      activeTab === tab && styles.tabActive,
                    ]}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        tab === 'posts' ? 'grid-outline' :
                        tab === 'events' ? 'calendar-outline' :
                        'people-outline'
                      }
                      size={hp(2.2)}
                      color={activeTab === tab ? theme.colors.textPrimary : theme.colors.textSecondary}
                      style={{ opacity: activeTab === tab ? 1 : 0.5 }}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab && styles.tabTextActive,
                      ]}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
          </View>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              {/* Leadership */}
              {club.leadership && club.leadership.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Leadership</Text>
                  {club.leadership.map((leader, index) => (
                    <View key={index} style={styles.leaderItem}>
                      <View style={styles.leaderInfo}>
                        <Text style={styles.leaderName}>{leader.name}</Text>
                        <Text style={styles.leaderRole}>{leader.role}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Quick Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{memberCount}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{club.posts?.length || 0}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{clubEvents.length}</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'posts' && (
            <View style={styles.tabContent}>
              {club.posts && club.posts.length > 0 ? (
                <FlatList
                  data={club.posts}
                  renderItem={renderPost}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="document-text-outline"
                    size={hp(5)}
                    color={theme.colors.textSecondary}
                    style={{ opacity: 0.3 }}
                  />
                  <Text style={styles.emptyStateText}>No posts yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'events' && (
            <View style={styles.tabContent}>
              {clubEvents.length > 0 ? (
                <FlatList
                  data={clubEvents}
                  renderItem={({ item }) => (
                    <EventPost event={item} forumId={club.forumId} />
                  )}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="calendar-outline"
                    size={hp(5)}
                    color={theme.colors.textSecondary}
                    style={{ opacity: 0.3 }}
                  />
                  <Text style={styles.emptyStateText}>No events yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'members' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Members ({memberCount})</Text>
              {club.members && club.members.length > 0 ? (
                <FlatList
                  data={club.members}
                  renderItem={renderMember}
                  keyExtractor={(item) => item}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={styles.membersRow}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="people-outline"
                    size={hp(5)}
                    color={theme.colors.textSecondary}
                    style={{ opacity: 0.3 }}
                  />
                  <Text style={styles.emptyStateText}>No members yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'requests' && isAdmin && viewMode === 'admin' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Join Requests ({club.requests?.length || 0})</Text>
              {club.requests && club.requests.length > 0 ? (
                <FlatList
                  data={club.requests}
                  renderItem={({ item: userId }) => {
                    const memberNames = {
                      'user-1': 'Alex Johnson',
                      'user-2': 'Sarah Williams',
                      'user-3': 'Mike Chen',
                    }
                    const memberAvatars = {
                      'user-1': 'https://randomuser.me/api/portraits/men/20.jpg',
                      'user-2': 'https://randomuser.me/api/portraits/women/21.jpg',
                      'user-3': 'https://randomuser.me/api/portraits/men/22.jpg',
                    }
                    return (
                      <View style={styles.requestItem}>
                        <Image
                          source={{ uri: memberAvatars[userId] || 'https://randomuser.me/api/portraits/men/1.jpg' }}
                          style={styles.requestAvatar}
                        />
                        <View style={styles.requestInfo}>
                          <Text style={styles.requestName}>{memberNames[userId] || 'User'}</Text>
                          <Text style={styles.requestTime}>Requested 2 days ago</Text>
                        </View>
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={styles.approveButton}
                            onPress={() => {
                              // TODO: Approve request
                              Alert.alert('Approved', 'User request approved')
                            }}
                          >
                            <Ionicons name="checkmark" size={hp(2)} color={theme.colors.white} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() => {
                              // TODO: Reject request
                              Alert.alert('Rejected', 'User request rejected')
                            }}
                          >
                            <Ionicons name="close" size={hp(2)} color={theme.colors.white} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )
                  }}
                  keyExtractor={(item) => item}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="person-add-outline"
                    size={hp(5)}
                    color={theme.colors.textSecondary}
                    style={{ opacity: 0.3 }}
                  />
                  <Text style={styles.emptyStateText}>No pending requests</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'analytics' && isAdmin && viewMode === 'admin' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Analytics</Text>
              
              {/* Stats Cards */}
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>{memberCount}</Text>
                  <Text style={styles.analyticsLabel}>Total Members</Text>
                  <Text style={styles.analyticsChange}>+12% this month</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>{club.posts?.length || 0}</Text>
                  <Text style={styles.analyticsLabel}>Total Posts</Text>
                  <Text style={styles.analyticsChange}>+5 this week</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>{clubEvents.length}</Text>
                  <Text style={styles.analyticsLabel}>Events</Text>
                  <Text style={styles.analyticsChange}>3 upcoming</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>89%</Text>
                  <Text style={styles.analyticsLabel}>Engagement</Text>
                  <Text style={styles.analyticsChange}>↑ 4% from last month</Text>
                </View>
              </View>

              {/* Recent Activity */}
              <View style={styles.analyticsSection}>
                <Text style={styles.analyticsSectionTitle}>Recent Activity</Text>
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="person-add" size={hp(2)} color={theme.colors.success} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>5 new members joined this week</Text>
                    <Text style={styles.activityTime}>2 hours ago</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="calendar" size={hp(2)} color={theme.colors.info} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>New event created: "Hackathon 2025"</Text>
                    <Text style={styles.activityTime}>1 day ago</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="chatbubble" size={hp(2)} color={theme.colors.accent} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>3 new posts in the forum</Text>
                    <Text style={styles.activityTime}>2 days ago</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

        </ScrollView>

        {/* Share Modal */}
        <ShareModal
          visible={showShareModal}
          content={{
            type: 'club',
            data: club,
          }}
          onClose={() => setShowShareModal(false)}
        />

        {/* Invite Modal */}
        <InviteModal
          visible={showInviteModal}
          clubName={club.name}
          onClose={() => setShowInviteModal(false)}
          onInvite={(userIds) => {
            // TODO: Send invites to selected users
            Alert.alert('Success', `Invited ${userIds.length} people to ${club.name}`)
          }}
        />

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
    paddingBottom: hp(10),
  },
  coverImageContainer: {
    position: 'relative',
    width: '100%',
    height: hp(25),
    backgroundColor: theme.colors.bondedPurple + '15',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.bondedPurple + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -hp(4),
    left: wp(4),
    width: hp(12),
    height: hp(12),
    borderRadius: hp(6),
    borderWidth: 4,
    borderColor: theme.colors.white,
    backgroundColor: theme.colors.background,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: hp(6),
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: hp(6),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: hp(4),
    fontWeight: '800',
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.heading,
  },
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: wp(4),
    paddingTop: hp(6),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: hp(3),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.5),
  },
  clubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  categoryBadge: {
    backgroundColor: theme.colors.bondedPurple + '15',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  categoryText: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.bondedPurple,
    textTransform: 'capitalize',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  memberCountText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: wp(2),
  },
  actionButton: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.bondedPurple + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.bondedPurple,
  },
  shareButton: {},
  interestButtonActive: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.bondedPurple,
  },
  description: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
    lineHeight: hp(2.6),
    padding: wp(4),
    backgroundColor: theme.colors.background,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: hp(2.2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.3),
  },
  statLabel: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  adminActionsRow: {
    flexDirection: 'row',
    gap: wp(2),
    paddingHorizontal: wp(4),
    marginVertical: hp(2),
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
  },
  editButtonText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  settingsButton: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bondedPurple,
    paddingVertical: hp(1.8),
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    borderRadius: theme.radius.xl,
    gap: wp(2),
  },
  createPostButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: wp(2),
    paddingHorizontal: wp(4),
    marginVertical: hp(2),
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bondedPurple,
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.xl,
    gap: wp(2),
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.bondedPurple,
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.xl,
    gap: wp(2),
  },
  inviteButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.bondedPurple,
  },
  leaveButton: {
    backgroundColor: theme.colors.error,
  },
  joinButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  requestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bondedPurple + '15',
    paddingVertical: hp(1.8),
    marginHorizontal: wp(4),
    marginVertical: hp(2),
    borderRadius: theme.radius.xl,
    gap: wp(2),
    borderWidth: 1,
    borderColor: theme.colors.bondedPurple,
  },
  requestedText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.bondedPurple,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.2),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.bondedPurple,
  },
  tabText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    opacity: 0.6,
  },
  tabTextActive: {
    color: theme.colors.bondedPurple,
    opacity: 1,
  },
  tabContent: {
    padding: wp(4),
    backgroundColor: theme.colors.background,
    minHeight: hp(30),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: hp(1.5),
  },
  meetingInfoSection: {
    marginBottom: hp(2),
  },
  meetingTimesContainer: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  meetingTimeCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  meetingTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  meetingDay: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  meetingTime: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginLeft: hp(3),
  },
  meetingLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  meetingLocationText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    marginBottom: hp(0.5),
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  leaderRole: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: hp(2.2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.3),
  },
  statLabel: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  postCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(1.5),
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  postTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  postDate: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  postBody: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    lineHeight: hp(2.4),
  },
  membersRow: {
    justifyContent: 'space-between',
  },
  memberItem: {
    flex: 1,
    alignItems: 'center',
    marginBottom: hp(2),
    marginHorizontal: wp(1),
    position: 'relative',
  },
  memberAvatar: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    marginBottom: hp(0.5),
  },
  memberName: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    maxWidth: wp(35),
  },
  removeMemberButton: {
    position: 'absolute',
    top: -hp(0.5),
    right: -wp(1),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    padding: hp(0.2),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: hp(8),
  },
  emptyStateText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
    marginTop: hp(1.5),
  },
  emptyStateButton: {
    marginTop: hp(2),
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.xl,
  },
  emptyStateButtonText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  postGridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    marginBottom: wp(1),
  },
  postGridItem: {
    width: (wp(100) - wp(8) - wp(2)) / 3,
    aspectRatio: 1,
    position: 'relative',
  },
  postGridItemMargin: {
    marginRight: wp(1),
  },
  postGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: theme.radius.sm,
  },
  postGridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postGridOverlay: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
    gap: wp(1),
  },
  postGridLikes: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: wp(3),
  },
  requestAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: theme.radius.full,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.2),
  },
  requestTime: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  requestActions: {
    flexDirection: 'row',
    gap: wp(2),
  },
  approveButton: {
    width: hp(4),
    height: hp(4),
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: hp(4),
    height: hp(4),
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    paddingVertical: hp(1.8),
    marginHorizontal: wp(4),
    marginTop: hp(2),
    marginBottom: hp(2),
    borderRadius: theme.radius.xl,
    gap: wp(2),
  },
  forumButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  errorText: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
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
    fontWeight: '600',
    color: theme.colors.white,
  },
  viewSwitcherContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewSwitcherButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewSwitcherButtonActive: {
    backgroundColor: theme.colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  viewSwitcherText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  viewSwitcherTextActive: {
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  analyticsValue: {
    fontSize: theme.typography.sizes.xxl,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  analyticsLabel: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  analyticsChange: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.medium,
  },
  analyticsSection: {
    marginTop: theme.spacing.lg,
  },
  analyticsSectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  activityIcon: {
    width: hp(4),
    height: hp(4),
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  activityTime: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: theme.ui.metaOpacity,
  },
})

