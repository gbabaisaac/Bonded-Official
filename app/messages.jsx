import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomNav from '../components/BottomNav'
import { hp, wp } from '../helpers/common'
import { useFriends } from '../hooks/useFriends'
import { useConversations, useCreateConversation } from '../hooks/useMessages'
import { useProfiles } from '../hooks/useProfiles'
import { useAuthStore } from '../stores/authStore'
import { useAppTheme } from './theme'

// Helper to format timestamp
const formatTimestamp = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  // Less than 1 minute
  if (diff < 60 * 1000) return 'Just now'
  // Less than 1 hour
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m`
  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h`
  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d`
  // Else show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Messages() {
  const router = useRouter()
  const theme = useAppTheme()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false)
  const [isFriendSelectionVisible, setIsFriendSelectionVisible] = useState(false)
  const [isForumSelectionVisible, setIsForumSelectionVisible] = useState(false)
  const [activeProfile, setActiveProfile] = useState(null)

  // Fetch real data
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations()
  const { data: allProfiles = [], isLoading: profilesLoading } = useProfiles({})
  const { data: friendsList = [], isLoading: friendsLoading } = useFriends()
  const createConversation = useCreateConversation()

  // Suggested people = profiles not in current conversations and not friends
  const suggestedPeople = useMemo(() => {
    if (!allProfiles.length) return []
    
    // Get IDs of people we already have conversations with
    const conversationUserIds = new Set()
    conversations.forEach(conv => {
      conv.participants?.forEach(p => conversationUserIds.add(p.id))
    })
    
    // Get IDs of friends
    const friendIds = new Set(friendsList.map(f => f.id))
    
    // Filter out current user, people we have convos with, and friends
    return allProfiles
      .filter(p => p.id !== user?.id && !conversationUserIds.has(p.id) && !friendIds.has(p.id))
      .slice(0, 10) // Limit to 10 suggestions
  }, [allProfiles, conversations, friendsList, user?.id])

  // Transform friends to match expected format
  const friends = useMemo(() => {
    return friendsList.map(friend => ({
      id: friend.id,
      name: friend.full_name || friend.username || 'User',
      photoUrl: friend.avatar_url,
      major: friend.major || '',
    }))
  }, [friendsList])

  // TODO: Fetch private forums from 'forums' table
  const privateForums = []

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    
    const query = searchQuery.toLowerCase()
    return conversations.filter((conv) => {
      const participantNames = conv.participants?.map(p => 
        (p.full_name || p.username || '').toLowerCase()
      ).join(' ') || ''
      
      return participantNames.includes(query) ||
        (conv.lastMessage || '').toLowerCase().includes(query) ||
        (conv.name || '').toLowerCase().includes(query)
    })
  }, [conversations, searchQuery])

  // Handle starting a new conversation
  const handleStartChat = async (otherUserId, userName) => {
    try {
      const conversationId = await createConversation.mutateAsync({ otherUserId })
      router.push({
        pathname: '/chat',
        params: { 
          conversationId,
          userId: otherUserId, 
          userName 
        },
      })
    } catch (error) {
      console.error('Error starting chat:', error)
    }
  }

  const renderSuggestedPerson = (person) => (
    <TouchableOpacity
      key={person.id}
      style={styles.suggestedPerson}
      activeOpacity={0.7}
      onPress={() => handleStartChat(person.id, person.name)}
    >
      <View style={styles.suggestedAvatar}>
        {person.photoUrl ? (
          <Image source={{ uri: person.photoUrl }} style={styles.suggestedAvatarImage} />
        ) : (
          <View style={[styles.suggestedAvatarImage, { backgroundColor: theme.colors.bondedPurple, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: theme.colors.white, fontSize: hp(2), fontWeight: '600' }}>
              {(person.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.suggestedName} numberOfLines={1}>
        {person.name}
      </Text>
    </TouchableOpacity>
  )

  const renderMessageThread = ({ item }) => {
    // Get the other participant for display
    const otherParticipant = item.participants?.[0] || {}
    const displayName = item.type === 'group' 
      ? (item.name || 'Group Chat')
      : (otherParticipant.full_name || otherParticipant.username || 'User')
    const avatarUrl = item.type === 'group'
      ? null // Could use a group icon
      : otherParticipant.avatar_url
    
    return (
      <TouchableOpacity
        style={styles.messageThread}
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: '/chat',
            params: { 
              conversationId: item.id,
              userId: otherParticipant.id, 
              userName: displayName 
            },
          })
        }}
      >
        <TouchableOpacity
          style={styles.avatarContainer}
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation()
            if (item.type !== 'group' && otherParticipant.id) {
              setActiveProfile({
                id: otherParticipant.id,
                name: displayName,
                photo: avatarUrl,
                isOnline: false, // TODO: Wire up online status
                groupjamScore: Math.floor(Math.random() * 40) + 60,
              })
            }
          }}
        >
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.colors.bondedPurple, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons 
                  name={item.type === 'group' ? 'people' : 'person'} 
                  size={hp(2.5)} 
                  color={theme.colors.white} 
                />
              </View>
            )}
            {/* TODO: Online indicator */}
          </View>
        </TouchableOpacity>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.timestamp}>{formatTimestamp(item.lastMessageAt)}</Text>
          </View>
          <View style={styles.messagePreviewRow}>
            <Text style={styles.messagePreview} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const styles = createStyles(theme)

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Modern iOS-style Header */}
        <View style={styles.modernHeader}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.6}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={hp(2.4)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          
          {/* Centered Bonded Logo with Text - Like Yearbook */}
          <View style={styles.bondedLogoContainer}>
            <Image
              source={require('../assets/images/transparent-bonded.png')}
              style={styles.bondedLogo}
              resizeMode="contain"
            />
            <Text style={styles.bondedText}>Bonded</Text>
          </View>
          
          <TouchableOpacity
            style={styles.composeButton}
            activeOpacity={0.6}
            onPress={() => setIsNewChatModalVisible(true)}
          >
            <Ionicons name="create-outline" size={hp(2.4)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Modern iOS-style Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={hp(1.8)}
              color={theme.colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* People you may vibe with - Improved */}
        <View style={styles.suggestedSection}>
          <View style={styles.suggestedHeader}>
            <Text style={styles.suggestedTitle}>People you may vibe with</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons
                name="chevron-forward"
                size={hp(1.8)}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestedList}
            decelerationRate="fast"
          >
            {suggestedPeople.length > 0 ? (
              suggestedPeople.map(renderSuggestedPerson)
            ) : (
              <View style={{ paddingHorizontal: wp(4), paddingVertical: hp(2) }}>
                <Text style={{ fontSize: hp(1.4), color: theme.colors.textSecondary, textAlign: 'center' }}>
                  No suggestions available
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Message Threads List */}
        {conversationsLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.bondedPurple} />
            <Text style={[styles.emptyStateText, { marginTop: hp(2) }]}>Loading conversations...</Text>
          </View>
        ) : filteredMessages.length > 0 ? (
          <FlatList
            data={filteredMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageThread}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={hp(6)} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: hp(2) }} />
            <Text style={styles.emptyStateTitle}>No messages yet</Text>
            <Text style={styles.emptyStateText}>Start a conversation by tapping the compose button or selecting someone from suggestions</Text>
          </View>
        )}

        <BottomNav />

        {/* New Chat Modal */}
        <Modal
          visible={isNewChatModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsNewChatModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsNewChatModalVisible(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>New Chat</Text>
              <Text style={styles.modalSubtitle}>Choose how you want to start a conversation</Text>

              <TouchableOpacity
                style={styles.modalOption}
                activeOpacity={0.7}
                onPress={() => {
                  setIsNewChatModalVisible(false)
                  setIsFriendSelectionVisible(true)
                }}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="person-outline" size={hp(2.5)} color={theme.colors.bondedPurple} />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionTitle}>Chat with Friends</Text>
                  <Text style={styles.modalOptionSubtitle}>Start a conversation with your friends</Text>
                </View>
                <Ionicons name="chevron-forward" size={hp(2)} color={theme.colors.softBlack} style={{ opacity: 0.5 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                activeOpacity={0.7}
                onPress={() => {
                  setIsNewChatModalVisible(false)
                  setIsForumSelectionVisible(true)
                }}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="people-outline" size={hp(2.5)} color={theme.colors.bondedPurple} />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionTitle}>Group Chat from Forum</Text>
                  <Text style={styles.modalOptionSubtitle}>Create a group chat with all members of a private forum</Text>
                </View>
                <Ionicons name="chevron-forward" size={hp(2)} color={theme.colors.softBlack} style={{ opacity: 0.5 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                activeOpacity={0.7}
                onPress={() => setIsNewChatModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Friend Selection Modal */}
        <Modal
          visible={isFriendSelectionVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setIsFriendSelectionVisible(false)}
        >
          <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
            <View style={styles.selectionContainer}>
              <View style={styles.selectionHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  activeOpacity={0.7}
                  onPress={() => setIsFriendSelectionVisible(false)}
                >
                  <Ionicons name="arrow-back" size={hp(2.5)} color={theme.colors.charcoal} />
                </TouchableOpacity>
                <Text style={styles.selectionTitle}>Select Friend</Text>
                <View style={styles.backButton} />
              </View>

              <View style={styles.searchContainer}>
                <Ionicons
                  name="search-outline"
                  size={hp(2.2)}
                  color={theme.colors.textSecondary}
                  style={{ opacity: 0.6 }}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search friends..."
                  placeholderTextColor={theme.colors.softBlack}
                />
              </View>

              {friends.length > 0 ? (
                <FlatList
                  data={friends}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.friendItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      handleStartChat(item.id, item.name)
                      setIsFriendSelectionVisible(false)
                    }}
                  >
                    {item.photoUrl ? (
                      <Image source={{ uri: item.photoUrl }} style={styles.friendAvatar} />
                    ) : (
                      <View style={[styles.friendAvatar, { backgroundColor: theme.colors.bondedPurple, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ color: theme.colors.white, fontSize: hp(2), fontWeight: '600' }}>
                          {(item.name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{item.name}</Text>
                      <Text style={styles.friendMajor}>{item.major || 'Student'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={hp(2)} color={theme.colors.softBlack} style={{ opacity: 0.5 }} />
                  </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.friendsList}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={hp(5)} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: hp(2) }} />
                  <Text style={styles.emptyStateTitle}>No friends yet</Text>
                  <Text style={styles.emptyStateText}>Connect with people to start messaging</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Forum Selection Modal */}
        <Modal
          visible={isForumSelectionVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsForumSelectionVisible(false)}
        >
          <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
            <View style={styles.selectionContainer}>
              <View style={styles.selectionHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  activeOpacity={0.7}
                  onPress={() => setIsForumSelectionVisible(false)}
                >
                  <Ionicons name="arrow-back" size={hp(2.5)} color={theme.colors.charcoal} />
                </TouchableOpacity>
                <Text style={styles.selectionTitle}>Select Private Forum</Text>
                <View style={styles.backButton} />
              </View>

              <Text style={styles.selectionSubtitle}>
                Create a group chat with all members of a private forum
              </Text>

              {privateForums.length > 0 ? (
                <FlatList
                  data={privateForums}
                  keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.forumItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      router.push({
                        pathname: '/chat',
                        params: {
                          forumId: item.id,
                          forumName: item.name,
                          isGroupChat: 'true',
                        },
                      })
                      setIsForumSelectionVisible(false)
                    }}
                  >
                    <View style={styles.forumIcon}>
                      <Ionicons name="people" size={hp(2.5)} color={theme.colors.bondedPurple} />
                    </View>
                    <View style={styles.forumInfo}>
                      <Text style={styles.forumName}>{item.name}</Text>
                      <Text style={styles.forumMemberCount}>{item.memberCount} members</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={hp(2)} color={theme.colors.softBlack} style={{ opacity: 0.5 }} />
                  </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.forumsList}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="lock-closed-outline" size={hp(5)} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: hp(2) }} />
                  <Text style={styles.emptyStateTitle}>No private forums</Text>
                  <Text style={styles.emptyStateText}>Join or create private forums to start group chats</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Profile Modal */}
        <Modal
          visible={!!activeProfile}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveProfile(null)}
        >
          <Pressable
            style={styles.profileModalOverlay}
            onPress={() => setActiveProfile(null)}
          >
            <Pressable
              style={styles.profileModalContent}
              onPress={(e) => e.stopPropagation()}
            >
              {activeProfile && (
                <>
                  {/* Header with close */}
                  <View style={styles.profileModalHeader}>
                    <View style={styles.profileModalHeaderText}>
                      <Text style={styles.profileName}>{activeProfile.name}</Text>
                      <Text style={styles.profileSubText}>
                        {activeProfile.isOnline ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveProfile(null)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons
                        name="close"
                        size={hp(2.6)}
                        color={theme.colors.textPrimary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.profileBody}>
                    {/* Photo */}
                    <View style={styles.profileImageWrapper}>
                      <Image
                        source={{ uri: activeProfile.photo }}
                        style={styles.profileImage}
                      />
                    </View>

                    {/* GroupJam Score */}
                    <View style={styles.profileGroupJamScore}>
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

                    {/* Actions */}
                    <View style={styles.profileActions}>
                      <TouchableOpacity
                        style={[styles.profileButton, styles.profilePrimaryButton]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setActiveProfile(null)
                          router.push({
                            pathname: '/chat',
                            params: { userId: activeProfile.id, userName: activeProfile.name },
                          })
                        }}
                      >
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={hp(2)}
                          color={theme.colors.white}
                          style={{ marginRight: wp(1.5) }}
                        />
                        <Text style={styles.profilePrimaryText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
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
  // Modern iOS-style Header
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.background,
    height: hp(5.5),
  },
  backButton: {
    width: hp(4.5),
    height: hp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bondedLogoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(4),
    gap: wp(1.5),
  },
  bondedLogo: {
    height: hp(2.5),
    width: hp(2.5),
  },
  bondedText: {
    fontSize: hp(2),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  composeButton: {
    width: hp(4.5),
    height: hp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modern Search Bar
  searchWrapper: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(0.8),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: hp(1.2),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.9),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    marginLeft: wp(2),
    fontWeight: '400',
  },
  // Improved Suggested Section
  suggestedSection: {
    paddingTop: hp(1.2),
    paddingBottom: hp(1.5),
    backgroundColor: theme.colors.background,
  },
  suggestedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
    paddingHorizontal: wp(4),
  },
  suggestedTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    opacity: theme.ui.metaOpacity,
    letterSpacing: -0.1,
  },
  suggestedList: {
    paddingHorizontal: wp(4),
    paddingRight: wp(4),
  },
  suggestedPerson: {
    alignItems: 'center',
    marginRight: wp(3),
    width: wp(18),
  },
  suggestedAvatar: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    borderWidth: 1.5,
    borderColor: theme.colors.bondedPurple,
    marginBottom: hp(0.6),
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  suggestedAvatarImage: {
    width: '100%',
    height: '100%',
  },
  suggestedName: {
    fontSize: hp(1.3),
    color: theme.colors.textPrimary,
    fontWeight: '400',
    textAlign: 'center',
  },
  // Modernized Chat List
  messagesList: {
    paddingBottom: hp(12),
    paddingTop: hp(0.5),
  },
  messageThread: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: wp(3),
  },
  avatarWrapper: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  avatar: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
    backgroundColor: theme.colors.backgroundSecondary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: hp(0.2),
    right: hp(0.2),
    width: hp(1.4),
    height: hp(1.4),
    borderRadius: hp(0.7),
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.5),
  },
  userName: {
    fontSize: hp(1.7),
    fontWeight: '500',
    color: theme.colors.textPrimary,
    flex: 1,
    letterSpacing: -0.1,
  },
  timestamp: {
    fontSize: hp(1.2),
    color: '#8E8E93',
    marginLeft: wp(2),
    fontWeight: '400',
  },
  messagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messagePreviewContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagePreview: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    flex: 1,
    fontWeight: '400',
  },
  unreadBadge: {
    backgroundColor: theme.colors.info,
    borderRadius: theme.radius.full,
    minWidth: hp(2),
    height: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1.5),
    marginLeft: wp(2),
  },
  unreadCount: {
    fontSize: hp(1.1),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.colors.backgroundSecondary, // iOS separator
    marginLeft: wp(15),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    padding: wp(5),
    width: wp(85),
    maxWidth: wp(90),
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.5),
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(2.5),
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.backgroundSecondary,
    marginBottom: hp(1.2),
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  modalOptionIcon: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.2),
  },
  modalOptionSubtitle: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  modalCancelButton: {
    paddingVertical: hp(1.5),
    alignItems: 'center',
    marginTop: hp(1),
  },
  modalCancelText: {
    fontSize: hp(1.7),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  selectionContainer: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  backButton: {
    width: hp(4),
    height: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    letterSpacing: -0.2,
  },
  selectionSubtitle: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(2),
  },
  friendsList: {
    paddingBottom: hp(2),
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(1.2),
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  friendAvatar: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
    marginRight: wp(3),
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.2),
  },
  friendMajor: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  forumsList: {
    paddingBottom: hp(2),
  },
  forumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(1.2),
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  forumIcon: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  forumInfo: {
    flex: 1,
  },
  forumName: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.2),
  },
  forumMemberCount: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  profileModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(3),
    maxHeight: '90%',
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  profileModalHeaderText: {
    flex: 1,
    marginRight: wp(4),
  },
  profileName: {
    fontSize: hp(2.6),
    fontWeight: '800',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  profileSubText: {
    marginTop: hp(0.5),
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
  },
  modalCloseButton: {
    padding: hp(0.5),
  },
  profileBody: {
    marginTop: hp(1),
  },
  profileImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    marginBottom: hp(2),
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileActions: {
    marginTop: hp(2),
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.4),
    borderRadius: theme.radius.lg,
  },
  profilePrimaryButton: {
    backgroundColor: theme.colors.accent,
  },
  profilePrimaryText: {
    fontSize: hp(1.8),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  profileGroupJamScore: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(2),
    marginTop: hp(2),
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(8),
  },
  emptyStateTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(1),
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
    lineHeight: hp(2.2),
  },
})

