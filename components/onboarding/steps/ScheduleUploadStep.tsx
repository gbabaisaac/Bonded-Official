/**
 * Schedule Upload Step
 * Allows user to upload schedule screenshot via camera or photo library
 * Also supports iCal import and manual entry
 */

import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import { ActionSheetIOS, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ONBOARDING_THEME } from '../../../constants/onboardingTheme'
import { hp, wp } from '../../../helpers/common'
import { parseICalFile, parseCSVFile } from '../../../services/scheduleParser'
import { extractTextFromImage } from '../../../utils/ocr/extractText'
import { parseSchedule, CourseDraft, ComponentDraft } from '../../../utils/schedule/parseSchedule'

interface ScheduleUploadStepProps {
  formData: any
  updateFormData: (step: string, data: any) => void
  onScroll: (event: any) => void
  onScheduleParsed: (parsedSchedule: any) => void
}

export default function ScheduleUploadStep({
  formData,
  updateFormData,
  onScroll,
  onScheduleParsed,
}: ScheduleUploadStepProps) {
  const styles = createStyles(ONBOARDING_THEME)
  const [selectedImage, setSelectedImage] = useState<string | null>(formData.scheduleImageUri || null)
  const [isProcessing, setIsProcessing] = useState(false)

  const requestPermissions = async () => {
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (libraryStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to upload your schedule.',
        [{ text: 'OK' }]
      )
      return false
    }
    return true
  }

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your camera to take a photo of your schedule.',
        [{ text: 'OK' }]
      )
      return false
    }
    return true
  }

  const handleImagePicker = async () => {
    if (Platform.OS === 'ios') {
      // iOS: Use ActionSheet
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Take Photo
            await handleTakePhoto()
          } else if (buttonIndex === 2) {
            // Choose from Library
            await handlePickImage()
          }
        }
      )
    } else {
      // Android: Show Alert with options
      Alert.alert(
        'Select Schedule Image',
        'Choose how you want to add your schedule',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => handleTakePhoto() },
          { text: 'Choose from Library', onPress: () => handlePickImage() },
        ]
      )
    }
  }

  const handleTakePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermissions()
      if (!hasPermission) return

      setIsProcessing(true)
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        setSelectedImage(imageUri)
        await processImage(imageUri)
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to take photo')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePickImage = async () => {
    try {
      const hasPermission = await requestPermissions()
      if (!hasPermission) return

      setIsProcessing(true)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        setSelectedImage(imageUri)
        await processImage(imageUri)
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick image')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle iCal/CSV file import
  const handleFileImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/calendar', 'text/csv', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets?.[0]) {
        return
      }

      const file = result.assets[0]
      setIsProcessing(true)

      // Read file content
      const content = await FileSystem.readAsStringAsync(file.uri)

      let courses: CourseDraft[] = []

      if (file.name?.endsWith('.ics') || file.mimeType?.includes('calendar')) {
        // Parse iCal file
        const parsedClasses = parseICalFile(content)
        courses = convertLegacyClassesToCourseDrafts(parsedClasses)
      } else if (file.name?.endsWith('.csv') || file.mimeType?.includes('csv')) {
        // Parse CSV file
        const parsedClasses = parseCSVFile(content)
        courses = convertLegacyClassesToCourseDrafts(parsedClasses)
      } else {
        Alert.alert('Unsupported Format', 'Please upload an iCal (.ics) or CSV file.')
        setIsProcessing(false)
        return
      }

      if (courses.length === 0) {
        Alert.alert('No Courses Found', 'Could not find any courses in the file. Please check the format and try again.')
        setIsProcessing(false)
        return
      }

      const parsedSchedule = { courses, rawText: content }
      updateFormData('class_schedule', { parsedSchedule })
      onScheduleParsed(parsedSchedule)
    } catch (error) {
      console.error('Error importing file:', error)
      Alert.alert('Import Error', error instanceof Error ? error.message : 'Failed to import file.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle manual entry - creates empty course for user to fill in
  const handleManualEntry = () => {
    const emptySchedule = {
      courses: [
        {
          courseCode: '',
          sectionId: '0001',
          components: [
            {
              type: 'Lecture' as const,
              days: [],
              startTime: '',
              endTime: '',
              location: '',
            },
          ],
        },
      ],
      rawText: '',
    }

    updateFormData('class_schedule', { parsedSchedule: emptySchedule })
    onScheduleParsed(emptySchedule)
  }

  // Convert legacy class format to CourseDraft format
  const convertLegacyClassesToCourseDrafts = (classes: any[]): CourseDraft[] => {
    return classes.map((c) => ({
      courseCode: c.class_code || '',
      sectionId: c.section || '0001',
      components: [
        {
          type: 'Lecture' as const,
          days: c.days_of_week || [],
          startTime: c.start_time || '',
          endTime: c.end_time || '',
          location: c.location || '',
        },
      ],
    }))
  }

  const processImage = async (imageUri: string) => {
    try {
      setIsProcessing(true)
      console.log('🔍 Starting OCR extraction from schedule image...')
      
      // Extract text using OCR
      const ocrResult = await extractTextFromImage(imageUri)

      if (!ocrResult.rawText || ocrResult.rawText.trim().length === 0) {
        console.warn('⚠️ OCR returned empty text - OCR may not be implemented')
        Alert.alert(
          'OCR Not Available',
          'Schedule photo import is not yet available. Please use one of these options:\n\n' +
          '• Upload an iCal (.ics) file\n' +
          '• Upload a CSV file\n' +
          '• Enter your schedule manually\n\n' +
          'OCR functionality will be added in a future update.',
          [{ text: 'OK' }]
        )
        setIsProcessing(false)
        return
      }

      console.log(`✅ OCR extracted ${ocrResult.rawText.length} characters`)
      console.log(`📊 Found ${ocrResult.blocks.length} text blocks`)

      // Parse schedule from OCR text
      const parsedSchedule = parseSchedule(ocrResult)

      if (!parsedSchedule.courses || parsedSchedule.courses.length === 0) {
        console.warn('⚠️ No courses found in parsed schedule')
        Alert.alert(
          'No Courses Found',
          'Could not find any courses in the schedule image. Please try:\n\n' +
          '• Using a clearer image\n' +
          '• Uploading an iCal or CSV file instead\n' +
          '• Entering your schedule manually',
          [{ text: 'OK' }]
        )
        setIsProcessing(false)
        return
      }

      console.log(`✅ Parsed ${parsedSchedule.courses.length} course(s) from schedule`)

      // Update form data
      updateFormData('class_schedule', {
        scheduleImageUri: imageUri,
        parsedSchedule,
      })

      // Notify parent component
      onScheduleParsed(parsedSchedule)
      
      console.log('✅ Schedule processing complete')
    } catch (error) {
      console.error('❌ Error processing schedule image:', error)
      Alert.alert(
        'Processing Error',
        error instanceof Error ? error.message : 'Failed to process schedule image. Please try again.'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="calendar-outline" size={hp(8)} color={ONBOARDING_THEME.colors.primary} />
      </View>

      <Text style={styles.title}>Add Your Schedule</Text>
      <Text style={styles.subtitle}>Connect with classmates in your sections</Text>
      <Text style={styles.description}>
        Upload a screenshot, import a file, or enter your classes manually. We'll help you find people in your classes.
      </Text>

      {selectedImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selectedImage }} style={styles.image} resizeMode="contain" />
        </View>
      )}

      <View style={styles.buttonContainer}>
        {/* Primary: Photo Upload */}
        {!selectedImage && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleImagePicker}
            disabled={isProcessing}
          >
            <Ionicons name="camera-outline" size={hp(2.2)} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Upload Schedule Screenshot</Text>
          </TouchableOpacity>
        )}

        {selectedImage && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleImagePicker}
            disabled={isProcessing}
          >
            <Ionicons name="image-outline" size={hp(2.2)} color={ONBOARDING_THEME.colors.primary} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Change Screenshot</Text>
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Alternative: Import File */}
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleFileImport}
          disabled={isProcessing}
        >
          <Ionicons name="document-text-outline" size={hp(2.2)} color={ONBOARDING_THEME.colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Import File (iCal / CSV)</Text>
        </TouchableOpacity>

        {/* Alternative: Manual Entry */}
        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={handleManualEntry}
          disabled={isProcessing}
        >
          <Ionicons name="create-outline" size={hp(2.2)} color="#8E8E8E" style={styles.buttonIcon} />
          <Text style={[styles.buttonText, styles.tertiaryButtonText]}>Enter Manually</Text>
        </TouchableOpacity>
      </View>

      {isProcessing && (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing schedule...</Text>
        </View>
      )}
    </ScrollView>
  )
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
      paddingVertical: hp(2),
      paddingHorizontal: wp(6),
      paddingBottom: hp(20),
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: hp(2.5),
    },
    title: {
      fontSize: hp(3.5),
      fontWeight: '800',
      color: '#1A1A1A',
      textAlign: 'center',
      marginBottom: hp(0.8),
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: hp(2),
      fontWeight: '600',
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: hp(1),
    },
    description: {
      fontSize: hp(1.7),
      color: '#8E8E8E',
      textAlign: 'center',
      lineHeight: hp(2.5),
      marginBottom: hp(3),
    },
    imagePreview: {
      width: '100%',
      height: hp(25),
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: hp(2.5),
      backgroundColor: '#F8F8F8',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    buttonContainer: {
      gap: hp(1.2),
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(1.8),
      paddingHorizontal: wp(5),
      borderRadius: 14,
      minHeight: hp(6),
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    secondaryButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    tertiaryButton: {
      backgroundColor: 'rgba(142, 142, 142, 0.06)',
      borderWidth: 0,
    },
    buttonIcon: {
      marginRight: wp(2.5),
    },
    buttonText: {
      fontSize: hp(1.7),
      fontWeight: '600',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    secondaryButtonText: {
      color: theme.colors.primary,
    },
    tertiaryButtonText: {
      color: '#8E8E8E',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: hp(1.5),
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
    },
    dividerText: {
      marginHorizontal: wp(4),
      fontSize: hp(1.5),
      color: '#BDBDBD',
      fontWeight: '500',
    },
    processingContainer: {
      marginTop: hp(2.5),
      alignItems: 'center',
      padding: hp(2),
      backgroundColor: 'rgba(164, 92, 255, 0.08)',
      borderRadius: 12,
    },
    processingText: {
      fontSize: hp(1.6),
      color: theme.colors.primary,
      fontWeight: '500',
    },
  })




