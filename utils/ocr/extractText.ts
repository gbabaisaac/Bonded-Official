/**
 * OCR Text Extraction Utility
 * 
 * Uses React Native ML Kit Text Recognition for production builds.
 * Falls back gracefully in Expo Go (development).
 * 
 * Works in:
 * - ✅ EAS Build (production)
 * - ✅ Development Build (expo-dev-client)
 * - ❌ Expo Go (shows fallback message)
 */

import * as ImagePicker from 'expo-image-picker'

export interface TextBlock {
  text: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence?: number
}

export interface OCRResult {
  rawText: string
  blocks: TextBlock[]
  imageUri: string
}

/**
 * Check if ML Kit is available (not in Expo Go)
 */
let TextRecognition: any = null
let mlKitAvailable = false

try {
  // Dynamic import to avoid crash in Expo Go
  TextRecognition = require('@react-native-ml-kit/text-recognition').default
  mlKitAvailable = true
  console.log('✅ ML Kit Text Recognition is available')
} catch (error) {
  console.log('⚠️ ML Kit not available (likely running in Expo Go)')
  mlKitAvailable = false
}

/**
 * Request camera/photo library permissions
 */
export async function requestImagePermissions(): Promise<boolean> {
  const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
  const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  
  return cameraStatus === 'granted' || libraryStatus === 'granted'
}

/**
 * Pick image from camera or library
 */
export async function pickScheduleImage(): Promise<string | null> {
  try {
    const hasPermission = await requestImagePermissions()
    if (!hasPermission) {
      throw new Error('Camera and photo library permissions are required')
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) {
      return null
    }

    return result.assets[0].uri
  } catch (error) {
    console.error('Error picking image:', error)
    throw error
  }
}

/**
 * Take photo with camera
 */
export async function takeSchedulePhoto(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('Camera permission is required')
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) {
      return null
    }

    return result.assets[0].uri
  } catch (error) {
    console.error('Error taking photo:', error)
    throw error
  }
}

/**
 * Extract text from image using ML Kit Text Recognition
 * 
 * In production builds: Uses ML Kit for real OCR
 * In Expo Go: Returns empty result to trigger fallback UI
 * 
 * @param imageUri - Local URI of the image
 * @returns OCR result with raw text and bounding boxes
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  if (!imageUri) {
    throw new Error('Image URI is required')
  }

  console.log('📷 Processing image:', imageUri)

  // Check if ML Kit is available
  if (!mlKitAvailable || !TextRecognition) {
    console.log('⚠️ ML Kit not available - returning empty result for fallback UI')
    console.log('💡 OCR will work in production builds (EAS Build)')
    
    // Return empty result - UI will show fallback message
    return {
      rawText: '',
      blocks: [],
      imageUri,
    }
  }

  try {
    console.log('🔍 Starting ML Kit text recognition...')

    // Use ML Kit to recognize text in the image
    const result = await TextRecognition.recognize(imageUri)

    console.log(`✅ ML Kit recognized ${result.blocks?.length || 0} text blocks`)

    // Map ML Kit blocks to our TextBlock interface
    const blocks: TextBlock[] = (result.blocks || []).map((block: any) => ({
      text: block.text || '',
      boundingBox: {
        x: block.frame?.origin?.x || block.frame?.x || 0,
        y: block.frame?.origin?.y || block.frame?.y || 0,
        width: block.frame?.size?.width || block.frame?.width || 0,
        height: block.frame?.size?.height || block.frame?.height || 0,
      },
      confidence: block.confidence,
    }))

    // Get raw text - either from result.text or by joining all blocks
    const rawText = result.text || blocks.map((b) => b.text).join('\n')

    console.log(`📝 Extracted ${rawText.length} characters of text`)

    return {
      rawText,
      blocks,
      imageUri,
    }
  } catch (error) {
    console.error('❌ ML Kit OCR failed:', error)
    
    // Return empty result on error - let UI show fallback
    return {
      rawText: '',
      blocks: [],
      imageUri,
    }
  }
}

/**
 * Check if OCR is available on this device/build
 */
export function isOCRAvailable(): boolean {
  return mlKitAvailable
}
