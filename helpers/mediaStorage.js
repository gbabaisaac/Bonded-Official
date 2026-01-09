import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '../lib/supabase'

const BONDED_MEDIA_BUCKET = 'bonded-media'
const DEFAULT_SIGNED_URL_TTL = 60 * 60 * 24 * 7

const ensureValue = (value, label) => {
  if (!value) {
    throw new Error(`${label} is required for media upload`)
  }
}

const generateMediaId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

export async function getUniversityIdForUser(userId) {
  ensureValue(userId, 'User ID')

  const { data, error } = await supabase
    .from('profiles')
    .select('university_id')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching university_id for media upload:', error)
    throw error
  }

  return data?.university_id || null
}

export function buildMediaPath({
  mediaType,
  universityId,
  userId,
  orgId,
  eventId,
  storyId,
  postId,
  mediaId,
}) {
  ensureValue(universityId, 'universityId')

  switch (mediaType) {
    case 'profile_avatar':
      ensureValue(userId, 'userId')
      return `universities/${universityId}/users/${userId}/profile/avatar.jpg`
    case 'profile_banner':
      ensureValue(userId, 'userId')
      return `universities/${universityId}/users/${userId}/profile/banner.jpg`
    case 'profile_photo':
      ensureValue(userId, 'userId')
      ensureValue(mediaId, 'mediaId')
      return `universities/${universityId}/users/${userId}/profile/photos/${mediaId}.jpg`
    case 'story':
      ensureValue(userId, 'userId')
      ensureValue(storyId, 'storyId')
      return `universities/${universityId}/users/${userId}/stories/${storyId}.jpg`
    case 'post':
      ensureValue(userId, 'userId')
      ensureValue(postId, 'postId')
      ensureValue(mediaId, 'mediaId')
      return `universities/${universityId}/users/${userId}/posts/${postId}/${mediaId}.jpg`
    case 'org_logo':
      ensureValue(orgId, 'orgId')
      return `universities/${universityId}/orgs/${orgId}/logo/logo.jpg`
    case 'org_cover':
      ensureValue(orgId, 'orgId')
      return `universities/${universityId}/orgs/${orgId}/cover/cover.jpg`
    case 'event_cover':
      ensureValue(eventId, 'eventId')
      return `universities/${universityId}/events/${eventId}/cover/cover.jpg`
    case 'event_gallery':
      ensureValue(eventId, 'eventId')
      ensureValue(mediaId, 'mediaId')
      return `universities/${universityId}/events/${eventId}/gallery/${mediaId}.jpg`
    default:
      throw new Error(`Unsupported mediaType: ${mediaType}`)
  }
}

export async function uploadImageToBondedMedia({
  fileUri,
  mediaType,
  ownerType,
  ownerId,
  userId,
  universityId,
  orgId,
  eventId,
  storyId,
  postId,
  expiresAt = null,
  mimeType = 'image/jpeg',
  upsert = false,
}) {
  ensureValue(fileUri, 'fileUri')
  ensureValue(mediaType, 'mediaType')
  ensureValue(ownerType, 'ownerType')
  ensureValue(ownerId, 'ownerId')
  ensureValue(userId, 'userId')

  const resolvedUniversityId = universityId || (await getUniversityIdForUser(userId))
  ensureValue(resolvedUniversityId, 'universityId')

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  })

  if (!base64) {
    throw new Error('Failed to read image file for upload')
  }

  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const mediaId = generateMediaId()
  const path = buildMediaPath({
    mediaType,
    universityId: resolvedUniversityId,
    userId,
    orgId,
    eventId,
    storyId,
    postId,
    mediaId,
  })

  console.log('📁 Upload path:', path)
  console.log('🔐 Upload context:', {
    bucket: BONDED_MEDIA_BUCKET,
    mediaType,
    userId,
    universityId: resolvedUniversityId,
    upsert,
    byteSize: bytes.length,
  })

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BONDED_MEDIA_BUCKET)
    .upload(path, bytes, {
      contentType: mimeType,
      upsert,
    })

  if (uploadError) {
    console.error('Supabase storage upload failed:', uploadError)
    throw uploadError
  }

  console.log('✅ File uploaded to storage successfully')

  // Insert or update media record
  // If upsert=true, we need to handle the case where the record already exists
  const mediaRecord = {
    owner_type: ownerType,
    owner_id: ownerId,
    university_id: resolvedUniversityId,
    bucket: BONDED_MEDIA_BUCKET,
    path,
    media_type: mediaType,
    mime_type: mimeType,
    size_bytes: bytes.length,
    expires_at: expiresAt,
  }

  let mediaData
  let mediaError

  if (upsert) {
    // Try to upsert - update if exists, insert if not
    const { data, error } = await supabase
      .from('media')
      .upsert(mediaRecord, {
        onConflict: 'path',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    mediaData = data
    mediaError = error
  } else {
    // Regular insert
    const { data, error } = await supabase
      .from('media')
      .insert(mediaRecord)
      .select()
      .single()

    mediaData = data
    mediaError = error
  }

  if (mediaError) {
    console.error('Failed to insert/update media record:', mediaError)
    throw mediaError
  }

  console.log('✅ Media record saved successfully:', mediaData?.id)

  return {
    path: uploadData?.path || path,
    media: mediaData,
    universityId: resolvedUniversityId,
  }
}

export async function createSignedUrlForPath(path, ttlSeconds = DEFAULT_SIGNED_URL_TTL) {
  ensureValue(path, 'path')

  const { data, error } = await supabase.storage
    .from(BONDED_MEDIA_BUCKET)
    .createSignedUrl(path, ttlSeconds)

  if (error) {
    console.error('Failed to create signed URL:', error)
    throw error
  }

  return data?.signedUrl || null
}

export async function resolveMediaUrls(mediaUrls, ttlSeconds = DEFAULT_SIGNED_URL_TTL) {
  if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) {
    return []
  }

  const resolved = await Promise.all(
    mediaUrls.map(async (url) => {
      if (!url) return null
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }

      try {
        return await createSignedUrlForPath(url, ttlSeconds)
      } catch (error) {
        return null
      }
    })
  )

  return resolved.filter(Boolean)
}
