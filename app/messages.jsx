import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Image, Modal, Pressable, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { hp, wp } from '../helpers/common'
import AppTopBar from '../components/AppTopBar'
import BottomNav from '../components/BottomNav'
import { useAppTheme } from './theme'
import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'

const MOCK_SUGGESTED_PEOPLE = [
  { id: 'suggest-1', name: 'Alex', photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: 'suggest-2', name: 'Jordan', photoUrl: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: 'suggest-3', name: 'Taylor', photoUrl: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { id: 'suggest-4', name: 'Casey', photoUrl: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { id: 'suggest-5', name: 'Riley', photoUrl: 'https://randomuser.me/api/portraits/men/5.jpg' },
  { id: 'suggest-6', name: 'Morgan', photoUrl: 'https://randomuser.me/api/portraits/women/6.jpg' },
]

const MOCK_FRIENDS = [
  { id: 'friend-1', name: 'Alex Johnson', photoUrl: 'https://randomuser.me/api/portraits/men/20.jpg', major: 'Computer Science' },
  { id: 'friend-2', name: 'Sarah Williams', photoUrl: 'https://randomuser.me/api/portraits/women/21.jpg', major: 'Business' },
  { id: 'friend-3', name: 'Michael Brown', photoUrl: 'https://randomuser.me/api/portraits/men/22.jpg', major: 'Engineering' },
  { id: 'friend-4', name: 'Emily Davis', photoUrl: 'https://randomuser.me/api/portraits/women/23.jpg', major: 'Psychology' },
  { id: 'friend-5', name: 'David Miller', photoUrl: 'https://randomuser.me/api/portraits/men/24.jpg', major: 'Biology' },
  { id: 'friend-6', name: 'Jessica Garcia', photoUrl: 'https://randomuser.me/api/portraits/women/25.jpg', major: 'Marketing' },
]

const MOCK_PRIVATE_FORUMS = [
  { id: 'forum-1', name: 'Roommates', memberCount: 4 },
  { id: 'forum-2', name: 'Project Group', memberCount: 6 },
  { id: 'forum-3', name: 'Study Group CS 201', memberCount: 8 },
  { id: 'forum-4', name: 'Dorm Floor 3', memberCount: 12 },
]

const MOCK_MESSAGES = [
  {
    id: 'msg-1',
    userId: 'user-1',
    userName: 'Adam',
    userPhoto: 'https://randomuser.me/api/portraits/men/10.jpg',
    lastMessage: "Hey, what's up?",
    timestamp: '2:05 PM',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'msg-2',
    userId: 'user-2',
    userName: 'Sarah',
    userPhoto: 'https://randomuser.me/api/portraits/women/11.jpg',
    lastMessage: 'I was thinking we could study together for the midterm',
    timestamp: '11:30 AM',
    unreadCount: 2,
    isOnline: false,
  },
  {
    id: 'msg-3',
    userId: 'user-3',
    userName: 'John',
    userPhoto: 'https://randomuser.me/api/portraits/men/12.jpg',
    lastMessage: 'See you at the library later?',
    timestamp: 'Yesterday',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'msg-4',
    userId: 'user-4',
    userName: 'Emily',
    userPhoto: 'https://randomuser.me/api/portraits/women/13.jpg',
    lastMessage: 'Are you going to the campus event tonight?',
    timestamp: 'Sunday',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 'msg-5',
    userId: 'user-5',
    userName: 'Michael',
    userPhoto: 'https://randomuser.me/api/portraits/men/14.jpg',
    lastMessage: 'Thanks for the notes! Really helped me out',
    timestamp: 'Saturday',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'msg-6',
    userId: 'user-6',
    userName: 'Jessica',
    userPhoto: 'https://randomuser.me/api/portraits/women/15.jpg',
    lastMessage: 'Can you send me the assignment details?',
    timestamp: 'Friday',
    unreadCount: 1,
    isOnline: false,
  },
  {
    id: 'msg-7',
    userId: 'user-7',
    userName: 'David',
    userPhoto: 'https://randomuser.me/api/portraits/men/16.jpg',
    lastMessage: 'The study group is meeting at 3pm',
    timestamp: 'Thursday',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 'msg-8',
    userId: 'user-8',
    userName: 'Olivia',
    userPhoto: 'https://randomuser.me/api/portraits/women/17.jpg',
    lastMessage: 'See you in class!',
    timestamp: 'Wednesday',
    unreadCount: 0,
    isOnline: true,
  },
]

export default function Messages() {
  const router = useRouter()
  const theme = useAppTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false)
  const [isFriendSelectionVisible, setIsFriendSelectionVisible] = useState(false)
  const [isForumSelectionVisible, setIsForumSelectionVisible] = useState(false)
  const [activeProfile, setActiveProfile] = useState(null)

  const filteredMessages = MOCK_MESSAGES.filter((msg) =>
    msg.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderSuggestedPerson = (person) => (
    <TouchableOpacity
      key={person.id}
      style={styles.suggestedPerson}
      activeOpacity={0.7}
      onPress={() => {
        // TODO: Navigate to chat with this person
      }}
    >
      <View style={styles.suggestedAvatar}>
        <Image source={{ uri: person.photoUrl }} style={styles.suggestedAvatarImage} />
      </View>
      <Text style={styles.suggestedName} numberOfLines={1}>
        {person.name}
      </Text>
    </TouchableOpacity>
  )

  const renderMessageThread = ({ item }) => (
    <TouchableOpacity
      style={styles.messageThread}
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: '/chat',
          params: { userId: item.userId, userName: item.userName },
        })
      }}
    >
      <TouchableOpacity
        style={styles.avatarContainer}
        activeOpacity={0.7}
        onPress={(e) => {
          e.stopPropagation()
          setActiveProfile({
            id: item.userId,
            name: item.userName,
            photo: item.userPhoto,
            isOnline: item.isOnline,
            groupjamScore: Math.floor(Math.random() * 40) + 60,
          })
        }}
      >
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
      </TouchableOpacity>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.userName}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <View style={styles.messagePreviewRow}>
          <Text style={styles.messagePreview} numberOfLines={1}>
            {item.lastMessage}
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
            <Ionicons name="arrow-back" size={hp(2.2)} color="#000000" />
          </TouchableOpacity>
          
          {/* Centered Link Icon in Soft Capsule */}
          <View style={styles.logoCapsule}>
            <View style={styles.logoCapsuleInner}>
              <Image
                source={require('../assets/images/transparent-bonded.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.composeButton}
            activeOpacity={0.6}
            onPress={() => setIsNewChatModalVisible(true)}
          >
            <Ionicons name="create-outline" size={hp(2.2)} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Modern iOS-style Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={hp(1.8)}
              color="#8E8E93"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#8E8E93"
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
                color="#8E8E93"
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestedList}
            decelerationRate="fast"
          >
            {MOCK_SUGGESTED_PEOPLE.map(renderSuggestedPerson)}
          </ScrollView>
        </View>

        {/* Message Threads List */}
        <FlatList
          data={filteredMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageThread}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

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
          transparent
          animationType="slide"
          onRequestClose={() => setIsFriendSelectionVisible(false)}
        >
          <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
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
                  color={theme.colors.softBlack}
                  style={{ opacity: 0.6 }}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search friends..."
                  placeholderTextColor={theme.colors.softBlack}
                />
              </View>

              <FlatList
                data={MOCK_FRIENDS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.friendItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      router.push({
                        pathname: '/chat',
                        params: { userId: item.id, userName: item.name },
                      })
                      setIsFriendSelectionVisible(false)
                    }}
                  >
                    <Image source={{ uri: item.photoUrl }} style={styles.friendAvatar} />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{item.name}</Text>
                      <Text style={styles.friendMajor}>{item.major}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={hp(2)} color={theme.colors.softBlack} style={{ opacity: 0.5 }} />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.friendsList}
              />
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

              <FlatList
                data={MOCK_PRIVATE_FORUMS}
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
                        color={theme.colors.charcoal}
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
    backgroundColor: '#F2F2F7',
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
    paddingVertical: hp(1.2),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  backButton: {
    width: hp(4),
    height: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCapsule: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCapsuleInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: hp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerLogo: {
    height: hp(2),
    width: hp(8),
  },
  composeButton: {
    width: hp(4),
    height: hp(4),
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
    backgroundColor: '#E5E5EA',
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
    color: '#000000',
    marginLeft: wp(2),
    fontWeight: '400',
  },
  // Improved Suggested Section
  suggestedSection: {
    paddingTop: hp(1.2),
    paddingBottom: hp(1.5),
    backgroundColor: '#FFFFFF',
  },
  suggestedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
    paddingHorizontal: wp(4),
  },
  suggestedTitle: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: '#000000',
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
    backgroundColor: '#FFFFFF',
  },
  suggestedAvatarImage: {
    width: '100%',
    height: '100%',
  },
  suggestedName: {
    fontSize: hp(1.3),
    color: '#000000',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
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
    backgroundColor: '#E5E5EA',
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
    borderColor: '#FFFFFF',
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
    color: '#000000',
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
    color: '#707070',
    flex: 1,
    fontWeight: '400',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
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
    backgroundColor: '#E5E5EA', // iOS separator
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
    paddingTop: hp(4),
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
})

