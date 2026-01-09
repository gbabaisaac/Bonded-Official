import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import AppHeader from '../components/AppHeader'
import { isFeatureEnabled } from '../utils/featureGates'
import { useAppTheme } from './theme'
import { hp, wp } from '../helpers/common'

// Mock AI responses based on queries
const generateAIResponse = (query) => {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('golf') || lowerQuery.includes('golfing')) {
    return {
      type: 'people',
      message: "I found 12 people on campus who love golf! Here are some great matches:",
      results: [
        {
          id: '1',
          name: 'Jordan Miller',
          major: 'Business',
          year: '2025',
          avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
          bio: 'Golf enthusiast, play every weekend at Newport Country Club',
          groupjamScore: 92,
        },
        {
          id: '2',
          name: 'Sarah Chen',
          major: 'Finance',
          year: '2024',
          avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
          bio: 'Love golf! Always looking for playing partners',
          groupjamScore: 88,
        },
        {
          id: '3',
          name: 'Mike Thompson',
          major: 'Sports Management',
          year: '2026',
          avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
          bio: 'Golf team member, happy to play with anyone',
          groupjamScore: 85,
        },
      ],
    }
  }
  
  if (lowerQuery.includes('startup') || lowerQuery.includes('co-founder') || lowerQuery.includes('founder')) {
    return {
      type: 'people',
      message: "I found 8 potential co-founders interested in startups! Here are top matches:",
      results: [
        {
          id: '4',
          name: 'Emma Rodriguez',
          major: 'Computer Science',
          year: '2024',
          avatar: 'https://randomuser.me/api/portraits/women/35.jpg',
          bio: 'Building a fintech startup, looking for a technical co-founder',
          groupjamScore: 95,
        },
        {
          id: '5',
          name: 'David Kim',
          major: 'Business',
          year: '2025',
          avatar: 'https://randomuser.me/api/portraits/men/38.jpg',
          bio: 'Entrepreneur, have 2 startup ideas ready to launch',
          groupjamScore: 90,
        },
        {
          id: '6',
          name: 'Alex Patel',
          major: 'Engineering',
          year: '2024',
          avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
          bio: 'Tech entrepreneur, looking for business-minded co-founder',
          groupjamScore: 87,
        },
      ],
    }
  }
  
  if (lowerQuery.includes('club') || lowerQuery.includes('organization') || lowerQuery.includes('org')) {
    return {
      type: 'clubs',
      message: "I found 15 clubs and organizations that might interest you! Here are the top matches:",
      results: [
        {
          id: 'club1',
          name: 'Entrepreneurship Club',
          category: 'Business',
          members: 145,
          description: 'For students interested in startups and business',
          image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400',
        },
        {
          id: 'club2',
          name: 'Golf Club',
          category: 'Sports',
          members: 32,
          description: 'Weekly golf outings and tournaments',
          image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400',
        },
        {
          id: 'club3',
          name: 'Tech Innovation Society',
          category: 'Technology',
          members: 89,
          description: 'Building projects and networking with tech professionals',
          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
        },
      ],
    }
  }
  
  if (lowerQuery.includes('study') || lowerQuery.includes('study group') || lowerQuery.includes('study buddy')) {
    return {
      type: 'people',
      message: "I found 20 people looking for study partners! Here are great matches:",
      results: [
        {
          id: '7',
          name: 'Jessica Wang',
          major: 'Computer Science',
          year: '2025',
          avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
          bio: 'Looking for study buddies for CS 201 and MATH 150',
          groupjamScore: 93,
        },
        {
          id: '8',
          name: 'Ryan O\'Connor',
          major: 'Engineering',
          year: '2024',
          avatar: 'https://randomuser.me/api/portraits/men/29.jpg',
          bio: 'Study group organizer, meet at library every Tuesday',
          groupjamScore: 89,
        },
      ],
    }
  }
  
  // Default response
  return {
    type: 'text',
    message: "I can help you find people, clubs, study groups, co-founders, and more on campus! Try asking me:\n\n• \"I'm looking for friends who golf\"\n• \"I need a startup co-founder\"\n• \"Show me clubs related to tech\"\n• \"Find me a study buddy for CS 201\"\n\nWhat are you looking for?",
  }
}

// Quick suggestion prompts
const QUICK_SUGGESTIONS = [
  "I'm looking for friends who golf",
  "I need a startup co-founder",
  "Show me tech clubs",
  "Find me a study buddy",
]

// Mock initial messages
const INITIAL_MESSAGES = [
  {
    id: '1',
    type: 'ai',
    content: "Hey! I'm Link, your AI assistant. I can help you connect with anyone on campus! 🎓\n\nJust tell me what you're looking for and I'll scan the whole school's database to find perfect matches.",
    timestamp: new Date(),
  },
]

export default function LinkAI() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const flatListRef = useRef(null)

  // Gate: Redirect if feature is disabled
  useEffect(() => {
    if (!isFeatureEnabled('LINK_AI')) {
      router.replace('/yearbook')
    }
  }, [router])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages])

  const handleSend = (text) => {
    const messageText = text || inputText
    if (!messageText.trim()) return

    setShowSuggestions(false)

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageText)
      setIsTyping(false)

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        data: aiResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    }, 1500)
  }

  const renderMessage = ({ item }) => {
    const isUser = item.type === 'user'

    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={hp(2.5)} color={theme.colors.bondedPurple} />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
          {item.data && item.data.results && (
            <View style={styles.resultsContainer}>
              {item.data.type === 'people' && item.data.results.map((person) => (
                <TouchableOpacity
                  key={person.id}
                  style={styles.resultCard}
                  onPress={() => {
                    // Navigate to profile or show profile modal
                  }}
                >
                  <Image source={{ uri: person.avatar }} style={styles.resultAvatar} />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{person.name}</Text>
                    <Text style={styles.resultMeta}>
                      {person.major} • {person.year}
                    </Text>
                    <Text style={styles.resultBio} numberOfLines={2}>
                      {person.bio}
                    </Text>
                    <View style={styles.groupjamBadge}>
                      <Ionicons name="heart" size={hp(1.4)} color={theme.colors.bondedPurple} />
                      <Text style={styles.groupjamText}>GroupJam: {person.groupjamScore}%</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.connectButton}>
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              {item.data.type === 'clubs' && item.data.results.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.clubCard}
                  onPress={() => router.push(`/clubs/${club.id}`)}
                >
                  <Image source={{ uri: club.image }} style={styles.clubImage} />
                  <View style={styles.clubInfo}>
                    <Text style={styles.clubName}>{club.name}</Text>
                    <Text style={styles.clubCategory}>{club.category}</Text>
                    <Text style={styles.clubDescription} numberOfLines={2}>
                      {club.description}
                    </Text>
                    <View style={styles.clubMeta}>
                      <Ionicons name="people" size={hp(1.4)} color={theme.colors.textSecondary} />
                      <Text style={styles.clubMembers}>{club.members} members</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.userAvatarImage}
            />
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Link AI"
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            onPress={() => {
              setMessages(INITIAL_MESSAGES)
              setShowSuggestions(true)
            }}
          >
            <Ionicons name="refresh-outline" size={hp(2.4)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        ref={flatListRef}
        data={[...messages, ...(isTyping ? [{ id: 'typing', type: 'ai', content: '...', isTyping: true }] : [])]}
        renderItem={({ item }) => {
          if (item.isTyping) {
            return (
              <View style={[styles.messageContainer, styles.userMessageContainer]}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={hp(2.5)} color={theme.colors.bondedPurple} />
                </View>
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <View style={styles.typingIndicator}>
                    <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                    <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
                    <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
                  </View>
                </View>
              </View>
            )
          }
          return renderMessage({ item })
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          showSuggestions && messages.length === INITIAL_MESSAGES.length ? (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Try asking:</Text>
              <View style={styles.suggestionsList}>
                {QUICK_SUGGESTIONS.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => handleSend(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask Link anything... (e.g., 'I'm looking for friends who golf')"
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
            >
              <Ionicons
                name="send"
                size={hp(2.2)}
                color={inputText.trim() ? theme.colors.white : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messagesList: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: hp(2),
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    flexDirection: 'row-reverse',
  },
  aiAvatar: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: theme.colors.bondedPurple + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2),
    marginTop: hp(0.5),
  },
  userAvatar: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    marginLeft: wp(2),
    marginTop: hp(0.5),
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
  },
  aiBubble: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userBubble: {
    backgroundColor: theme.colors.bondedPurple,
  },
  messageText: {
    fontSize: hp(1.7),
    lineHeight: hp(2.4),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
  userMessageText: {
    color: theme.colors.white,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: wp(1.5),
    alignItems: 'center',
  },
  typingDot: {
    width: hp(0.8),
    height: hp(0.8),
    borderRadius: hp(0.4),
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.4,
  },
  resultsContainer: {
    marginTop: hp(1.5),
    gap: hp(1.5),
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: wp(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  resultAvatar: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    marginRight: wp(3),
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.3),
  },
  resultMeta: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(0.5),
  },
  resultBio: {
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(0.5),
  },
  groupjamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.3),
  },
  groupjamText: {
    fontSize: hp(1.3),
    color: theme.colors.bondedPurple,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.body,
  },
  connectButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.md,
  },
  connectButtonText: {
    fontSize: hp(1.5),
    color: theme.colors.white,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.body,
  },
  clubCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clubImage: {
    width: '100%',
    height: hp(12),
  },
  clubInfo: {
    padding: wp(3),
  },
  clubName: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.3),
  },
  clubCategory: {
    fontSize: hp(1.4),
    color: theme.colors.bondedPurple,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(0.5),
  },
  clubDescription: {
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(0.5),
  },
  clubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  clubMembers: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  inputContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.xl,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    gap: wp(2),
  },
  input: {
    flex: 1,
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    maxHeight: hp(12),
    paddingVertical: hp(0.5),
  },
  sendButton: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  suggestionsContainer: {
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  suggestionsTitle: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(1.5),
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  suggestionChip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  suggestionText: {
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
})

