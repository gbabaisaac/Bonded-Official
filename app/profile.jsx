import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Image, Platform, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomNav from '../components/BottomNav'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { hp, wp } from '../helpers/common'
import { useAppTheme } from './theme'
import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import Chip from '../components/Chip'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'

const MOCK_USER_PROFILE = {
  id: 'user-me',
  name: 'Alex Smith',
  handle: '@alexsmith',
  email: 'alex.smith@uri.edu',
  photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
  coverPhotoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  major: 'Computer Science',
  year: '2025',
  grade: 'Freshman',
  age: 20,
  gender: 'male',
  bio: 'CS major @ URI 🎓 Always down to study or grab coffee ☕ Love hooping at the rec and late night coding sessions 💻 Hit me up if you need a study buddy!',
  school: 'University of Rhode Island',
  location: 'Kingston, RI',
  groupjamScore: 92,
  interests: ['Coding', 'Basketball', 'Photography', 'Music'],
  socialLinks: {
    instagram: '@alexsmith',
    spotify: 'Alex Smith',
    appleMusic: 'Alex Smith',
  },
}

const MOCK_FRIENDS = [
  { id: 'friend-1', name: 'Sarah Williams', avatar: 'https://randomuser.me/api/portraits/women/21.jpg', major: 'Business', year: '2025' },
  { id: 'friend-2', name: 'Michael Brown', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', major: 'Engineering', year: '2024' },
  { id: 'friend-3', name: 'Emily Davis', avatar: 'https://randomuser.me/api/portraits/women/23.jpg', major: 'Biology', year: '2025' },
  { id: 'friend-4', name: 'David Miller', avatar: 'https://randomuser.me/api/portraits/men/24.jpg', major: 'Computer Science', year: '2026' },
  { id: 'friend-5', name: 'Jessica Garcia', avatar: 'https://randomuser.me/api/portraits/women/25.jpg', major: 'Psychology', year: '2025' },
  { id: 'friend-6', name: 'Chris Wilson', avatar: 'https://randomuser.me/api/portraits/men/26.jpg', major: 'Economics', year: '2024' },
]

export default function Profile() {
  const router = useRouter()
  const theme = useAppTheme()
  const [userProfile, setUserProfile] = useState(MOCK_USER_PROFILE)
  const [showFriendsModal, setShowFriendsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editBio, setEditBio] = useState(userProfile.bio)
  const [editSocialLinks, setEditSocialLinks] = useState(userProfile.socialLinks)
  const styles = createStyles(theme)

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <AppHeader
          rightAction={() => {
            setShowEditModal(true)
          }}
          rightActionLabel="•••"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Photo Section - Top 40% */}
          <View style={styles.coverSection}>
            <Image
              source={{ uri: userProfile.coverPhotoUrl }}
              style={styles.coverImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
              style={styles.coverGradient}
            />
          </View>

          {/* Profile Cards Stack */}
          <View style={styles.cardsContainer}>
            {/* Name and Username Card */}
            <AppCard style={styles.profileCard}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <Text style={styles.profileHandle}>{userProfile.handle}</Text>
            </AppCard>

            {/* Bio Card */}
            <AppCard style={styles.bioCard}>
              <Text style={styles.bioText}>{userProfile.bio}</Text>
            </AppCard>

            {/* Friends Button */}
            <PrimaryButton
              label="Friends"
              icon="people-outline"
              onPress={() => {
                // Open friends drawer
                if (typeof window !== 'undefined' && window.drawerRef) {
                  window.drawerRef.openDrawer()
                }
                // For now, we'll use a modal approach
                setShowFriendsModal(true)
              }}
              style={styles.friendsButton}
            />

            {/* Info Chips */}
            <View style={styles.chipsRow}>
              <Chip
                label={userProfile.major}
                icon="school-outline"
                style={styles.chip}
              />
              <Chip
                label={userProfile.year}
                icon="calendar-outline"
                style={styles.chip}
              />
              <Chip
                label={userProfile.grade}
                icon="person-outline"
                style={styles.chip}
              />
            </View>

            {/* Location */}
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={hp(1.6)} color="#8E8E93" />
              <Text style={styles.locationText}>{userProfile.location}</Text>
            </View>

            {/* Social Links */}
            {userProfile.socialLinks && (
              <AppCard style={styles.socialCard}>
                <Text style={styles.socialTitle}>Connect</Text>
                <View style={styles.socialLinksRow}>
                  {userProfile.socialLinks.instagram && (
                    <TouchableOpacity
                      style={styles.socialLink}
                      activeOpacity={0.7}
                      onPress={() => {
                        // TODO: Open Instagram
                      }}
                    >
                      <Ionicons name="logo-instagram" size={hp(2.2)} color="#E4405F" />
                      <Text style={styles.socialLinkText}>Instagram</Text>
                    </TouchableOpacity>
                  )}
                  {userProfile.socialLinks.spotify && (
                    <TouchableOpacity
                      style={styles.socialLink}
                      activeOpacity={0.7}
                      onPress={() => {
                        // TODO: Open Spotify
                      }}
                    >
                      <Ionicons name="musical-notes" size={hp(2.2)} color="#1DB954" />
                      <Text style={styles.socialLinkText}>Spotify</Text>
                    </TouchableOpacity>
                  )}
                  {userProfile.socialLinks.appleMusic && (
                    <TouchableOpacity
                      style={styles.socialLink}
                      activeOpacity={0.7}
                      onPress={() => {
                        // TODO: Open Apple Music
                      }}
                    >
                      <Ionicons name="musical-note" size={hp(2.2)} color="#FA243C" />
                      <Text style={styles.socialLinkText}>Apple Music</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </AppCard>
            )}
          </View>
        </ScrollView>

        {/* Friends Modal */}
        <Modal
          visible={showFriendsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFriendsModal(false)}
        >
          <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Friends</Text>
              <TouchableOpacity
                onPress={() => setShowFriendsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={hp(2.5)} color="#000000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MOCK_FRIENDS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.friendItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    // TODO: Navigate to friend's profile
                    setShowFriendsModal(false)
                  }}
                >
                  <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Text style={styles.friendDetails}>
                      {item.major} • Class of {item.year}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={hp(2)} color="#8E8E93" />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.friendsList}
            />
          </SafeAreaView>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditModal(false)}
        >
          <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={hp(2.5)} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.editScrollView}
              contentContainerStyle={styles.editScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <AppCard style={styles.editCard}>
                <Text style={styles.editLabel}>Bio</Text>
                <TextInput
                  value={editBio}
                  onChangeText={setEditBio}
                  style={styles.editInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#8E8E93"
                />
              </AppCard>

              <AppCard style={styles.editCard}>
                <Text style={styles.editLabel}>Social Links</Text>
                <View style={styles.socialEditRow}>
                  <Ionicons name="logo-instagram" size={hp(2.2)} color="#E4405F" />
                  <TextInput
                    value={editSocialLinks?.instagram || ''}
                    onChangeText={(text) => setEditSocialLinks({ ...editSocialLinks, instagram: text })}
                    style={styles.socialInput}
                    placeholder="@username"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                <View style={styles.socialEditRow}>
                  <Ionicons name="musical-notes" size={hp(2.2)} color="#1DB954" />
                  <TextInput
                    value={editSocialLinks?.spotify || ''}
                    onChangeText={(text) => setEditSocialLinks({ ...editSocialLinks, spotify: text })}
                    style={styles.socialInput}
                    placeholder="Spotify username"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                <View style={styles.socialEditRow}>
                  <Ionicons name="musical-note" size={hp(2.2)} color="#FA243C" />
                  <TextInput
                    value={editSocialLinks?.appleMusic || ''}
                    onChangeText={(text) => setEditSocialLinks({ ...editSocialLinks, appleMusic: text })}
                    style={styles.socialInput}
                    placeholder="Apple Music username"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
              </AppCard>

              <PrimaryButton
                label="Save Changes"
                icon="checkmark"
                onPress={() => {
                  setUserProfile({
                    ...userProfile,
                    bio: editBio,
                    socialLinks: editSocialLinks,
                  })
                  setShowEditModal(false)
                }}
                style={styles.saveButton}
              />
            </ScrollView>
          </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(10),
  },
  coverSection: {
    width: '100%',
    height: hp(40),
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  cardsContainer: {
    paddingHorizontal: wp(4),
    marginTop: hp(-2),
  },
  profileCard: {
    marginBottom: hp(2),
  },
  profileName: {
    fontSize: hp(2.6),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.3),
    letterSpacing: -0.3,
  },
  profileHandle: {
    fontSize: hp(1.5),
    color: '#8E8E93',
    fontWeight: '400',
  },
  groupJamCard: {
    marginBottom: hp(2),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  groupJamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  groupJamLabel: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  groupJamValue: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.bondedPurple,
  },
  groupJamBarContainer: {
    height: hp(0.6),
    backgroundColor: '#E5E5EA',
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: hp(0.8),
  },
  groupJamBarFill: {
    height: '100%',
    borderRadius: 9999,
  },
  groupJamDescription: {
    fontSize: hp(1.3),
    color: '#8E8E93',
    fontWeight: '400',
  },
  bioCard: {
    marginBottom: hp(2),
  },
  bioText: {
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    lineHeight: hp(2.2),
    fontWeight: '400',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginBottom: hp(2),
  },
  actionButton: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(2),
  },
  chip: {
    backgroundColor: '#F3E8FF',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1),
  },
  locationText: {
    fontSize: hp(1.4),
    color: '#8E8E93',
    fontWeight: '400',
  },
  socialCard: {
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  socialTitle: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(1.5),
  },
  socialLinksRow: {
    flexDirection: 'row',
    gap: wp(3),
    flexWrap: 'wrap',
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    backgroundColor: '#F2F2F7',
    borderRadius: hp(1),
    gap: wp(2),
    minWidth: wp(30),
  },
  socialLinkText: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  friendsButton: {
    marginBottom: hp(2),
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: hp(2.4),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    padding: hp(0.5),
  },
  friendsList: {
    paddingVertical: hp(1),
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    gap: wp(3),
  },
  friendAvatar: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.2),
  },
  friendDetails: {
    fontSize: hp(1.4),
    color: '#8E8E93',
    fontWeight: '400',
  },
  editScrollView: {
    flex: 1,
  },
  editScrollContent: {
    padding: wp(4),
    paddingBottom: hp(4),
  },
  editCard: {
    marginBottom: hp(2),
  },
  editLabel: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(1),
  },
  editInput: {
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    lineHeight: hp(2.2),
    minHeight: hp(10),
    textAlignVertical: 'top',
  },
  socialEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(1.5),
  },
  socialInput: {
    flex: 1,
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  saveButton: {
    marginTop: hp(2),
  },
})
