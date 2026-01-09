import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { VoiceNoteRecorder } from '../components/VoiceNoteRecorder'
import { useMessagesContext } from '../contexts/MessagesContext'
import { hp, wp } from '../helpers/common'
import { analyzeConversationQuality, getConversationSuggestions } from '../services/linkAIConversation'
import { isFeatureEnabled } from '../utils/featureGates'
import { moderateMessage } from '../services/messageModeration'
import { useAppTheme } from './theme'

const CURRENT_USER_ID = 'user-123' // Replace with actual auth

export default function Chat() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const params = useLocalSearchParams()
  const {
    sendMessage: sendMessageToContext,
    loadMessages,
    getOrCreateConversation,
    messages: contextMessages,
    isLoading,
  } = useMessagesContext()

  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showLinkAI, setShowLinkAI] = useState(false)
  const [linkAISuggestions, setLinkAISuggestions] = useState([])
  const [conversationQuality, setConversationQuality] = useState(null)
  const flatListRef = useRef(null)
  const soundRef = useRef(null)
  const conversationIdRef = useRef(null)

  const userName = params.userName || params.forumName || 'User'
  const recipientId = params.userId || 'user-other'
  const isGroupChat = params.isGroupChat === 'true'
  const forumName = params.forumName

  // Initialize conversation and load messages
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const convId = await getOrCreateConversation(CURRENT_USER_ID, recipientId)
        conversationIdRef.current = convId
        await loadMessages(convId)
      } catch (error) {
        console.error('Error initializing chat:', error)
      }
    }

    initializeChat()
  }, [recipientId])

  // Update messages when context messages change
  useEffect(() => {
    if (conversationIdRef.current && contextMessages[conversationIdRef.current]) {
      const convMessages = contextMessages[conversationIdRef.current]
      setMessages(convMessages.map((msg) => ({
        id: msg.id,
        text: msg.message_text,
        senderId: msg.sender_id === CURRENT_USER_ID ? 'me' : 'other',
        timestamp: formatTimestamp(msg.created_at),
        type: msg.message_type || 'text',
        metadata: msg.metadata || {},
      })))

      // Analyze conversation quality
      analyzeConversationQuality(convMessages).then(setConversationQuality)

      // Get Link AI suggestions (only if feature is enabled)
      if (isFeatureEnabled('LINK_AI')) {
        getConversationSuggestions({
          messages: convMessages,
          recipientInfo: { name: userName },
          conversationStage: convMessages.length < 5 ? 'early' : 'ongoing',
        }).then((suggestions) => {
          setLinkAISuggestions(suggestions.suggestions || [])
        })
      }
    }
  }, [contextMessages, userName])

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages])

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return

    setIsSending(true)
    const text = inputText.trim()
    setInputText('')

    try {
      // AI Moderation
      const moderationResult = await moderateMessage(text)
      if (!moderationResult.allowed) {
        Alert.alert('Message Blocked', moderationResult.reason || 'Your message contains inappropriate content.')
        setIsSending(false)
        return
      }

      // Send message
      const message = await sendMessageToContext(
        conversationIdRef.current,
        recipientId,
        text,
        'text'
      )

      if (message) {
        // Message sent successfully
        setShowLinkAI(false) // Hide Link AI after sending
      }
    } catch (error) {
      console.error('Error sending message:', error)
      Alert.alert('Error', 'Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleVoiceNoteComplete = async (recording) => {
    setShowVoiceRecorder(false)
    
    try {
      // Upload voice note to Supabase Storage (or handle locally)
      // For now, we'll send it as a message with metadata
      await sendMessageToContext(
        conversationIdRef.current,
        recipientId,
        'Voice note',
        'voice',
        {
          uri: recording.uri,
          duration: recording.duration,
        }
      )
    } catch (error) {
      console.error('Error sending voice note:', error)
      Alert.alert('Error', 'Failed to send voice note.')
    }
  }

  const playVoiceNote = async (uri) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync()
      }

      const { sound } = await Audio.Sound.createAsync({ uri })
      soundRef.current = sound
      await sound.playAsync()
    } catch (error) {
      console.error('Error playing voice note:', error)
    }
  }

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === 'me'
    const isVoiceNote = item.type === 'voice'

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.messageContainerMe : styles.messageContainerOther,
        ]}
      >
        {isVoiceNote ? (
          <TouchableOpacity
            style={[
              styles.voiceNoteBubble,
              isMe ? styles.voiceNoteBubbleMe : styles.voiceNoteBubbleOther,
            ]}
            onPress={() => playVoiceNote(item.metadata?.uri)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="play-circle"
              size={hp(3)}
              color={isMe ? theme.colors.white : theme.colors.accent}
            />
            <View style={styles.voiceNoteInfo}>
              <Text
                style={[
                  styles.voiceNoteText,
                  isMe ? styles.voiceNoteTextMe : styles.voiceNoteTextOther,
                ]}
              >
                Voice note
              </Text>
              {item.metadata?.duration && (
                <Text
                  style={[
                    styles.voiceNoteDuration,
                    isMe ? styles.voiceNoteDurationMe : styles.voiceNoteDurationOther,
                  ]}
                >
                  {formatDuration(item.metadata.duration)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.messageBubble,
              isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMe ? styles.messageTextMe : styles.messageTextOther,
              ]}
            >
              {item.text}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isMe ? styles.messageTimeMe : styles.messageTimeOther,
              ]}
            >
              {item.timestamp}
            </Text>
          </View>
        )}
      </View>
    )
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={hp(2.5)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.chatHeaderContent}>
            {isGroupChat && (
              <View style={styles.groupChatIcon}>
                <Ionicons name="people" size={hp(2)} color={theme.colors.info} />
              </View>
            )}
            <View style={styles.chatHeaderText}>
              <Text style={styles.chatHeaderTitle}>{userName}</Text>
              {isGroupChat && (
                <Text style={styles.groupChatSubtitle}>Group chat from {forumName}</Text>
              )}
            </View>
          </View>
          {isFeatureEnabled('LINK_AI') && (
            <TouchableOpacity
              style={styles.headerIcon}
              activeOpacity={0.7}
              onPress={() => setShowLinkAI(!showLinkAI)}
            >
              <Ionicons 
                name={showLinkAI ? "sparkles" : "sparkles-outline"} 
                size={hp(2.5)} 
                color={showLinkAI ? theme.colors.accent : theme.colors.textPrimary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Link AI Suggestions */}
        {showLinkAI && linkAISuggestions.length > 0 && (
          <View style={styles.linkAIContainer}>
            <View style={styles.linkAIHeader}>
              <Ionicons name="sparkles" size={hp(1.8)} color={theme.colors.accent} />
              <Text style={styles.linkAITitle}>Link AI Suggestions</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
              {linkAISuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setInputText(suggestion)
                    setShowLinkAI(false)
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {conversationQuality && (
              <Text style={styles.qualityText}>{conversationQuality.feedback}</Text>
            )}
          </View>
        )}

        {/* Messages List */}
        {isLoading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? hp(2) : 0}
        >
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              activeOpacity={0.7}
              onPress={() => setShowVoiceRecorder(true)}
            >
              <Ionicons name="mic-outline" size={hp(2.8)} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Message"
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            {isSending ? (
              <ActivityIndicator size="small" color={theme.colors.accent} style={styles.sendButton} />
            ) : (
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                activeOpacity={0.7}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Ionicons
                  name="send"
                  size={hp(2.5)}
                  color={inputText.trim() ? theme.colors.white : theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* Voice Note Recorder Modal */}
        <Modal
          visible={showVoiceRecorder}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVoiceRecorder(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.voiceRecorderModal}>
              <VoiceNoteRecorder
                onRecordingComplete={handleVoiceNoteComplete}
                onCancel={() => setShowVoiceRecorder(false)}
              />
            </View>
          </View>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: hp(0.5),
  },
  chatHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupChatIcon: {
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: hp(1.75),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2),
  },
  chatHeaderText: {
    alignItems: 'center',
  },
  chatHeaderTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  groupChatSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    opacity: theme.ui.metaOpacity,
    marginTop: theme.spacing.xs,
  },
  headerIcon: {
    padding: hp(0.5),
  },
  linkAIContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.accent + '30',
  },
  linkAIHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  linkAITitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  suggestionsScroll: {
    marginBottom: theme.spacing.xs,
  },
  suggestionChip: {
    backgroundColor: theme.colors.accent + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.accent + '40',
  },
  suggestionText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontFamily.body,
  },
  qualityText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: hp(1),
    paddingBottom: hp(2),
  },
  messageContainer: {
    marginBottom: hp(1.5),
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  messageContainerOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: wp(70),
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.xl,
  },
  messageBubbleMe: {
    backgroundColor: theme.colors.bondedPurple,
    borderBottomRightRadius: theme.radius.sm,
  },
  messageBubbleOther: {
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: theme.radius.sm,
  },
  voiceNoteBubble: {
    maxWidth: wp(70),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.xl,
    gap: theme.spacing.sm,
  },
  voiceNoteBubbleMe: {
    backgroundColor: theme.colors.bondedPurple,
    borderBottomRightRadius: theme.radius.sm,
  },
  voiceNoteBubbleOther: {
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: theme.radius.sm,
  },
  voiceNoteInfo: {
    flex: 1,
  },
  voiceNoteText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: theme.spacing.xs,
  },
  voiceNoteTextMe: {
    color: theme.colors.white,
  },
  voiceNoteTextOther: {
    color: theme.colors.textPrimary,
  },
  voiceNoteDuration: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fontFamily.body,
  },
  voiceNoteDurationMe: {
    color: theme.colors.white,
    opacity: 0.8,
  },
  voiceNoteDurationOther: {
    color: theme.colors.textSecondary,
    opacity: 0.6,
  },
  messageText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.4),
    marginBottom: theme.spacing.xs,
  },
  messageTextMe: {
    color: theme.colors.white,
  },
  messageTextOther: {
    color: theme.colors.textPrimary,
  },
  messageTime: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fontFamily.body,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: theme.colors.white,
    opacity: 0.8,
  },
  messageTimeOther: {
    color: theme.colors.textSecondary,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.xl,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    marginBottom: hp(2),
    borderWidth: 1.5,
    borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : theme.colors.border,
  },
  attachButton: {
    padding: hp(0.5),
    marginRight: wp(2),
  },
  input: {
    flex: 1,
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    maxHeight: hp(10),
    paddingVertical: hp(0.8),
  },
  sendButton: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(2),
  },
  sendButtonDisabled: {
    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : theme.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  voiceRecorderModal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingBottom: hp(4),
  },
})
