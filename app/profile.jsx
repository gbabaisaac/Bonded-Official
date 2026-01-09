import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppCard from '../components/AppCard'
import AppHeader from '../components/AppHeader'
import Chip from '../components/Chip'
import PrimaryButton from '../components/PrimaryButton'
import { hp, wp } from '../helpers/common'
import { uploadImageToBondedMedia, createSignedUrlForPath } from '../helpers/mediaStorage'
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile'
import { useFriends } from '../hooks/useFriends'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import { useAuthStore } from '../stores/authStore'
import { useAppTheme } from './theme'

export default function Profile() {
  const router = useRouter()
  const theme = useAppTheme()
  const { user } = useAuthStore()
  
  // Fetch current user's profile from Supabase
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useCurrentUserProfile()
  const { data: friends = [], isLoading: friendsLoading } = useFriends()
  const updateProfile = useUpdateProfile()
  
  // Debug logging
  React.useEffect(() => {
    console.log('Profile page state:', {
      user: user?.id,
      profileLoading,
      hasProfile: !!userProfile,
      profileError: profileError?.message,
    })
  }, [user, profileLoading, userProfile, profileError])
  const [showFriendsModal, setShowFriendsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editQuote, setEditQuote] = useState('')
  const [newAvatarUri, setNewAvatarUri] = useState(null)
  const [newBannerUri, setNewBannerUri] = useState(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  
  // Update edit fields when userProfile loads
  React.useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.full_name || userProfile.name || '')
      setEditQuote(userProfile.yearbook_quote || userProfile.yearbookQuote || '')
      // Initialize gallery photos from profile
      const photos = Array.isArray(userProfile.photos) ? userProfile.photos : []
      setGalleryPhotos(photos.map((url, index) => ({ url, id: `existing-${index}` })))
    }
  }, [userProfile])

  // Handle avatar selection
  const handleSelectAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to update your avatar.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets?.[0]) {
      setNewAvatarUri(result.assets[0].uri)
    }
  }

  // Handle banner selection
  const handleSelectBanner = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to update your banner.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!result.canceled && result.assets?.[0]) {
      setNewBannerUri(result.assets[0].uri)
    }
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!userProfile?.id) return

    const updates = {}
    let avatarUrl = null
    let bannerUrl = null

    try {
      // Upload avatar if changed
      if (newAvatarUri) {
        setIsUploadingAvatar(true)
        const uploadResult = await uploadImageToBondedMedia({
          fileUri: newAvatarUri,
          mediaType: 'profile_avatar',
          ownerType: 'user',
          ownerId: user.id,
          userId: user.id,
          upsert: true,
        })
        avatarUrl = await createSignedUrlForPath(uploadResult.path)
        updates.avatar_url = avatarUrl
        setIsUploadingAvatar(false)
      }

      // Upload banner if changed
      if (newBannerUri) {
        setIsUploadingBanner(true)
        const uploadResult = await uploadImageToBondedMedia({
          fileUri: newBannerUri,
          mediaType: 'profile_banner',
          ownerType: 'user',
          ownerId: user.id,
          userId: user.id,
          upsert: true,
        })
        bannerUrl = await createSignedUrlForPath(uploadResult.path)
        updates.banner_url = bannerUrl
        setIsUploadingBanner(false)
      }

      // Update name if changed
      if (editName.trim() !== (userProfile.full_name || userProfile.name || '')) {
        updates.full_name = editName.trim()
      }

      // Update quote if changed
      if (editQuote.trim() !== (userProfile.yearbook_quote || userProfile.yearbookQuote || '')) {
        updates.yearbook_quote = editQuote.trim()
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile.mutateAsync(updates)
        setNewAvatarUri(null)
        setNewBannerUri(null)
        setShowEditModal(false)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      Alert.alert('Error', 'Failed to save profile changes. Please try again.')
      setIsUploadingAvatar(false)
      setIsUploadingBanner(false)
    }
  }

  // Add photos to gallery
  const handleAddPhotosToGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to add to your gallery.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset, index) => ({
        url: asset.uri,
        id: `new-${Date.now()}-${index}`,
        localUri: asset.uri,
        isNew: true,
      }))
      setGalleryPhotos([...galleryPhotos, ...newPhotos])
    }
  }

  // Remove photo from gallery
  const handleRemovePhoto = (photoId) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo from your gallery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setGalleryPhotos(galleryPhotos.filter(photo => photo.id !== photoId))
          },
        },
      ]
    )
  }

  // Set photo as yearbook photo (avatar)
  const handleSetAsYearbookPhoto = (photoUrl) => {
    Alert.alert(
      'Set Yearbook Photo',
      'Set this photo as your yearbook photo and profile avatar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: () => {
            setNewAvatarUri(photoUrl)
          },
        },
      ]
    )
  }

  // Upload gallery photos and save all changes
  const handleSaveAllChanges = async () => {
    if (!userProfile?.id) return

    const updates = {}

    try {
      // Upload new gallery photos
      const newPhotos = galleryPhotos.filter(photo => photo.isNew)
      if (newPhotos.length > 0) {
        setIsUploadingPhoto(true)
        for (const photo of newPhotos) {
          await uploadImageToBondedMedia({
            fileUri: photo.localUri,
            mediaType: 'profile_photo',
            ownerType: 'user',
            ownerId: user.id,
            userId: user.id,
          })
        }
        setIsUploadingPhoto(false)
      }

      // Continue with existing save logic
      await handleSaveProfile()
    } catch (error) {
      console.error('Error saving changes:', error)
      Alert.alert('Error', 'Failed to save changes. Please try again.')
      setIsUploadingPhoto(false)
    }
  }

  const styles = createStyles(theme)

  const profilePhotos = useMemo(() => {
    if (!userProfile) return []
    return Array.isArray(userProfile.photos) ? userProfile.photos : []
  }, [userProfile])

  React.useEffect(() => {
    setActivePhotoIndex(0)
  }, [profilePhotos.length])

  const carouselItemWidth = wp(86)
  const coverPhotoUrl = userProfile?.banner_url || profilePhotos[0] || null
  const avatarUrl = userProfile?.yearbookPhotoUrl || userProfile?.avatarUrl || profilePhotos[0] || null
  const canSaveName = editName.trim().length > 0 && editName.trim() !== (userProfile?.full_name || userProfile?.name || '')

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
            {coverPhotoUrl ? (
              <Image
                source={{ uri: coverPhotoUrl }}
                style={styles.coverImage}
              />
            ) : (
              <View style={[styles.coverImage, { backgroundColor: theme.colors.backgroundSecondary }]} />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
              style={styles.coverGradient}
            />
          </View>

          {/* Profile Cards Stack */}
          <View style={styles.cardsContainer}>
            {profileLoading ? (
              <AppCard style={styles.profileCard}>
                <ActivityIndicator size="large" color={theme.colors.bondedPurple} />
                <Text style={[styles.profileName, { marginTop: hp(2), textAlign: 'center' }]}>Loading profile...</Text>
              </AppCard>
            ) : profileError ? (
              <AppCard style={styles.profileCard}>
                <Text style={[styles.profileName, { color: theme.colors.error, textAlign: 'center' }]}>
                  Error loading profile
                </Text>
                <Text style={[styles.profileHandle, { textAlign: 'center', marginTop: hp(1), fontSize: hp(1.4) }]}>
                  {profileError.message || 'Unknown error'}
                </Text>
                <Text style={[styles.profileHandle, { textAlign: 'center', marginTop: hp(1), fontSize: hp(1.2), color: theme.colors.textSecondary }]}>
                  Code: {profileError.code || 'N/A'}
                </Text>
                <TouchableOpacity
                  style={{ marginTop: hp(2), padding: hp(1.5), backgroundColor: theme.colors.bondedPurple + '15', borderRadius: 8, alignItems: 'center' }}
                  onPress={() => router.push('/onboarding')}
                >
                  <Text style={{ color: theme.colors.bondedPurple, fontWeight: '600' }}>Complete Onboarding</Text>
                </TouchableOpacity>
              </AppCard>
            ) : userProfile ? (
              <>
                {/* Name and Username Card */}
                <AppCard style={styles.profileCard}>
                  <View style={styles.avatarRow}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>
                          {(userProfile.name || userProfile.full_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.avatarText}>
                      <Text style={styles.profileName}>
                        {userProfile.name || userProfile.full_name || userProfile.email?.split('@')[0] || 'User'}
                      </Text>
                      <Text style={styles.profileHandle}>
                        {userProfile.handle || (userProfile.username ? `@${userProfile.username}` : `@${userProfile.email?.split('@')[0] || 'user'}`)}
                      </Text>
                    </View>
                  </View>
                  {profilePhotos.length > 0 && (
                    <View style={styles.photoCarousel}>
                      <FlatList
                        data={profilePhotos}
                        keyExtractor={(item, index) => `${item}-${index}`}
                        horizontal
                        snapToInterval={carouselItemWidth + wp(2)}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: wp(1) }}
                        onMomentumScrollEnd={(event) => {
                          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (carouselItemWidth + wp(2)))
                          setActivePhotoIndex(nextIndex)
                        }}
                        renderItem={({ item }) => (
                          <Image source={{ uri: item }} style={[styles.carouselImage, { width: carouselItemWidth }]} />
                        )}
                      />
                      <View style={styles.carouselDots}>
                        {profilePhotos.map((_, index) => (
                          <View
                            key={`dot-${index}`}
                            style={[
                              styles.carouselDot,
                              index === activePhotoIndex && styles.carouselDotActive,
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                  {profilePhotos.length === 0 && (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="images-outline" size={hp(3)} color={theme.colors.textSecondary} />
                      <Text style={styles.photoPlaceholderText}>Add photos in onboarding to show your gallery</Text>
                    </View>
                  )}
                  {userProfile.yearbookQuote && (
                    <Text style={[styles.bioText, { marginTop: hp(1), fontStyle: 'italic' }]}>
                      "{userProfile.yearbookQuote}"
                    </Text>
                  )}
                  {!userProfile.onboarding_complete && (
                    <View style={{ marginTop: hp(1.5), padding: hp(1), backgroundColor: theme.colors.warning + '15', borderRadius: 8 }}>
                      <Text style={{ color: theme.colors.warning, fontSize: hp(1.3), textAlign: 'center', marginBottom: hp(0.5) }}>
                        ⚠️ Profile {userProfile.profile_completion_percentage || 0}% complete
                      </Text>
                      <Text style={{ color: theme.colors.textSecondary, fontSize: hp(1.2), textAlign: 'center', marginBottom: hp(0.8) }}>
                        Complete onboarding to unlock all features
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push('/onboarding')}
                        style={{ padding: hp(0.8), backgroundColor: theme.colors.bondedPurple + '20', borderRadius: 6, alignItems: 'center' }}
                      >
                        <Text style={{ color: theme.colors.bondedPurple, fontWeight: '600', fontSize: hp(1.2) }}>
                          Complete Onboarding ({userProfile.profile_completion_percentage || 0}%)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </AppCard>

                {/* Bio Card */}
                {userProfile.bio && (
                  <AppCard style={styles.bioCard}>
                    <Text style={styles.bioText}>{userProfile.bio}</Text>
                  </AppCard>
                )}
              </>
            ) : (
              <AppCard style={styles.profileCard}>
                <Text style={styles.profileName}>No profile found</Text>
              </AppCard>
            )}

            {/* Friends Button */}
            <PrimaryButton
              label={`Friends (${userProfile?.connectionsCount || 0})`}
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
            {userProfile && (
              <View style={styles.chipsRow}>
                {userProfile.major && (
                  <Chip
                    label={userProfile.major}
                    icon="school-outline"
                    style={styles.chip}
                  />
                )}
                {userProfile.grade && (
                  <Chip
                    label={userProfile.grade}
                    icon="calendar-outline"
                    style={styles.chip}
                  />
                )}
                {userProfile.graduationYear && (
                  <Chip
                    label={`Class of ${userProfile.graduationYear}`}
                    icon="school-outline"
                    style={styles.chip}
                  />
                )}
              </View>
            )}

            {/* Interests */}
            {userProfile && userProfile.interests && Array.isArray(userProfile.interests) && userProfile.interests.length > 0 && (
              <AppCard style={styles.bioCard}>
                <Text style={[styles.bioText, { fontWeight: '600', marginBottom: hp(0.5) }]}>Interests</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: wp(2) }}>
                  {userProfile.interests.map((interest, index) => (
                    <Chip
                      key={index}
                      label={interest}
                      icon="heart-outline"
                      style={[styles.chip, { marginBottom: hp(0.5) }]}
                    />
                  ))}
                </View>
              </AppCard>
            )}

            {/* Location */}
            {userProfile && userProfile.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={hp(1.6)} color="#8E8E93" />
                <Text style={styles.locationText}>{userProfile.location}</Text>
              </View>
            )}

            {/* Social Links */}
            {userProfile && userProfile.socialLinks && (
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
                <Ionicons name="close" size={hp(2.5)} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {friendsLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: hp(4) }}>
                <ActivityIndicator size="large" color={theme.colors.bondedPurple} />
                <Text style={{ marginTop: hp(2), color: theme.colors.textSecondary }}>Loading friends...</Text>
              </View>
            ) : friends.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: hp(4) }}>
                <Ionicons name="people-outline" size={hp(5)} color={theme.colors.textSecondary} />
                <Text style={{ marginTop: hp(2), color: theme.colors.textSecondary, textAlign: 'center' }}>
                  No friends yet
                </Text>
                <Text style={{ marginTop: hp(1), color: theme.colors.textSecondary, textAlign: 'center', fontSize: hp(1.4) }}>
                  Start connecting with people on campus!
                </Text>
              </View>
            ) : (
              <FlatList
                data={friends}
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
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
                    ) : (
                      <View style={[styles.friendAvatar, { backgroundColor: theme.colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="person" size={hp(2.5)} color={theme.colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{item.name}</Text>
                      <Text style={styles.friendDetails}>
                        {item.major ? `${item.major} • ` : ''}Class of {item.graduationYear || item.grade || 'N/A'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={hp(2)} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.friendsList}
              />
            )}
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
                <Ionicons name="close" size={hp(2.5)} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.editScrollView}
              contentContainerStyle={styles.editScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Avatar Selection */}
              <AppCard style={styles.editCard}>
                <Text style={styles.editLabel}>Profile Avatar</Text>
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: newAvatarUri || avatarUrl }}
                    style={styles.avatarPreview}
                  />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handleSelectAvatar}
                    disabled={isUploadingAvatar}
                  >
                    <Ionicons name="camera" size={hp(2)} color="#FFFFFF" />
                    <Text style={styles.changeImageText}>
                      {isUploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </AppCard>

              {/* Banner Selection */}
              <AppCard style={styles.editCard}>
                <Text style={styles.editLabel}>Banner Image</Text>
                <View style={styles.bannerPreviewContainer}>
                  <Image
                    source={{ uri: newBannerUri || coverPhotoUrl }}
                    style={styles.bannerPreview}
                  />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handleSelectBanner}
                    disabled={isUploadingBanner}
                  >
                    <Ionicons name="image" size={hp(2)} color="#FFFFFF" />
                    <Text style={styles.changeImageText}>
                      {isUploadingBanner ? 'Uploading...' : 'Change Banner'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </AppCard>

              {/* Name Input */}
              <AppCard style={styles.editCard}>
                <Text style={styles.editLabel}>Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={styles.editInput}
                  placeholder="Your name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <Text style={styles.editHelperText}>Usernames are locked for V1.</Text>
              </AppCard>

              {/* Yearbook Quote Input */}
              <AppCard style={styles.editCard}>
                <Text style={styles.editLabel}>Yearbook Quote</Text>
                <TextInput
                  value={editQuote}
                  onChangeText={setEditQuote}
                  style={[styles.editInput, { minHeight: hp(10) }]}
                  placeholder="Add your yearbook quote..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  maxLength={150}
                />
                <Text style={styles.editHelperText}>{editQuote.length}/150 characters</Text>
              </AppCard>

              {/* Photo Gallery Management */}
              <AppCard style={styles.editCard}>
                <View style={styles.galleryHeader}>
                  <Text style={styles.editLabel}>Photo Gallery</Text>
                  <TouchableOpacity
                    style={styles.addPhotosButton}
                    onPress={handleAddPhotosToGallery}
                    disabled={isUploadingPhoto}
                  >
                    <Ionicons name="add-circle" size={hp(2.2)} color={theme.colors.bondedPurple} />
                    <Text style={styles.addPhotosButtonText}>Add Photos</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.editHelperText}>
                  Manage your photo gallery. Tap a photo to set it as your yearbook photo.
                </Text>

                {galleryPhotos.length > 0 ? (
                  <View style={styles.photoGalleryGrid}>
                    {galleryPhotos.map((photo) => (
                      <View key={photo.id} style={styles.galleryPhotoItem}>
                        <Image source={{ uri: photo.url }} style={styles.galleryPhotoImage} />

                        {/* Badge if it's the current avatar */}
                        {photo.url === avatarUrl && (
                          <View style={styles.yearbookPhotoBadge}>
                            <Text style={styles.yearbookPhotoBadgeText}>Yearbook</Text>
                          </View>
                        )}

                        {/* Action buttons */}
                        <View style={styles.galleryPhotoActions}>
                          <TouchableOpacity
                            style={styles.galleryActionButton}
                            onPress={() => handleSetAsYearbookPhoto(photo.url)}
                          >
                            <Ionicons name="star" size={hp(1.8)} color="#FFFFFF" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.galleryActionButton, styles.removeActionButton]}
                            onPress={() => handleRemovePhoto(photo.id)}
                          >
                            <Ionicons name="trash" size={hp(1.8)} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyGallery}>
                    <Ionicons name="images-outline" size={hp(4)} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyGalleryText}>No photos in your gallery</Text>
                    <Text style={styles.emptyGallerySubtext}>Add photos to create your gallery</Text>
                  </View>
                )}
              </AppCard>

              <PrimaryButton
                label={
                  updateProfile.isPending || isUploadingAvatar || isUploadingBanner || isUploadingPhoto
                    ? 'Saving...'
                    : 'Save All Changes'
                }
                icon="checkmark"
                onPress={handleSaveAllChanges}
                style={styles.saveButton}
                disabled={updateProfile.isPending || isUploadingAvatar || isUploadingBanner || isUploadingPhoto}
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
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  groupJamCard: {
    marginBottom: hp(2),
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.border,
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
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.bondedPurple + '15',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1),
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(1.5),
  },
  avatarImage: {
    width: hp(8),
    height: hp(8),
    borderRadius: hp(4),
    backgroundColor: theme.colors.backgroundSecondary,
  },
  avatarFallback: {
    width: hp(8),
    height: hp(8),
    borderRadius: hp(4),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: hp(3),
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  avatarText: {
    flex: 1,
  },
  photoCarousel: {
    marginTop: hp(1),
  },
  carouselImage: {
    width: wp(86),
    height: hp(22),
    borderRadius: hp(1.6),
    marginRight: wp(2),
    backgroundColor: theme.colors.backgroundSecondary,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(1.4),
    marginTop: hp(1.2),
  },
  carouselDot: {
    width: wp(1.6),
    height: wp(1.6),
    borderRadius: wp(0.8),
    backgroundColor: theme.colors.border,
  },
  carouselDotActive: {
    backgroundColor: theme.colors.bondedPurple,
  },
  photoPlaceholder: {
    marginTop: hp(1),
    paddingVertical: hp(3),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: hp(1.6),
    backgroundColor: theme.colors.backgroundSecondary,
    gap: hp(1),
  },
  photoPlaceholderText: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  locationText: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.backgroundSecondary,
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
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    color: theme.colors.textSecondary,
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
    minHeight: hp(6),
    textAlignVertical: 'top',
  },
  editHelperText: {
    marginTop: hp(0.8),
    fontSize: hp(1.2),
    color: theme.colors.textSecondary,
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
  imagePreviewContainer: {
    alignItems: 'center',
    gap: hp(1.5),
  },
  avatarPreview: {
    width: hp(12),
    height: hp(12),
    borderRadius: hp(6),
    backgroundColor: theme.colors.backgroundSecondary,
  },
  bannerPreviewContainer: {
    alignItems: 'center',
    gap: hp(1.5),
  },
  bannerPreview: {
    width: '100%',
    height: hp(12),
    borderRadius: hp(1),
    backgroundColor: theme.colors.backgroundSecondary,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: hp(1),
    gap: wp(2),
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  addPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    backgroundColor: theme.colors.bondedPurple + '15',
    borderRadius: hp(0.8),
  },
  addPhotosButtonText: {
    color: theme.colors.bondedPurple,
    fontSize: hp(1.5),
    fontWeight: '600',
  },
  photoGalleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginTop: hp(1.5),
  },
  galleryPhotoItem: {
    width: (wp(92) - wp(8) - wp(4)) / 3, // Card width minus padding and gaps, divided by 3
    aspectRatio: 1,
    borderRadius: hp(1),
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundSecondary,
    position: 'relative',
  },
  galleryPhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  yearbookPhotoBadge: {
    position: 'absolute',
    top: wp(1.5),
    left: wp(1.5),
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.4),
    borderRadius: hp(0.5),
  },
  yearbookPhotoBadgeText: {
    color: '#FFFFFF',
    fontSize: hp(1.1),
    fontWeight: '700',
  },
  galleryPhotoActions: {
    position: 'absolute',
    bottom: wp(1.5),
    left: wp(1.5),
    right: wp(1.5),
    flexDirection: 'row',
    gap: wp(1.5),
  },
  galleryActionButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: hp(0.7),
    borderRadius: hp(0.6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeActionButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  emptyGallery: {
    paddingVertical: hp(4),
    alignItems: 'center',
    gap: hp(1),
  },
  emptyGalleryText: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  emptyGallerySubtext: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
  },
})
