import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  Modal,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
// import * as Location from 'expo-location' // Uncomment when expo-location is installed
import { hp, wp } from '../../helpers/common'
import theme from '../../constants/theme'
import { Calendar as CalendarIcon, MapPin, ChevronRight, Users, Lock } from '../../components/Icons'

export default function CreateEvent() {
  const router = useRouter()

  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState(new Date())
  const [eventTime, setEventTime] = useState(new Date())
  const [endTime, setEndTime] = useState(new Date())
  const [location, setLocation] = useState('')
  const [eventImage, setEventImage] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [showVisibilityModal, setShowVisibilityModal] = useState(false)
  const [showInviteesModal, setShowInviteesModal] = useState(false)
  const [selectedVisibility, setSelectedVisibility] = useState('public')
  const [selectedInvitees, setSelectedInvitees] = useState([])
  const [locationCoords, setLocationCoords] = useState(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]) {
        setEventImage(result.assets[0].uri)
      }
    } catch (error) {
      console.log('Image picker error:', error)
    }
  }

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
    })
  }

  const handleLocationSelect = async () => {
    // For now, just open the location picker modal
    // In production, you'd request location permissions and use a map picker
    setShowLocationPicker(true)
  }

  const handleNext = () => {
    // Navigate to next step or create event
    router.back()
  }

  // Mock connections data
  const mockConnections = [
    { id: 'user-1', name: 'Danielle Williams', avatar: 'DW', type: 'friend' },
    { id: 'user-2', name: 'John Smith', avatar: 'JS', type: 'friend' },
    { id: 'user-3', name: 'Sarah Johnson', avatar: 'SJ', type: 'friend' },
    { id: 'org-1', name: 'Music Society', avatar: 'MS', type: 'org' },
    { id: 'org-2', name: 'CS Club', avatar: 'CS', type: 'org' },
  ]

  const toggleInvitee = (id) => {
    setSelectedInvitees((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <TouchableOpacity
            onPress={handleNext}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Text style={styles.createText}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Add Event Image */}
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {eventImage ? (
              <Image source={{ uri: eventImage }} style={styles.eventImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.cameraIcon}>
                  <Text style={styles.cameraIconText}>📷</Text>
                </View>
                <Text style={styles.imagePlaceholderText}>Add event image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Event Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event name</Text>
            <TextInput
              style={styles.input}
              value={eventName}
              onChangeText={setEventName}
              placeholder="Enter event name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Event Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event date</Text>
            <TouchableOpacity
              style={styles.dateTimeField}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateTimeContent}>
                <CalendarIcon size={hp(2)} color={theme.colors.textSecondary} />
                <Text style={styles.dateTimeText}>{formatDate(eventDate)}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={styles.dateTimeField}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dateTimeContent}>
                  <Text style={styles.timeIcon}>🕐</Text>
                  <Text style={styles.dateTimeText}>{formatTime(eventTime)}</Text>
                </View>
              </TouchableOpacity>
              <ChevronRight size={hp(2)} color={theme.colors.textSecondary} />
              <TouchableOpacity
                style={styles.dateTimeField}
                onPress={() => setShowEndTimePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dateTimeContent}>
                  <Text style={styles.timeIcon}>🕐</Text>
                  <Text style={styles.dateTimeText}>{formatTime(endTime)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TouchableOpacity
              style={styles.inputWithIcon}
              onPress={handleLocationSelect}
              activeOpacity={0.7}
            >
              <MapPin size={hp(2)} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Select location"
                placeholderTextColor={theme.colors.textSecondary}
                editable={false}
              />
            </TouchableOpacity>
            {location && locationCoords && (
              <TouchableOpacity
                style={styles.mapPreview}
                onPress={() => setShowLocationPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.mapPreviewText}>📍 {location}</Text>
                <Text style={styles.mapPreviewSubtext}>Tap to view map preview</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Optional - Organization */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Optional</Text>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Text style={styles.selectFieldText}>Select organization</Text>
              <ChevronRight size={hp(2)} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Visibility & Access */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Visibility & Access</Text>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => setShowVisibilityModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.selectFieldLeft}>
                <Lock size={hp(2)} color={theme.colors.textSecondary} />
                <Text style={styles.selectFieldText}>
                  {selectedVisibility === 'public' ? 'Public Event' : 
                   selectedVisibility === 'org_only' ? 'Org Members Only' : 
                   'Invite Only'}
                </Text>
              </View>
              <ChevronRight size={hp(2)} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Ticketing */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ticketing</Text>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Text style={styles.selectFieldText}>Free Event</Text>
              <ChevronRight size={hp(2)} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Invite Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>INVITEES</Text>
            <TouchableOpacity
              style={styles.inviteField}
              onPress={() => setShowInviteesModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.inviteAvatars}>
                {selectedInvitees.length === 0 ? (
                  <Text style={styles.inviteText}>Invite people or orgs</Text>
                ) : (
                  <>
                    {selectedInvitees.slice(0, 3).map((id) => {
                      const invitee = mockConnections.find((c) => c.id === id)
                      return invitee ? (
                        <View key={id} style={styles.avatar}>
                          <Text style={styles.avatarText}>{invitee.avatar}</Text>
                        </View>
                      ) : null
                    })}
                    {selectedInvitees.length > 3 && (
                      <Text style={styles.inviteText}>+{selectedInvitees.length - 3}</Text>
                    )}
                    {selectedInvitees.length <= 3 && (
                      <Text style={styles.inviteText}>
                        {selectedInvitees.length === 1 ? '1 person' : `${selectedInvitees.length} people`}
                      </Text>
                    )}
                  </>
                )}
              </View>
              <ChevronRight size={hp(2)} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Next Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        {/* Date/Time Pickers */}
        {Platform.OS === 'android' && (
          <>
            {showDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false)
                  if (selectedDate) {
                    setEventDate(selectedDate)
                  }
                }}
                minimumDate={new Date()}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={eventTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false)
                  if (selectedTime) {
                    setEventTime(selectedTime)
                  }
                }}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowEndTimePicker(false)
                  if (selectedTime) {
                    setEndTime(selectedTime)
                  }
                }}
              />
            )}
          </>
        )}

        {Platform.OS === 'ios' && (
          <>
            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.pickerModal}>
                <View style={styles.pickerModalContent}>
                  <View style={styles.pickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={styles.pickerModalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerModalTitle}>Select Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={[styles.pickerModalButtonText, styles.pickerModalButtonDone]}>Done</Text>
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

            <Modal
              visible={showTimePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowTimePicker(false)}
            >
              <View style={styles.pickerModal}>
                <View style={styles.pickerModalContent}>
                  <View style={styles.pickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={styles.pickerModalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerModalTitle}>Start Time</Text>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={[styles.pickerModalButtonText, styles.pickerModalButtonDone]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={eventTime}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        setEventTime(selectedTime)
                      }
                    }}
                  />
                </View>
              </View>
            </Modal>

            <Modal
              visible={showEndTimePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowEndTimePicker(false)}
            >
              <View style={styles.pickerModal}>
                <View style={styles.pickerModalContent}>
                  <View style={styles.pickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowEndTimePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={styles.pickerModalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerModalTitle}>End Time</Text>
                    <TouchableOpacity
                      onPress={() => setShowEndTimePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={[styles.pickerModalButtonText, styles.pickerModalButtonDone]}>Done</Text>
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
          </>
        )}

        {/* Visibility & Access Modal */}
        <Modal
          visible={showVisibilityModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVisibilityModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Visibility & Access</Text>
                <TouchableOpacity
                  onPress={() => setShowVisibilityModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                {['public', 'org_only', 'invite_only'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionRow,
                      selectedVisibility === option && styles.optionRowSelected,
                    ]}
                    onPress={() => {
                      setSelectedVisibility(option)
                      setShowVisibilityModal(false)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedVisibility === option && styles.optionTextSelected,
                      ]}
                    >
                      {option === 'public' ? 'Public Event' : 
                       option === 'org_only' ? 'Org Members Only' : 
                       'Invite Only'}
                    </Text>
                    {selectedVisibility === option && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
                <Text style={styles.modalTitle}>Invite People & Orgs</Text>
                <TouchableOpacity
                  onPress={() => setShowInviteesModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
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
                      <View style={styles.inviteeInfo}>
                        <Text style={styles.inviteeName}>{connection.name}</Text>
                        <Text style={styles.inviteeType}>
                          {connection.type === 'org' ? 'Organization' : 'Friend'}
                        </Text>
                      </View>
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

        {/* Location Picker Modal */}
        <Modal
          visible={showLocationPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLocationPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <TouchableOpacity
                  onPress={() => setShowLocationPicker(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Enter location name or address"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={location}
                  onChangeText={(text) => {
                    setLocation(text)
                    if (text.length > 3) {
                      // In production, you'd geocode this and show map preview
                      setLocationCoords({ lat: 41.4806, lng: -71.5234 }) // URI coordinates
                    }
                  }}
                />
                {location && locationCoords && (
                  <View style={styles.mapPreviewContainer}>
                    <View style={styles.mapPreviewPlaceholder}>
                      <MapPin size={hp(4)} color={theme.colors.textSecondary} />
                      <Text style={styles.mapPreviewPlaceholderText}>
                        Map preview would appear here
                      </Text>
                      <Text style={styles.mapPreviewPlaceholderSubtext}>
                        (Eventbrite-style map integration)
                      </Text>
                    </View>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.locationConfirmButton,
                    !location.trim() && styles.locationConfirmButtonDisabled,
                  ]}
                  onPress={() => {
                    if (location.trim()) {
                      if (location.length > 3) {
                        setLocationCoords({ lat: 41.4806, lng: -71.5234 }) // URI coordinates
                      }
                      setShowLocationPicker(false)
                    }
                  }}
                  activeOpacity={0.8}
                  disabled={!location.trim()}
                >
                  <Text style={styles.locationConfirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  headerButton: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
  },
  cancelText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '400',
    color: theme.colors.bondedPurple,
  },
  headerTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
  },
  createText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '400',
    color: theme.colors.bondedPurple,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(10),
  },
  imagePicker: {
    width: '100%',
    height: hp(20),
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: hp(3),
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.offWhite,
    borderWidth: 2,
    borderColor: theme.colors.offWhite,
    borderStyle: 'dashed',
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    marginBottom: hp(1),
  },
  cameraIconText: {
    fontSize: hp(4),
  },
  imagePlaceholderText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
    fontWeight: '500',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  inputGroup: {
    marginBottom: hp(2.5),
  },
  label: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: hp(1),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
    gap: wp(2),
  },
  dateTimeField: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
    marginBottom: hp(1),
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  dateTimeText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  timeIcon: {
    fontSize: hp(2),
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  selectFieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  selectFieldText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
  },
  lockIcon: {
    fontSize: hp(2),
  },
  inviteField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  inviteAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  avatar: {
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: hp(1.75),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  inviteText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.offWhite,
  },
  nextButton: {
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.xl,
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  locationConfirmButton: {
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.xl,
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
  },
  locationConfirmButtonDisabled: {
    opacity: 0.5,
  },
  locationConfirmButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  mapPreview: {
    marginTop: hp(1),
    padding: wp(4),
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  mapPreviewText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: hp(0.5),
  },
  mapPreviewSubtext: {
    fontSize: hp(1.3),
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
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md,
    marginBottom: hp(1),
    backgroundColor: theme.colors.white,
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
    color: theme.colors.charcoal,
  },
  optionTextSelected: {
    color: theme.colors.bondedPurple,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: hp(2),
    color: theme.colors.bondedPurple,
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
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.bondedPurple,
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
  inviteeInfo: {
    flex: 1,
  },
  inviteeName: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: hp(0.2),
  },
  inviteeType: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: theme.colors.white,
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
    color: theme.colors.charcoal,
  },
  pickerModalButton: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
  },
  pickerModalButtonText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  pickerModalButtonDone: {
    color: theme.colors.bondedPurple,
    fontWeight: '600',
  },
  locationInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
    marginBottom: hp(2),
  },
  mapPreviewContainer: {
    marginBottom: hp(2),
  },
  mapPreviewPlaceholder: {
    height: hp(20),
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
    borderStyle: 'dashed',
  },
  mapPreviewPlaceholderText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginTop: hp(1),
  },
  mapPreviewPlaceholderSubtext: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginTop: hp(0.5),
    fontStyle: 'italic',
  },
})
