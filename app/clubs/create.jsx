import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppTopBar from '../../components/AppTopBar'
import BottomNav from '../../components/BottomNav'
import Picker from '../../components/Picker'
import { useClubsContext } from '../../contexts/ClubsContext'
import { hp, wp } from '../../helpers/common'
import { geocodeLocation, getStaticMapUrlWithCoords } from '../../helpers/mapUtils'
import { useAppTheme } from '../theme'

const CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts' },
  { value: 'service', label: 'Service' },
  { value: 'business', label: 'Business' },
  { value: 'social', label: 'Social' },
]

export default function CreateOrg() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const { createClub } = useClubsContext()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('academic')
  const [isPublic, setIsPublic] = useState(true)
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [coverImage, setCoverImage] = useState(null)
  const [avatar, setAvatar] = useState(null)
  
  // Meeting times and location
  const [meetingTimes, setMeetingTimes] = useState([])
  const [meetingLocation, setMeetingLocation] = useState('')
  const [locationCoords, setLocationCoords] = useState(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [mapPreviewUrl, setMapPreviewUrl] = useState(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isMeetingPublic, setIsMeetingPublic] = useState(true)
  
  // Meeting time picker states
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [editingMeetingIndex, setEditingMeetingIndex] = useState(null)
  const [tempMeetingDay, setTempMeetingDay] = useState('')
  const [tempMeetingTime, setTempMeetingTime] = useState(new Date())
  
  const DAYS_OF_WEEK = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ]

  const pickImage = async (type) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant photo library access')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]) {
        if (type === 'cover') {
          setCoverImage(result.assets[0].uri)
        } else {
          setAvatar(result.assets[0].uri)
        }
      }
    } catch (error) {
      console.log('Image picker error:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const handleLocationSelect = () => {
    setShowLocationPicker(true)
  }

  const handleLocationChange = async (text) => {
    setMeetingLocation(text)
    
    // Geocode location when user types (debounced)
    if (text.length > 3) {
      setIsGeocoding(true)
      try {
        const coords = await geocodeLocation(text)
        if (coords) {
          setLocationCoords({ lat: coords.lat, lng: coords.lng })
          // Generate map preview using coordinates for better accuracy
          const mapUrl = getStaticMapUrlWithCoords(coords.lat, coords.lng, wp(90), hp(20))
          setMapPreviewUrl(mapUrl)
        } else {
          setLocationCoords(null)
          setMapPreviewUrl(null)
        }
      } catch (error) {
        console.error('Geocoding error:', error)
        setLocationCoords(null)
        setMapPreviewUrl(null)
      } finally {
        setIsGeocoding(false)
      }
    } else {
      setLocationCoords(null)
      setMapPreviewUrl(null)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const addMeetingTime = () => {
    if (!tempMeetingDay || !tempMeetingTime) {
      Alert.alert('Error', 'Please select both day and time')
      return
    }
    
    if (editingMeetingIndex !== null) {
      const updated = [...meetingTimes]
      updated[editingMeetingIndex] = {
        day: tempMeetingDay,
        time: tempMeetingTime.toISOString(),
      }
      setMeetingTimes(updated)
      setEditingMeetingIndex(null)
    } else {
      setMeetingTimes([...meetingTimes, {
        day: tempMeetingDay,
        time: tempMeetingTime.toISOString(),
      }])
    }
    
    setTempMeetingDay('')
    setTempMeetingTime(new Date())
    setShowDayPicker(false)
    setShowTimePicker(false)
  }

  const removeMeetingTime = (index: number) => {
    setMeetingTimes(meetingTimes.filter((_, i) => i !== index))
  }

  const editMeetingTime = (index: number) => {
    const meeting = meetingTimes[index]
    setTempMeetingDay(meeting.day)
    setTempMeetingTime(new Date(meeting.time))
    setEditingMeetingIndex(index)
    setShowDayPicker(true)
  }

  const handleCreate = () => {
    // TODO: Upload org avatar/cover to bonded-media and insert public.media rows.
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an organization name')
      return
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description')
      return
    }

    const clubData = {
      name: name.trim(),
      description: description.trim(),
      category,
      isPublic,
      requiresApproval,
      coverImage: coverImage || null,
      avatar: avatar || null,
    }

    const clubId = createClub(clubData)
    Alert.alert('Success', 'Organization created!', [
      {
        text: 'OK',
        onPress: () => router.push(`/clubs/${clubId}`),
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppTopBar
          schoolName="Create Organization"
          onPressProfile={() => router.back()}
          onPressSchool={() => {}}
          onPressNotifications={() => router.push('/notifications')}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Start an Organization</Text>

          {/* Basic Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Information</Text>
            
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Computer Science Club"
                placeholderTextColor={theme.colors.textSecondary + '60'}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell people about your organization..."
                placeholderTextColor={theme.colors.textSecondary + '60'}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <Picker
                options={CATEGORIES}
                value={category}
                onValueChange={setCategory}
                placeholder="Select category"
              />
            </View>
          </View>

          {/* Media Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Media</Text>
            
            {/* Avatar */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Avatar</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => pickImage('avatar')}
                activeOpacity={0.7}
              >
                {avatar ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: avatar }} style={styles.avatarPreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={(e) => {
                        e.stopPropagation()
                        setAvatar(null)
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={hp(2.5)} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePickerContent}>
                    <View style={styles.imagePickerIconContainer}>
                      <Ionicons name="camera-outline" size={hp(2.5)} color={theme.colors.textSecondary} />
                    </View>
                    <Text style={styles.imagePickerText}>Add Avatar</Text>
                    <Text style={styles.imagePickerSubtext}>Square image recommended</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Cover Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cover Image (optional)</Text>
              {coverImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: coverImage }} style={styles.coverImagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setCoverImage(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={hp(2.5)} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={() => pickImage('cover')}
                  activeOpacity={0.7}
                >
                  <View style={styles.imagePickerContent}>
                    <View style={styles.imagePickerIconContainer}>
                      <Ionicons name="image-outline" size={hp(2.5)} color={theme.colors.textSecondary} />
                    </View>
                    <Text style={styles.imagePickerText}>Add Cover Image</Text>
                    <Text style={styles.imagePickerSubtext}>16:9 aspect ratio recommended</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Settings Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Settings</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchText}>Public Organization</Text>
                <Text style={styles.switchSubtext}>
                  Anyone can see and join
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{
                  false: theme.colors.backgroundSecondary,
                  true: theme.colors.accent + '50',
                }}
                thumbColor={isPublic ? theme.colors.accent : theme.colors.textSecondary}
              />
            </View>

            {!isPublic && (
              <View style={[styles.switchRow, styles.switchRowLast]}>
                <View style={styles.switchLabel}>
                  <Text style={styles.switchText}>Require Approval</Text>
                  <Text style={styles.switchSubtext}>
                    Approve join requests manually
                  </Text>
                </View>
                <Switch
                  value={requiresApproval}
                  onValueChange={setRequiresApproval}
                  trackColor={{
                    false: theme.colors.backgroundSecondary,
                    true: theme.colors.accent + '50',
                  }}
                  thumbColor={
                    requiresApproval ? theme.colors.accent : theme.colors.textSecondary
                  }
                />
              </View>
            )}
            {isPublic && (
              <View style={styles.switchRowLast} />
            )}
          </View>

          {/* Meeting Times & Location Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Meeting Information</Text>
            
            {/* Meeting Times */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meeting Times</Text>
              {meetingTimes.length > 0 && (
                <View style={styles.meetingTimesList}>
                  {meetingTimes.map((meeting, index) => (
                    <View key={index} style={styles.meetingTimeItem}>
                      <View style={styles.meetingTimeContent}>
                        <Ionicons name="time-outline" size={hp(1.8)} color={theme.colors.textPrimary} />
                        <Text style={styles.meetingTimeText}>
                          {meeting.day} at {formatTime(new Date(meeting.time))}
                        </Text>
                      </View>
                      <View style={styles.meetingTimeActions}>
                        <TouchableOpacity
                          onPress={() => editMeetingTime(index)}
                          style={styles.meetingTimeActionButton}
                        >
                          <Ionicons name="pencil-outline" size={hp(1.8)} color={theme.colors.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeMeetingTime(index)}
                          style={styles.meetingTimeActionButton}
                        >
                          <Ionicons name="trash-outline" size={hp(1.8)} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={styles.addMeetingTimeButton}
                onPress={() => setShowDayPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={hp(2)} color={theme.colors.accent} />
                <Text style={styles.addMeetingTimeText}>Add Meeting Time</Text>
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meeting Location</Text>
              <TouchableOpacity
                style={styles.inputWithIcon}
                onPress={handleLocationSelect}
                activeOpacity={0.7}
              >
                <MapPin size={hp(2)} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={meetingLocation}
                  placeholder="Select meeting location"
                  placeholderTextColor={theme.colors.textSecondary + '60'}
                  editable={false}
                />
              </TouchableOpacity>
              {meetingLocation && mapPreviewUrl && (
                <TouchableOpacity
                  style={styles.mapPreviewContainer}
                  onPress={() => setShowLocationPicker(true)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: mapPreviewUrl }} 
                    style={styles.mapPreviewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.mapPreviewOverlay}>
                    <Ionicons name="location" size={hp(1.8)} color={theme.colors.white} />
                    <Text style={styles.mapPreviewText} numberOfLines={1}>{meetingLocation}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Meeting Visibility */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchText}>Public Meetings</Text>
                <Text style={styles.switchSubtext}>
                  Anyone can see meeting times and location
                </Text>
              </View>
              <Switch
                value={isMeetingPublic}
                onValueChange={setIsMeetingPublic}
                trackColor={{
                  false: theme.colors.backgroundSecondary,
                  true: theme.colors.accent + '50',
                }}
                thumbColor={isMeetingPublic ? theme.colors.accent : theme.colors.textSecondary}
              />
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Create Organization</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Day Picker Modal */}
        <Modal
          visible={showDayPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDayPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Day</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowDayPicker(false)
                    setTempMeetingDay('')
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayOption,
                      tempMeetingDay === day && styles.dayOptionSelected,
                    ]}
                    onPress={() => {
                      setTempMeetingDay(day)
                      setShowDayPicker(false)
                      setShowTimePicker(true)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayOptionText,
                        tempMeetingDay === day && styles.dayOptionTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                    {tempMeetingDay === day && (
                      <Ionicons name="checkmark" size={hp(2)} color={theme.colors.accent} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Time Picker Modal */}
        {showTimePicker && (
          <Modal
            visible={showTimePicker}
            transparent
            animationType="slide"
            onRequestClose={() => {
              setShowTimePicker(false)
              setTempMeetingDay('')
              setEditingMeetingIndex(null)
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Time</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowTimePicker(false)
                      setTempMeetingDay('')
                      setEditingMeetingIndex(null)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  {Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={tempMeetingTime}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedTime) => {
                        if (selectedTime) {
                          setTempMeetingTime(selectedTime)
                        }
                      }}
                    />
                  ) : (
                    <DateTimePicker
                      value={tempMeetingTime}
                      mode="time"
                      display="default"
                      onChange={(event, selectedTime) => {
                        setShowTimePicker(false)
                        if (selectedTime) {
                          setTempMeetingTime(selectedTime)
                          addMeetingTime()
                        }
                      }}
                    />
                  )}
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => {
                        addMeetingTime()
                        setShowTimePicker(false)
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Location Picker Modal */}
        <Modal
          visible={showLocationPicker}
          transparent
          animationType="slide"
          onRequestClose={() => {
            Keyboard.dismiss()
            setShowLocationPicker(false)
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => {
                Keyboard.dismiss()
                setShowLocationPicker(false)
              }}
            >
              <TouchableOpacity
                style={styles.modalContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Location</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss()
                      setShowLocationPicker(false)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.modalBody}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <TextInput
                    style={styles.locationInput}
                    placeholder="Enter location name or address"
                    placeholderTextColor={theme.colors.textSecondary + '60'}
                    value={meetingLocation}
                    onChangeText={handleLocationChange}
                    autoFocus={true}
                    returnKeyType="search"
                  />
                  {isGeocoding && (
                    <View style={styles.geocodingIndicator}>
                      <ActivityIndicator size="small" color={theme.colors.bondedPurple} />
                      <Text style={styles.geocodingText}>Finding location...</Text>
                    </View>
                  )}
                  {meetingLocation && mapPreviewUrl && !isGeocoding && (
                    <View style={styles.mapPreviewContainer}>
                      <Image 
                        source={{ uri: mapPreviewUrl }} 
                        style={styles.mapPreviewImage}
                        resizeMode="cover"
                      />
                      {locationCoords && (
                        <View style={styles.mapPreviewOverlay}>
                          <Ionicons name="location" size={hp(2)} color={theme.colors.white} />
                          <Text style={styles.mapPreviewText} numberOfLines={2}>{meetingLocation}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {meetingLocation && !mapPreviewUrl && !isGeocoding && meetingLocation.length > 3 && (
                    <View style={styles.locationError}>
                      <Text style={styles.locationErrorText}>
                        Could not find this location. Please try a different address.
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.locationConfirmButton,
                      (!meetingLocation.trim() || isGeocoding) && styles.locationConfirmButtonDisabled,
                    ]}
                    onPress={() => {
                      if (meetingLocation.trim() && !isGeocoding) {
                        Keyboard.dismiss()
                        setShowLocationPicker(false)
                      }
                    }}
                    activeOpacity={0.8}
                    disabled={!meetingLocation.trim() || isGeocoding}
                  >
                    <Text style={styles.locationConfirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </ScrollView>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

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
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: hp(10),
    gap: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: hp(12),
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  imagePickerButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  imagePickerContent: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  imagePickerIconContainer: {
    width: hp(6),
    height: hp(6),
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  imagePickerText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  imagePickerSubtext: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: theme.ui.metaOpacity,
  },
  imagePreviewWrapper: {
    position: 'relative',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  avatarPreview: {
    width: hp(12),
    height: hp(12),
    borderRadius: theme.radius.full,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  coverImagePreview: {
    width: '100%',
    height: hp(20),
    borderRadius: theme.radius.md,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    padding: theme.spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  switchRowLast: {
    borderBottomWidth: 0,
  },
  switchLabel: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  switchText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  switchSubtext: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: theme.ui.metaOpacity,
  },
  createButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    ...theme.shadows.md,
  },
  createButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  meetingTimesList: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  meetingTimeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  meetingTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  meetingTimeText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
  },
  meetingTimeActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  meetingTimeActionButton: {
    padding: theme.spacing.xs,
  },
  addMeetingTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  addMeetingTimeText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
    padding: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  modalCloseText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.accent,
    fontWeight: theme.typography.weights.semibold,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  dayOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  dayOptionSelected: {
    backgroundColor: theme.colors.accent + '20',
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  dayOptionText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
  },
  dayOptionTextSelected: {
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.accent,
  },
  confirmButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  confirmButtonText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  locationInput: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  mapPreviewContainer: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundSecondary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  mapPreviewImage: {
    width: '100%',
    height: hp(15),
    backgroundColor: theme.colors.backgroundSecondary,
  },
  mapPreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  mapPreviewText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
    flex: 1,
  },
  geocodingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  geocodingText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  locationError: {
    marginTop: theme.spacing.sm,
    padding: wp(3),
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  locationErrorText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.error,
  },
  locationConfirmButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  locationConfirmButtonDisabled: {
    backgroundColor: theme.colors.backgroundSecondary,
    opacity: 0.5,
  },
  locationConfirmButtonText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
})
