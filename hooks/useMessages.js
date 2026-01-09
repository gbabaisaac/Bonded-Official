/**
 * React Query hooks for messaging
 * 
 * These hooks provide a React Query interface for the MessagesContext,
 * offering better caching and state management.
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

const MESSAGES_PER_PAGE = 50

/**
 * Hook to fetch user's conversations
 */
export function useConversations() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      console.log('📬 Fetching conversations for user:', user.id)

      // Fetch conversations where user is a participant
      // Note: last_read_at and is_muted may not exist yet in the schema
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          conversation:conversations (
            id,
            name,
            type,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)

      if (partError) {
        console.error('❌ Error fetching conversations:', partError)
        throw partError
      }

      // Get details for each conversation
      const conversationsWithDetails = await Promise.all(
        (participations || []).map(async (item) => {
          const conv = item.conversation
          if (!conv) return null

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

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

          // Unread count - simplified for now (can add last_read_at tracking later)
          // For MVP, we'll skip unread counts
          return {
            ...conv,
            lastMessage: lastMsg?.content || null,
            lastMessageAt: lastMsg?.created_at || conv.created_at,
            lastMessageSenderId: lastMsg?.sender_id || null,
            participants: (participants || []).map(p => p.profile).filter(Boolean),
            unreadCount: 0, // TODO: Add last_read_at to conversation_participants for proper tracking
            isMuted: false, // TODO: Add is_muted to conversation_participants
          }
        })
      )

      // Filter out nulls and sort by last message time
      const sorted = conversationsWithDetails
        .filter(Boolean)
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))

      console.log(`✅ Fetched ${sorted.length} conversations`)
      return sorted
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to fetch messages for a conversation with pagination
 */
export function useMessages(conversationId) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!conversationId) return { messages: [], hasMore: false }

      console.log(`📨 Fetching messages for conversation: ${conversationId}, page: ${pageParam}`)

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
        .range(pageParam, pageParam + MESSAGES_PER_PAGE - 1)

      if (error) {
        console.error('❌ Error fetching messages:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length || 0} messages`)

      return {
        messages: (data || []).reverse(), // Reverse to get chronological order
        hasMore: data?.length === MESSAGES_PER_PAGE,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.reduce((total, page) => total + page.messages.length, 0)
    },
    enabled: !!conversationId && !!user?.id,
    staleTime: 0, // Always refetch for real-time feel
  })

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversationId) return

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
          console.log('📬 New message received:', payload.new.id)

          // Fetch sender details
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage = {
            ...payload.new,
            sender,
          }

          // Add to cache
          queryClient.setQueryData(['messages', conversationId], (old) => {
            if (!old) return { pages: [{ messages: [newMessage], hasMore: false }], pageParams: [0] }

            const firstPage = old.pages[0]
            const existingIds = firstPage.messages.map(m => m.id)

            // Avoid duplicates
            if (existingIds.includes(newMessage.id)) {
              return old
            }

            return {
              ...old,
              pages: [
                {
                  ...firstPage,
                  messages: [...firstPage.messages, newMessage],
                },
                ...old.pages.slice(1),
              ],
            }
          })

          // Also update conversations list
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId, queryClient])

  return query
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, content }) => {
      if (!user?.id) throw new Error('User must be authenticated')
      if (!conversationId) throw new Error('Conversation ID is required')
      if (!content?.trim()) throw new Error('Message content is required')

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

      if (error) throw error

      console.log('✅ Message sent:', data.id)
      return data
    },
    onSuccess: (data) => {
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook to create or get a direct conversation
 */
export function useCreateConversation() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ otherUserId, groupName, participantIds }) => {
      if (!user?.id) throw new Error('User must be authenticated')

      // If it's a direct conversation
      if (otherUserId && !participantIds) {
        // Check for existing conversation
        const { data: existing } = await supabase
          .rpc('find_direct_conversation', {
            user1: user.id,
            user2: otherUserId,
          })

        if (existing) {
          console.log('📬 Found existing conversation:', existing)
          return existing
        }

        // Create new direct conversation
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
        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: newConv.id, user_id: user.id },
            { conversation_id: newConv.id, user_id: otherUserId },
          ])

        if (partError) throw partError

        console.log('✅ Created direct conversation:', newConv.id)
        return newConv.id
      }

      // If it's a group conversation
      if (participantIds?.length) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            type: 'group',
            name: groupName || 'Group Chat',
            created_by: user.id,
          })
          .select()
          .single()

        if (convError) throw convError

        // Add all participants
        const allParticipants = [...new Set([user.id, ...participantIds])]
        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert(
            allParticipants.map(userId => ({
              conversation_id: newConv.id,
              user_id: userId,
            }))
          )

        if (partError) throw partError

        console.log('✅ Created group conversation:', newConv.id)
        return newConv.id
      }

      throw new Error('Must provide otherUserId or participantIds')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook to mark conversation as read
 */
export function useMarkAsRead() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId) => {
      if (!user?.id || !conversationId) return

      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

