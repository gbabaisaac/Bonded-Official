/**
 * MessagesContext - Real-time messaging with Supabase
 * 
 * Architecture:
 * 1. Messages: Stored in DB, real-time via Postgres Changes (not Broadcast)
 * 2. Typing indicators: Ephemeral, via Broadcast (not stored)
 * 3. Online status: Via Presence
 * 
 * Table: public.messages
 * - id, conversation_id, sender_id, content, created_at
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { moderateMessage as moderateMessageService } from '../services/messageModeration'

const MessagesContext = createContext()

export const MessagesProvider = ({ children }) => {
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState({}) // { conversationId: [messages] }
  const [typingUsers, setTypingUsers] = useState({}) // { conversationId: { oderId: timestamp } }
  const [onlineUsers, setOnlineUsers] = useState({}) // { oderId: true }
  const [isLoading, setIsLoading] = useState(false)
  const subscriptionsRef = useRef({})
  const typingTimeoutsRef = useRef({})
  const presenceChannelRef = useRef(null)

  // Check if string is a valid UUID
  const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Check if Supabase table exists (for graceful fallback)
  const isTableNotFoundError = (error) => {
    return error?.code === 'PGRST205' || 
           error?.code === '42P01' ||
           error?.message?.includes('Could not find the table') ||
           error?.message?.includes('relation') && error?.message?.includes('does not exist')
  }

  // ============================================================================
  // CONVERSATIONS
  // ============================================================================

  // Load user's conversations
  const loadConversations = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)

      // Fetch conversations where user is a participant
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversation:conversations (
            id,
            name,
            type,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)

      if (isTableNotFoundError(error)) {
        console.warn('Conversations table not found, using empty state')
        setConversations([])
        return
      }

      if (error) {
        console.error('Error loading conversations:', error)
        throw error
      }

      // Get last message and other participants for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (item) => {
          const conv = item.conversation

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Get other participants
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profile:profiles (
                id,
                full_name,
                username,
                avatar_url
              )
            `)
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id)

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .gt('created_at', item.last_read_at || '1970-01-01')

          return {
            ...conv,
            lastMessage: lastMsg?.content || null,
            lastMessageAt: lastMsg?.created_at || conv.created_at,
            lastMessageSenderId: lastMsg?.sender_id || null,
            participants: (participants || []).map(p => p.profile),
            unreadCount: unreadCount || 0,
          }
        })
      )

      // Sort by last message time
      conversationsWithDetails.sort((a, b) => 
        new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
      )

      setConversations(conversationsWithDetails)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Get or create 1-on-1 conversation
  const getOrCreateConversation = async (otherUserId) => {
    if (!user?.id) throw new Error('User must be authenticated')
    if (!otherUserId) throw new Error('Other user ID is required')

    try {
      // Check for existing 1-on-1 conversation
      const { data: existing } = await supabase
        .rpc('find_direct_conversation', {
          user1: user.id,
          user2: otherUserId
        })

      if (existing) {
        return existing
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: user.id,
        })
        .select()
        .single()

      if (convError) throw convError

      // Add participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: otherUserId },
        ])

      if (participantError) throw participantError

      // Reload conversations
      await loadConversations()

      return newConv.id
    } catch (error) {
      console.error('Error getting/creating conversation:', error)
      
      // Fallback for when tables don't exist
      if (isTableNotFoundError(error)) {
        return `local-conv-${user.id}-${otherUserId}`
      }
      
      throw error
    }
  }

  // Create group conversation
  const createGroupConversation = async (participantIds, name) => {
    if (!user?.id) throw new Error('User must be authenticated')
    if (!participantIds?.length) throw new Error('Participant IDs are required')

    try {
      // Create conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name: name || 'Group Chat',
          created_by: user.id,
        })
        .select()
        .single()

      if (convError) throw convError

      // Add all participants (including creator)
      const allParticipants = [...new Set([user.id, ...participantIds])]
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(
          allParticipants.map(userId => ({
            conversation_id: newConv.id,
            user_id: userId,
          }))
        )

      if (participantError) throw participantError

      // Reload conversations
      await loadConversations()

      return newConv.id
    } catch (error) {
      console.error('Error creating group conversation:', error)
      throw error
    }
  }

  // ============================================================================
  // MESSAGES
  // ============================================================================

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId, limit = 50) => {
    if (!conversationId || !isValidUUID(conversationId)) {
      setMessages(prev => ({ ...prev, [conversationId]: [] }))
      return
    }

    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error loading messages:', error)
        throw error
      }

      // Reverse to get chronological order
      const sortedMessages = (data || []).reverse()

      setMessages(prev => ({
        ...prev,
        [conversationId]: sortedMessages,
      }))

      // Subscribe to real-time updates
      subscribeToMessages(conversationId)
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages(prev => ({
        ...prev,
        [conversationId]: [],
      }))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Send a message
  const sendMessage = async (conversationId, content) => {
    if (!user?.id) throw new Error('User must be authenticated')
    if (!conversationId) throw new Error('Conversation ID is required')
    if (!content?.trim()) throw new Error('Message content is required')

    try {
      // AI Moderation check (if enabled)
      try {
        const moderationResult = await moderateMessageService(content)
        if (!moderationResult.allowed) {
          Alert.alert('Message Blocked', moderationResult.reason || 'Your message contains inappropriate content.')
          return null
        }
      } catch (modError) {
        console.warn('Moderation check failed, proceeding:', modError)
      }

      // Handle local/fallback conversations
      if (!isValidUUID(conversationId)) {
        const localMessage = {
          id: `msg-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          created_at: new Date().toISOString(),
          sender: {
            id: user.id,
            full_name: user.user_metadata?.full_name || 'You',
            avatar_url: user.user_metadata?.avatar_url,
          },
        }
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), localMessage],
        }))
        return localMessage
      }

      // Insert message to Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error('Error sending message:', error)
        throw error
      }

      console.log('✅ Message sent:', data.id)

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      return data
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS (Postgres Changes)
  // ============================================================================

  // Subscribe to new messages in a conversation
  const subscribeToMessages = useCallback((conversationId) => {
    if (!isValidUUID(conversationId)) return

    // Unsubscribe if already subscribed
    if (subscriptionsRef.current[conversationId]) {
      subscriptionsRef.current[conversationId].unsubscribe()
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new

          // Fetch sender details
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .eq('id', newMessage.sender_id)
            .single()

          const messageWithSender = {
            ...newMessage,
            sender,
          }

          setMessages(prev => {
            const existing = prev[conversationId] || []
            // Avoid duplicates
            if (existing.find(m => m.id === newMessage.id)) {
              return prev
            }
            return {
              ...prev,
              [conversationId]: [...existing, messageWithSender],
            }
          })
        }
      )
      .subscribe()

    subscriptionsRef.current[conversationId] = channel
    console.log('📡 Subscribed to messages for conversation:', conversationId)
  }, [])

  // ============================================================================
  // TYPING INDICATORS (Broadcast - ephemeral, not stored)
  // ============================================================================

  // Send typing indicator
  const sendTypingIndicator = useCallback((conversationId) => {
    if (!user?.id || !isValidUUID(conversationId)) return

    const channel = supabase.channel(`typing:${conversationId}`)
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            timestamp: Date.now(),
          },
        })
      }
    })

    // Unsubscribe after sending
    setTimeout(() => channel.unsubscribe(), 100)
  }, [user?.id])

  // Subscribe to typing indicators for a conversation
  const subscribeToTyping = useCallback((conversationId) => {
    if (!user?.id || !isValidUUID(conversationId)) return

    const channelName = `typing:${conversationId}`
    
    // Avoid duplicate subscriptions
    if (subscriptionsRef.current[`typing-${conversationId}`]) {
      return
    }

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, timestamp } = payload.payload

        // Don't show own typing
        if (user_id === user.id) return

        // Set typing user
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: {
            ...prev[conversationId],
            [user_id]: timestamp,
          },
        }))

        // Clear after 3 seconds
        const timeoutKey = `${conversationId}-${user_id}`
        if (typingTimeoutsRef.current[timeoutKey]) {
          clearTimeout(typingTimeoutsRef.current[timeoutKey])
        }
        typingTimeoutsRef.current[timeoutKey] = setTimeout(() => {
          setTypingUsers(prev => {
            const convTyping = { ...prev[conversationId] }
            delete convTyping[user_id]
            return {
              ...prev,
              [conversationId]: convTyping,
            }
          })
        }, 3000)
      })
      .subscribe()

    subscriptionsRef.current[`typing-${conversationId}`] = channel
    console.log('📡 Subscribed to typing for conversation:', conversationId)
  }, [user?.id])

  // Check if someone is typing in a conversation
  const isTyping = useCallback((conversationId) => {
    const convTyping = typingUsers[conversationId] || {}
    return Object.keys(convTyping).length > 0
  }, [typingUsers])

  // Get typing user IDs for a conversation
  const getTypingUsers = useCallback((conversationId) => {
    return Object.keys(typingUsers[conversationId] || {})
  }, [typingUsers])

  // ============================================================================
  // ONLINE STATUS (Presence)
  // ============================================================================

  // Setup presence tracking
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const online = {}
        Object.keys(state).forEach(key => {
          online[key] = true
        })
        setOnlineUsers(online)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => ({ ...prev, [key]: true }))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
        }
      })

    presenceChannelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id])

  // Check if a user is online
  const isUserOnline = useCallback((userId) => {
    return !!onlineUsers[userId]
  }, [onlineUsers])

  // ============================================================================
  // MARK AS READ
  // ============================================================================

  const markAsRead = async (conversationId) => {
    if (!user?.id || !isValidUUID(conversationId)) return

    try {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      // Update local unread count
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      // Cleanup message subscriptions
      Object.values(subscriptionsRef.current).forEach((sub) => {
        if (sub?.unsubscribe) sub.unsubscribe()
      })
      
      // Cleanup typing timeouts
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout)
      
      // Cleanup presence
      if (presenceChannelRef.current?.unsubscribe) {
        presenceChannelRef.current.unsubscribe()
      }
    }
  }, [])

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadConversations()
    }
  }, [user?.id, loadConversations])

  return (
    <MessagesContext.Provider
      value={{
        // State
        conversations,
        messages,
        isLoading,
        
        // Conversations
        loadConversations,
        getOrCreateConversation,
        createGroupConversation,
        
        // Messages
        loadMessages,
        sendMessage,
        markAsRead,
        
        // Real-time
        subscribeToMessages,
        subscribeToTyping,
        sendTypingIndicator,
        
        // Status
        isTyping,
        getTypingUsers,
        isUserOnline,
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}

export const useMessagesContext = () => {
  const context = useContext(MessagesContext)
  if (!context) {
    throw new Error('useMessagesContext must be used within MessagesProvider')
  }
  return context
}

