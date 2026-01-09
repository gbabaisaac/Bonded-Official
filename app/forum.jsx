import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useRef, useState } from 'react'
import {
    Alert,
    Animated,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomNav from '../components/BottomNav'
import Chip from '../components/Chip'
import AnonymousMessageButton from '../components/Forum/AnonymousMessageButton'
import PollRenderer from '../components/Forum/PollRenderer'
import PostTags from '../components/Forum/PostTags'
import RepostModal from '../components/Forum/RepostModal'
import ForumSelectorModal from '../components/ForumSelectorModal'
import ForumSwitcher from '../components/ForumSwitcher'
import {
    Add,
    ArrowDownCircle,
    ArrowUpCircle,
    Check,
    ChevronDown,
    EyeOff,
    Heart,
    HeartFill,
    ImageIcon,
    MessageCircle,
    MoreHorizontal,
    Person,
    Repeat,
    Share2,
    Video,
    X
} from '../components/Icons'
import ShareModal from '../components/ShareModal'
import Stories from '../components/Stories/Stories'
import StoryFlow from '../components/Stories/StoryFlow'
import StoryViewer from '../components/Stories/StoryViewer'
import SegmentedControl from '../components/ui/SegmentedControl'
import { useStoriesContext } from '../contexts/StoriesContext'
import { hp, wp } from '../helpers/common'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useCreatePost } from '../hooks/useCreatePost'
import { useComments } from '../hooks/useComments'
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile'
import { useForums } from '../hooks/useForums'
import { usePosts } from '../hooks/usePosts'
import { useUniversities } from '../hooks/useUniversities'
import { useAuthStore } from '../stores/authStore'
import { isSuperAdminEmail } from '../utils/admin'
import { useAppTheme } from './theme'
import { supabase } from '../lib/supabase'
import { uploadImageToBondedMedia } from '../helpers/mediaStorage'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

// All mock data removed - using real Supabase data
// Comments: Loaded from Supabase forum_comments table (TODO: create useComments hook)
// Posts: usePosts hook
// Forums: useForums hook
// Stories: useStories hook

export default function Forum() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  // Posts are now fetched from usePosts hook
  const [activePost, setActivePost] = useState(null)
  const [activeAuthorPost, setActiveAuthorPost] = useState(null)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [postOptionsPost, setPostOptionsPost] = useState(null) // Post for which options menu is shown
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftIsAnon, setDraftIsAnon] = useState(true)
  const [draftMedia, setDraftMedia] = useState([])
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [showPostAsModal, setShowPostAsModal] = useState(false)
  const [selectedTag, setSelectedTag] = useState(null)
  // Mock: Check if user is admin (in real app, this would come from auth context)
  const isAdmin = false
  const [draftTags, setDraftTags] = useState([])
  const [draftPoll, setDraftPoll] = useState(null)
  const [showPollBuilder, setShowPollBuilder] = useState(false)
  const [currentSchool, setCurrentSchool] = useState(params.schoolName || 'University of Rhode Island')
  const [currentForum, setCurrentForum] = useState(null) // Will be set from useForums
  // Filter state removed - no longer needed
  const [tagFilter, setTagFilter] = useState(null) // Filter by specific tag
  const [isForumSelectorVisible, setIsForumSelectorVisible] = useState(false)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [repostPost, setRepostPost] = useState(null)
  const [commentSort, setCommentSort] = useState('best') // 'best', 'new', 'old'
  const [polls, setPolls] = useState({}) // { postId: poll }
  const [pollVotes, setPollVotes] = useState({}) // { pollId: { userId: optionIndex } }
  const [pollResults, setPollResults] = useState({}) // { pollId: { totalVotes, voteCounts } }
  
  // Story state
  const [isStoryFlowVisible, setIsStoryFlowVisible] = useState(false)
  const [isStoryViewerVisible, setIsStoryViewerVisible] = useState(false)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)
  const [viewerStories, setViewerStories] = useState([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareContent, setShareContent] = useState(null)
  const [isCampusSelectorVisible, setIsCampusSelectorVisible] = useState(false)
  const [selectedUniversityId, setSelectedUniversityId] = useState(null)
  
  const { getForumStories } = useStoriesContext()
  const { user } = useAuthStore()
  const isSuperAdmin = isSuperAdminEmail(user?.email)
  const { data: userProfile } = useCurrentUserProfile() // For onboarding check
  
  // Fetch forums
  const { data: forums = [], isLoading: forumsLoading } = useForums()
  const { data: universities = [], isLoading: universitiesLoading } = useUniversities()

  const selectedUniversity = useMemo(
    () => universities.find((u) => u.id === selectedUniversityId) || null,
    [universities, selectedUniversityId]
  )

  const visibleForums = useMemo(() => {
    if (!isSuperAdmin || !selectedUniversityId) return forums
    return forums.filter((forum) => forum.universityId === selectedUniversityId)
  }, [forums, isSuperAdmin, selectedUniversityId])
  
  // Set default forum when forums load (only once when forums first become available)
  React.useEffect(() => {
    if (visibleForums.length > 0 && !currentForum) {
      // Find main campus forum or use first forum
      const mainForum = visibleForums.find(f => f.type === 'campus') || visibleForums[0]
      if (mainForum) {
        console.log('Setting default forum:', mainForum.name, mainForum.id)
        setCurrentForum(mainForum)
      }
    }
  }, [visibleForums]) // Removed currentForum from deps to avoid infinite loops
  
  // Also ensure forum is set if it becomes null (safety check)
  React.useEffect(() => {
    if (visibleForums.length > 0 && currentForum === null) {
      const mainForum = visibleForums.find(f => f.type === 'campus') || visibleForums[0]
      if (mainForum) {
        console.log('Re-setting forum (was null):', mainForum.name, mainForum.id)
        setCurrentForum(mainForum)
      }
    }
  }, [visibleForums, currentForum])

  React.useEffect(() => {
    if (!isSuperAdmin || universities.length === 0 || selectedUniversityId) return
    const fallbackUniversityId = currentForum?.universityId || universities[0]?.id || null
    if (fallbackUniversityId) {
      setSelectedUniversityId(fallbackUniversityId)
    }
  }, [isSuperAdmin, universities, selectedUniversityId, currentForum])

  React.useEffect(() => {
    if (!isSuperAdmin) return
    if (!selectedUniversityId) return
    const mainForum = visibleForums.find(f => f.type === 'campus') || visibleForums[0] || null
    if (mainForum && mainForum.id !== currentForum?.id) {
      setCurrentForum(mainForum)
    }
    if (!mainForum && currentForum) {
      setCurrentForum(null)
    }
  }, [isSuperAdmin, selectedUniversityId, visibleForums, currentForum])
  
  // Fetch posts for current forum with pagination
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePosts(currentForum?.id, { tag: null }) // Tag filtering disabled for V1

  const {
    data: activePostComments = [],
    refetch: refetchComments,
  } = useComments(activePost?.id)

  // Flatten paginated data into a single array
  const posts = useMemo(() => {
    if (!postsData?.pages) return []
    return postsData.pages.flatMap((page) => page.posts || [])
  }, [postsData])

  const loadMorePosts = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // Create post mutation
  const createPostMutation = useCreatePost()
  
  const currentForumId = currentForum?.id || null
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      const { error } = await supabase
        .from('posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('user_id', user?.id) // Ensure user owns the post

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate posts queries to refresh the feed
      queryClient.invalidateQueries({ queryKey: ['posts', currentForumId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setPostOptionsPost(null)
      Alert.alert('Success', 'Post deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting post:', error)
      Alert.alert('Error', error.message || 'Failed to delete post. Please try again.')
    }
  })

  const handleDeletePost = (post) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePostMutation.mutate(post.id)
        }
      ]
    )
  }
  
  // Mock current user - replace with real auth
  const currentUser = {
    id: user?.id || 'user-123',
    name: user?.email?.split('@')[0] || 'User',
    avatar: null,
  }
  
  // Posts are already filtered by forum and tag in the query
  // Just apply sorting if needed
  const allPosts = useMemo(() => {
    if (posts.length === 0) return []
    
    // Posts are already sorted by created_at DESC from query
    // Tag filtering is done in the query
    return posts.map((post) => ({
      ...post,
      type: 'post',
    }))
  }, [posts])
  
  // Update school if params change
  React.useEffect(() => {
    if (params.schoolName) {
      setCurrentSchool(params.schoolName)
    }
  }, [params.schoolName])
  const [isFavorited, setIsFavorited] = useState(false)
  const [comments, setComments] = useState({}) // Comments loaded from Supabase via usePosts hook
  const [newCommentText, setNewCommentText] = useState('')
  const [newCommentIsAnon, setNewCommentIsAnon] = useState(true)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyIsAnon, setReplyIsAnon] = useState(true)
  const [userVotes, setUserVotes] = useState({}) // Track user votes: { 'comment-id': 'up' | 'down' | null }
  const scrollY = useRef(new Animated.Value(0)).current
  const lastScrollY = useRef(0)
  const headerTranslateY = useRef(new Animated.Value(0)).current
  const isAnimating = useRef(false)

  React.useEffect(() => {
    if (!activePost?.id) return
    setComments((prev) => ({
      ...prev,
      [activePost.id]: activePostComments,
    }))
  }, [activePost?.id, activePostComments])

  React.useEffect(() => {
    if (!activePost) return
    const updated = posts.find((post) => post.id === activePost.id)
    if (updated) {
      setActivePost((prev) => (prev ? { ...prev, ...updated } : prev))
    }
  }, [posts, activePost])

  const syncPostCommentCount = async (postId) => {
    if (!postId) return
    const { count, error } = await supabase
      .from('forum_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .is('deleted_at', null)

    if (error) {
      console.error('Error counting comments:', error)
      return
    }

    if (typeof count === 'number') {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ comments_count: count })
        .eq('id', postId)

      if (updateError) {
        console.error('Error syncing comment count:', updateError)
      }
    }
  }

  const syncPostVoteCounts = async (postId) => {
    if (!postId) return
    const { count: upvotes, error: upvoteError } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('reaction_type', 'upvote')

    if (upvoteError) {
      console.error('Error counting upvotes:', upvoteError)
      return
    }

    const { count: downvotes, error: downvoteError } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('reaction_type', 'downvote')

    if (downvoteError) {
      console.error('Error counting downvotes:', downvoteError)
      return
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        upvotes_count: upvotes || 0,
        downvotes_count: downvotes || 0,
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error syncing vote counts:', updateError)
    }
  }

  const updatePostCache = (postId, updater) => {
    queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
      if (!old?.pages) return old
      const pages = old.pages.map((page) => ({
        ...page,
        posts: (page.posts || []).map((post) => (
          post.id === postId ? updater(post) : post
        )),
      }))
      return { ...old, pages }
    })
  }

  const handlePostReaction = async (postId, reactionType) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to vote on posts.')
      return
    }

    const { data: existing, error } = await supabase
      .from('post_reactions')
      .select('id, reaction_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error loading reaction:', error)
      Alert.alert('Error', 'Failed to update vote. Please try again.')
      return
    }

    const currentPost = posts.find((post) => post.id === postId)
    const currentUpvotes = currentPost?.upvotes || 0
    const currentDownvotes = currentPost?.downvotes || 0
    const isSameVote = existing?.reaction_type === reactionType

    let nextUpvotes = currentUpvotes
    let nextDownvotes = currentDownvotes

    if (isSameVote) {
      if (reactionType === 'upvote') {
        nextUpvotes = Math.max(0, currentUpvotes - 1)
      } else {
        nextDownvotes = Math.max(0, currentDownvotes - 1)
      }
    } else if (existing) {
      if (reactionType === 'upvote') {
        nextUpvotes = currentUpvotes + 1
        nextDownvotes = Math.max(0, currentDownvotes - 1)
      } else {
        nextDownvotes = currentDownvotes + 1
        nextUpvotes = Math.max(0, currentUpvotes - 1)
      }
    } else {
      if (reactionType === 'upvote') {
        nextUpvotes = currentUpvotes + 1
      } else {
        nextDownvotes = currentDownvotes + 1
      }
    }

    updatePostCache(postId, (post) => ({
      ...post,
      upvotes: nextUpvotes,
      downvotes: nextDownvotes,
    }))
    setActivePost((prev) => (
      prev && prev.id === postId
        ? { ...prev, upvotes: nextUpvotes, downvotes: nextDownvotes }
        : prev
    ))

    if (isSameVote) {
      const { error: deleteError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        console.error('Error removing reaction:', deleteError)
        Alert.alert('Error', 'Failed to update vote. Please try again.')
        return
      }
    } else if (existing) {
      const { error: updateError } = await supabase
        .from('post_reactions')
        .update({ reaction_type: reactionType })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error updating reaction:', updateError)
        Alert.alert('Error', 'Failed to update vote. Please try again.')
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from('post_reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        })

      if (insertError) {
        console.error('Error inserting reaction:', insertError)
        Alert.alert('Error', 'Failed to update vote. Please try again.')
        return
      }
    }

    await syncPostVoteCounts(postId)
    await refetchPosts()
  }

  const getCommentCounts = (commentId, parentId = null) => {
    if (!activePost?.id) {
      return { upvotes: 0, downvotes: 0 }
    }
    const postComments = comments[activePost.id] || []
    if (!parentId) {
      const match = postComments.find((comment) => comment.id === commentId)
      return {
        upvotes: match?.upvotes || 0,
        downvotes: match?.downvotes || 0,
      }
    }
    const parent = postComments.find((comment) => comment.id === parentId)
    const reply = parent?.replies?.find((item) => item.id === commentId)
    return {
      upvotes: reply?.upvotes || 0,
      downvotes: reply?.downvotes || 0,
    }
  }

  const handleCommentVote = async (commentId, parentId = null, direction = 'up') => {
    if (!user?.id || !activePost?.id) {
      Alert.alert('Sign in required', 'Please sign in to like comments.')
      return
    }

    const voteKey = parentId ? `${parentId}-${commentId}` : commentId
    const currentVote = userVotes[voteKey]
    const newVote = currentVote === direction ? null : direction
    const currentCounts = getCommentCounts(commentId, parentId)
    let nextUpvotes = currentCounts.upvotes
    let nextDownvotes = currentCounts.downvotes

    if (currentVote === direction) {
      if (direction === 'up') {
        nextUpvotes = Math.max(0, currentCounts.upvotes - 1)
      } else {
        nextDownvotes = Math.max(0, currentCounts.downvotes - 1)
      }
    } else if (currentVote) {
      if (direction === 'up') {
        nextUpvotes = currentCounts.upvotes + 1
        nextDownvotes = Math.max(0, currentCounts.downvotes - 1)
      } else {
        nextDownvotes = currentCounts.downvotes + 1
        nextUpvotes = Math.max(0, currentCounts.upvotes - 1)
      }
    } else {
      if (direction === 'up') {
        nextUpvotes = currentCounts.upvotes + 1
      } else {
        nextDownvotes = currentCounts.downvotes + 1
      }
    }

    setUserVotes((prev) => ({ ...prev, [voteKey]: newVote }))
    setComments((prev) => ({
      ...prev,
      [activePost.id]: (prev[activePost.id] || []).map((comment) => {
        if (parentId && comment.id === parentId) {
          return {
            ...comment,
            replies: (comment.replies || []).map((reply) => (
              reply.id === commentId
                ? { ...reply, upvotes: nextUpvotes, downvotes: nextDownvotes }
                : reply
            )),
          }
        }
        if (!parentId && comment.id === commentId) {
          return { ...comment, upvotes: nextUpvotes, downvotes: nextDownvotes }
        }
        return comment
      }),
    }))

    const { error } = await supabase
      .from('forum_comments')
      .update({ upvotes_count: nextUpvotes, downvotes_count: nextDownvotes })
      .eq('id', commentId)

    if (error) {
      console.error('Error updating comment like:', error)
      Alert.alert('Error', 'Failed to update like. Please try again.')
      await refetchComments()
      return
    }

    await refetchComments()
  }

  const submitComment = async ({ postId, parentId = null, body, isAnonymous, tempId = null }) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to comment.')
      return false
    }

    const { data, error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        parent_id: parentId,
        body,
        is_anonymous: isAnonymous,
      })
      .select(`
        id,
        post_id,
        user_id,
        parent_id,
        body,
        is_anonymous,
        upvotes_count,
        downvotes_count,
        created_at
      `)
      .single()

    if (error) {
      console.error('Error posting comment:', error)
      Alert.alert('Error', 'Failed to post comment. Please try again.')
      await refetchComments()
      return false
    }

    if (data?.id) {
      const authorLabel = isAnonymous ? 'Anonymous' : currentUser.name
      const savedComment = {
        id: data.id,
        author: authorLabel,
        isAnon: isAnonymous,
        body: data.body,
        upvotes: data.upvotes_count || 0,
        downvotes: data.downvotes_count || 0,
        timeAgo: getTimeAgo(data.created_at),
        replies: [],
      }

      setComments((prev) => {
        const postComments = prev[postId] || []
        const filtered = tempId
          ? postComments.filter((comment) => comment.id !== tempId)
          : postComments
        return {
          ...prev,
          [postId]: parentId
            ? filtered.map((comment) => (
              comment.id === parentId
                ? { ...comment, replies: [...(comment.replies || []), savedComment] }
                : comment
            ))
            : [...filtered, savedComment],
        }
      })
    }

    if (tempId) {
      pendingCommentIds.current[postId] = (
        pendingCommentIds.current[postId] || []
      ).filter((item) => item.id !== tempId)
    }

    await syncPostCommentCount(postId)
    await refetchComments()
    await refetchPosts()
    return true
  }

  const handlePickMedia = async (kind) => {
    try {
      console.log(`Picking ${kind}...`)
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        console.log('Permission not granted')
        Alert.alert('Permission Required', 'Please grant access to your media library to select images or videos.')
        return
      }

      const mediaType = kind === 'image' 
        ? ImagePicker.MediaTypeOptions.Images 
        : ImagePicker.MediaTypeOptions.Videos

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType,
        allowsEditing: false,
        quality: 0.7,
        allowsMultipleSelection: false,
      })

      if (result.canceled) {
        console.log('User canceled media picker')
        return
      }

      const asset = result.assets?.[0]
      if (!asset) {
        console.log('No asset selected')
        return
      }

      console.log('Media selected:', asset.uri)
      setDraftMedia((prev) => [
        ...prev,
        {
          uri: asset.uri,
          type: kind,
        },
      ])
    } catch (error) {
      console.error('Media pick error:', error)
      Alert.alert('Error', 'Failed to pick media. Please try again.')
    }
  }

  const uploadPostMedia = async (postId) => {
    if (!postId || draftMedia.length === 0 || !user?.id) return []

    // TODO: Add video support once bonded-media allows videos.
    // TODO: Align post media ownership with public.media schema (post linkage).
    const imageMedia = draftMedia.filter((media) => media.type === 'image')
    if (imageMedia.length === 0) return []

    const uploads = await Promise.all(
      imageMedia.map(async (media) => {
        const result = await uploadImageToBondedMedia({
          fileUri: media.uri,
          mediaType: 'post',
          ownerType: 'user',
          ownerId: user.id,
          userId: user.id,
          postId,
        })
        return result?.path || null
      })
    )

    return uploads.filter(Boolean)
  }

  const handleCreateStory = () => {
    setIsStoryFlowVisible(true)
  }

  const handleViewStory = (storyGroup) => {
    // Get all story groups for this forum
    const rawStories = getForumStories(currentForumId)
    const groupedStories = {}
    rawStories.forEach((story) => {
      if (!groupedStories[story.userId]) {
        groupedStories[story.userId] = {
          id: story.userId,
          userId: story.userId,
          name: story.userName,
          thumbnail: story.userAvatar,
          forumId: currentForumId,
          segments: [],
        }
      }
      groupedStories[story.userId].segments.push(story)
    })
    const stories = Object.values(groupedStories)
    const index = stories.findIndex((s) => s.id === storyGroup.id)

    setViewerStories(stories)
    setSelectedStoryIndex(index >= 0 ? index : 0)
    setIsStoryViewerVisible(true)
  }

  const renderStory = (story, isFirst) => {
    if (isFirst) {
      return (
        <TouchableOpacity
          key="add-story"
          style={styles.storyItem}
          activeOpacity={0.8}
        >
          <View style={[styles.storyAvatar, styles.storyAddAvatar]}>
            <Add
              size={hp(3)}
              color={theme.colors.textSecondary}
              strokeWidth={2.5}
            />
          </View>
          <Text style={styles.storyLabel}>New</Text>
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        key={story.id}
        style={styles.storyItem}
        activeOpacity={0.8}
      >
        <View style={styles.storyAvatar}>
          <Text style={styles.storyAvatarText}>
            {story.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.storyLabel}>
          {story.name}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderPost = ({ item }) => {
    // Render event post differently
    if (item.type === 'event' && item.event) {
      return <EventPost event={item.event} forumId={currentForumId} />
    }

    // Regular post
    return (
      <View style={styles.postCard}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setActivePost(item)}
        >
          {/* Header */}
          <View style={styles.postHeader}>
      <TouchableOpacity
        style={styles.postAuthorRow}
        activeOpacity={0.8}
        onPress={() => setActiveAuthorPost(item)}
      >
              <LinearGradient
                colors={item.isAnon 
                  ? ['#A855F7', '#9333EA'] 
                  : [theme.colors.textSecondary, theme.colors.textSecondary + 'DD']
                }
                style={styles.postAvatar}
              >
          <Text style={styles.postAvatarText}>
            {item.isAnon ? '?' : item.author.charAt(0).toUpperCase()}
          </Text>
              </LinearGradient>
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>
            {item.isAnon ? 'Anonymous' : item.author}
          </Text>
          <Text style={styles.postMetaText}>
            {item.forum} • {item.timeAgo}
          </Text>
        </View>
      </TouchableOpacity>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation()
            setPostOptionsPost(item)
          }}
        >
          <MoreHorizontal
                size={hp(2.2)}
                color={theme.colors.textSecondary}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

        {/* Content */}
        <View style={styles.postBody}>
            {item.title && (
          <Text style={styles.postTitle}>{item.title}</Text>
            )}
          <Text numberOfLines={3} style={styles.postBodyText}>
            {item.body}
          </Text>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
              <View style={styles.postTagsContainer}>
            <PostTags tags={item.tags} maxDisplay={2} />
              </View>
          )}

          {/* Poll */}
          {polls[item.id] && (
              <View style={styles.postPollContainer}>
            <PollRenderer
              poll={polls[item.id]}
              userVote={pollVotes[polls[item.id].poll_id]?.[currentUser.id]}
              onVote={(optionIndex) => {
                const pollId = polls[item.id].poll_id
                setPollVotes((prev) => ({
                  ...prev,
                  [pollId]: {
                    ...(prev[pollId] || {}),
                    [currentUser.id]: optionIndex,
                  },
                }))
                // Update results
                setPollResults((prev) => {
                  const current = prev[pollId] || { totalVotes: 0, voteCounts: [] }
                  const newCounts = [...(current.voteCounts || [])]
                  newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1
                  return {
                    ...prev,
                    [pollId]: {
                      totalVotes: current.totalVotes + 1,
                      voteCounts: newCounts,
                    },
                  }
                })
              }}
              totalVotes={pollResults[polls[item.id].poll_id]?.totalVotes || 0}
              voteCounts={pollResults[polls[item.id].poll_id]?.voteCounts || []}
            />
              </View>
          )}

          {item.media && item.media.length > 0 && (
            <View style={styles.postMediaPreview}>
              {item.media[0].type === 'image' ? (
                <Image
                  source={{ uri: item.media[0].uri }}
                  style={styles.postMediaImage}
                />
              ) : (
                <View style={styles.postMediaVideo}>
                  <Video
                      size={hp(3.5)}
                    color={theme.colors.white}
                    strokeWidth={2}
                    fill={theme.colors.white}
                  />
                  <Text style={styles.postMediaVideoText}>Video</Text>
                </View>
              )}
            </View>
          )}
        </View>
        </TouchableOpacity>

        {/* Actions - Compact Row */}
        <View style={styles.postActionsRow}>
        <View style={styles.postVotesRow}>
          <TouchableOpacity
            style={styles.voteButton}
            activeOpacity={0.7}
            onPress={async () => {
              await handlePostReaction(item.id, 'upvote')
            }}
          >
            <ArrowUpCircle
                size={hp(2.4)}
                color={item.upvotes > 0 ? theme.statusColors.success : theme.colors.textSecondary}
              strokeWidth={2}
              fill={item.upvotes > 0 ? '#2ecc71' : 'none'}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.postVoteCount,
              item.upvotes > 0 && styles.postVotePositive,
              item.upvotes < 0 && styles.postVoteNegative,
            ]}
          >
            {item.upvotes}
          </Text>
          <TouchableOpacity
            style={styles.voteButton}
            activeOpacity={0.7}
            onPress={async () => {
              await handlePostReaction(item.id, 'downvote')
            }}
          >
            <ArrowDownCircle
                size={hp(2.4)}
                color={item.upvotes < 0 ? theme.statusColors.error : theme.colors.textSecondary}
              strokeWidth={2}
              fill={item.upvotes < 0 ? '#e74c3c' : 'none'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
            style={styles.postActionButton}
          activeOpacity={0.7}
          onPress={() => setActivePost(item)}
        >
          <MessageCircle
              size={hp(2)}
              color={theme.colors.textSecondary}
            strokeWidth={2}
          />
            {item.commentsCount > 0 && (
              <Text style={styles.postActionText}>{item.commentsCount}</Text>
            )}
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.postActionButton}
          activeOpacity={0.7}
          onPress={() => {
            setRepostPost(item)
            setShowRepostModal(true)
          }}
        >
          <Repeat
              size={hp(2)}
              color={theme.colors.textSecondary}
            strokeWidth={2}
          />
          {item.repostsCount > 0 && (
              <Text style={styles.postActionText}>{item.repostsCount}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.postActionButton}
          activeOpacity={0.7}
          onPress={() => {
            setShareContent({
              type: 'post',
              data: item,
            })
            setShowShareModal(true)
          }}
        >
          <Share2
              size={hp(2)}
              color={theme.colors.textSecondary}
            strokeWidth={2}
          />
        </TouchableOpacity>
        </View>
      </View>
    )
  }

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  )

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      {/* Forum Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/profile')}
          activeOpacity={0.6}
        >
          <Person size={hp(2.8)} color={theme.colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <ForumSwitcher
            currentForum={currentForum}
            onPress={() => setIsForumSelectorVisible(true)}
            unreadCount={visibleForums.reduce((sum, f) => sum + (f.unreadCount || 0), 0)}
          />
        </View>

        <View style={styles.headerRight}>
          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.campusSelectorButton}
              onPress={() => setIsCampusSelectorVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.campusSelectorText} numberOfLines={1}>
                {selectedUniversity?.name || 'Select Campus'}
              </Text>
              <ChevronDown size={hp(1.6)} color={theme.colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>



      {/* Stories */}
      <View style={styles.storiesWrapper}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.08)', 'transparent']}
          style={styles.storiesGradient}
        >
          <Stories
            forumId={currentForumId}
            onCreateStory={handleCreateStory}
            onViewStory={handleViewStory}
            currentUserId={currentUser.id}
          />
        </LinearGradient>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {(!currentForumId && !forumsLoading) ? (
          <View style={styles.emptyForumState}>
            <Text style={styles.emptyForumStateTitle}>No forums yet for this campus</Text>
            <Text style={styles.emptyForumStateText}>
              This campus needs a default forum before posts can appear.
            </Text>
          </View>
        ) : (forumsLoading || postsLoading) ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : postsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load posts. Please try again.</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetchPosts()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <AnimatedFlatList
            data={allPosts}
            keyExtractor={(item) => item.id || item.event?.id}
            contentContainerStyle={styles.postsList}
            showsVerticalScrollIndicator={false}
            renderItem={renderPost}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={renderListHeader}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.colors.textPrimary }]}>
                  {'No posts yet. Be the first to post!'}
                </Text>
                {(
                  <TouchableOpacity
                    style={[styles.createFirstPostButton, { backgroundColor: theme.colors.accent }]}
                    onPress={() => setIsCreateModalVisible(true)}
                  >
                    <Text style={styles.createFirstPostButtonText}>Create Post</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={{ padding: hp(2), alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.textSecondary }}>Loading more posts...</Text>
                </View>
              ) : null
            }
          />
        )}


        {/* Post / Comments Modal Shell */}
        <Modal
          visible={!!activePost}
          transparent
          animationType="slide"
          onRequestClose={() => setActivePost(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setActivePost(null)}
          >
            <Pressable
              style={styles.postModalContent}
              onPress={(e) => e.stopPropagation()}
            >
              {activePost && (
                <>
                  <View style={styles.postModalHeader}>
                    <Text style={styles.postModalTitle} numberOfLines={2}>
                      {activePost.title || activePost.body?.slice(0, 50)}
                      {!activePost.title && activePost.body?.length > 50 && '...'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActivePost(null)}
                      style={styles.modalCloseButton}
                    >
                      <X
                        size={hp(2.6)}
                        color={theme.colors.textPrimary}
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.postModalMeta}>
                    {activePost.isAnon ? 'Anonymous' : activePost.author} • {activePost.forum} • {activePost.timeAgo}
                  </Text>

                  <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                  >
                    <ScrollView
                      style={styles.postModalBody}
                      contentContainerStyle={styles.postModalBodyContent}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                      scrollEnabled={true}
                      bounces={true}
                      keyboardDismissMode="interactive"
                    >
                      <Text style={styles.postModalBodyText}>
                        {activePost.body}
                      </Text>

                      <View style={styles.commentsSection}>
                        <View style={styles.commentsHeader}>
                          <Text style={styles.commentsTitle}>
                            Comments {activePost.commentsCount > 0 && (
                              <Text style={styles.commentsCount}>({activePost.commentsCount})</Text>
                            )}
                          </Text>
                          <SegmentedControl
                            options={[
                              { label: 'Best', value: 'best' },
                              { label: 'New', value: 'new' },
                            ]}
                            value={commentSort}
                            onChange={setCommentSort}
                            style={styles.sortSegmented}
                          />
                        </View>
                      </View>

                      {/* Comments list */}
                      {comments[activePost.id] && comments[activePost.id].length > 0 ? (
                        <View style={styles.commentsList}>
                          {(() => {
                            let sortedComments = [...comments[activePost.id]]
                            if (commentSort === 'new') {
                              sortedComments.sort((a, b) => {
                                // Sort by timeAgo (newest first) - simplified
                                return b.timeAgo.localeCompare(a.timeAgo)
                              })
                            } else if (commentSort === 'old') {
                              sortedComments.sort((a, b) => {
                                return a.timeAgo.localeCompare(b.timeAgo)
                              })
                            } else {
                              // Best: sort by upvotes - downvotes
                              sortedComments.sort((a, b) => {
                                const scoreA = (a.upvotes || 0) - (a.downvotes || 0)
                                const scoreB = (b.upvotes || 0) - (b.downvotes || 0)
                                return scoreB - scoreA
                              })
                            }
                            return sortedComments
                          })().map((comment) => (
                            <View key={comment.id} style={styles.commentCard}>
                                <View style={styles.commentAvatar}>
                                  <Text style={styles.commentAvatarText}>
                                    {comment.isAnon ? '?' : comment.author.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                              <View style={{ flex: 1 }}>
                                <View style={styles.commentHeader}>
                                  <Text style={styles.commentAuthorName}>
                                    {comment.isAnon ? 'Anonymous' : comment.author}
                                  </Text>
                                  <Text style={styles.commentMetaText}>
                                    {comment.timeAgo}
                                  </Text>
                            </View>
                            <Text style={styles.commentBody}>{comment.body}</Text>
                            <View style={styles.commentActions}>
                                <TouchableOpacity
                                    style={styles.commentLikeButton}
                                  activeOpacity={0.7}
                                  onPress={async () => {
                                    await handleCommentVote(comment.id, null, 'up')
                                  }}
                                >
                                    {userVotes[comment.id] === 'up' ? (
                                      <HeartFill size={hp(1.8)} color={theme.colors.info} strokeWidth={2} />
                                    ) : (
                                      <Heart size={hp(1.8)} color={theme.colors.textSecondary} strokeWidth={2} />
                                    )}
                                    {(comment.upvotes - (comment.downvotes || 0)) !== 0 && (
                                      <Text style={[
                                        styles.commentLikeText,
                                        userVotes[comment.id] === 'up' && styles.commentLikeTextActive
                                      ]}>
                                        {comment.upvotes - (comment.downvotes || 0)}
                                </Text>
                                    )}
                                    <Text style={[
                                      styles.commentLikeLabel,
                                      userVotes[comment.id] === 'up' && styles.commentLikeLabelActive
                                    ]}>
                                      Up
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.commentLikeButton}
                                  activeOpacity={0.7}
                                  onPress={async () => {
                                    await handleCommentVote(comment.id, null, 'down')
                                  }}
                                >
                                  <ArrowDownCircle
                                    size={hp(1.8)}
                                    color={userVotes[comment.id] === 'down' ? theme.statusColors.error : theme.colors.textSecondary}
                                    strokeWidth={2}
                                  />
                                  <Text style={[
                                    styles.commentLikeLabel,
                                    userVotes[comment.id] === 'down' && styles.commentLikeLabelActive
                                  ]}>
                                    Down
                                  </Text>
                                </TouchableOpacity>
                              <TouchableOpacity
                                    style={styles.commentReplyButton}
                                activeOpacity={0.7}
                                onPress={() => setReplyingTo(comment.id)}
                              >
                                    <Text style={styles.commentReplyText}>Reply</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <View style={styles.repliesContainer}>
                                {comment.replies.map((reply) => (
                                  <View key={reply.id} style={styles.replyCard}>
                                        <View style={styles.replyAvatar}>
                                          <Text style={styles.replyAvatarText}>
                                            {reply.isAnon ? '?' : reply.author.charAt(0).toUpperCase()}
                                          </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                          <View style={styles.replyHeader}>
                                          <Text style={styles.replyAuthorName}>
                                            {reply.isAnon ? 'Anonymous' : reply.author}
                                          </Text>
                                          <Text style={styles.replyMetaText}>
                                            {reply.timeAgo}
                                          </Text>
                                    </View>
                                    <Text style={styles.replyBody}>{reply.body}</Text>
                                    <View style={styles.replyActions}>
                                        <TouchableOpacity
                                              style={styles.commentLikeButton}
                                          activeOpacity={0.7}
                                          onPress={async () => {
                                            await handleCommentVote(reply.id, comment.id, 'up')
                                          }}
                                        >
                                              {userVotes[`${comment.id}-${reply.id}`] === 'up' ? (
                                                <HeartFill size={hp(1.6)} color={theme.colors.info} strokeWidth={2} />
                                              ) : (
                                                <Heart size={hp(1.6)} color={theme.colors.textSecondary} strokeWidth={2} />
                                              )}
                                              {(reply.upvotes - (reply.downvotes || 0)) !== 0 && (
                                                <Text style={[
                                                  styles.commentLikeText,
                                                  { fontSize: hp(1.3) },
                                                  userVotes[`${comment.id}-${reply.id}`] === 'up' && styles.commentLikeTextActive
                                                ]}>
                                                  {reply.upvotes - (reply.downvotes || 0)}
                                        </Text>
                                              )}
                                              <Text style={[
                                                styles.commentLikeLabel,
                                                { fontSize: hp(1.3) },
                                                userVotes[`${comment.id}-${reply.id}`] === 'up' && styles.commentLikeLabelActive
                                              ]}>
                                                Up
                                              </Text>
                                            </TouchableOpacity>
                                        <TouchableOpacity
                                              style={styles.commentLikeButton}
                                          activeOpacity={0.7}
                                          onPress={async () => {
                                            await handleCommentVote(reply.id, comment.id, 'down')
                                          }}
                                        >
                                          <ArrowDownCircle
                                            size={hp(1.6)}
                                            color={userVotes[`${comment.id}-${reply.id}`] === 'down' ? theme.statusColors.error : theme.colors.textSecondary}
                                            strokeWidth={2}
                                          />
                                          <Text style={[
                                            styles.commentLikeLabel,
                                            { fontSize: hp(1.3) },
                                            userVotes[`${comment.id}-${reply.id}`] === 'down' && styles.commentLikeLabelActive
                                          ]}>
                                            Down
                                          </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                              style={styles.commentReplyButton}
                                          activeOpacity={0.7}
                                          onPress={() => {
                                                // TODO: Implement reply to reply
                                              }}
                                            >
                                              <Text style={[styles.commentReplyText, { fontSize: hp(1.3) }]}>Reply</Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Reply input */}
                            {replyingTo === comment.id && (
                              <View style={styles.replyInputContainer}>
                                <TextInput
                                  style={styles.replyInput}
                                  placeholder="Write a reply..."
                                      placeholderTextColor={theme.colors.textSecondary}
                                  value={replyText}
                                  onChangeText={setReplyText}
                                  multiline
                                />
                                <View style={styles.replyInputActions}>
                                  <TouchableOpacity
                                    style={[
                                      styles.anonPillSmall,
                                      replyIsAnon && styles.anonPillActiveSmall,
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => setReplyIsAnon((prev) => !prev)}
                                  >
                                    {replyIsAnon ? (
                                      <EyeOff
                                        size={hp(1.6)}
                                        color={theme.colors.white}
                                        strokeWidth={2}
                                        style={{ marginRight: wp(1) }}
                                      />
                                    ) : (
                                      <Person
                                        size={hp(1.6)}
                                        color={theme.colors.textSecondary}
                                        strokeWidth={2}
                                        style={{ marginRight: wp(1) }}
                                      />
                                    )}
                                    <Text
                                      style={[
                                        styles.anonPillTextSmall,
                                        replyIsAnon && { color: theme.colors.white },
                                      ]}
                                    >
                                      {replyIsAnon ? 'Anon' : 'Name'}
                                    </Text>
                                  </TouchableOpacity>
                                  <View style={styles.replyInputButtons}>
                                    <TouchableOpacity
                                      style={styles.replyCancelButton}
                                      activeOpacity={0.8}
                                      onPress={() => {
                                        setReplyingTo(null)
                                        setReplyText('')
                                        setReplyIsAnon(true)
                                      }}
                                    >
                                      <Text style={styles.replyCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[
                                        styles.replySubmitButton,
                                        !replyText.trim() && styles.replySubmitButtonDisabled,
                                      ]}
                                      activeOpacity={0.8}
                                      onPress={async () => {
                                        if (!replyText.trim()) return
                                        const body = replyText.trim()
                                        const newReply = {
                                          id: `reply-${comment.id}-${Date.now()}`,
                                          author: replyIsAnon ? 'Anon' : 'You',
                                          isAnon: replyIsAnon,
                                          body,
                                          upvotes: 0,
                                          downvotes: 0,
                                          timeAgo: 'now',
                                        }
                                        setComments((prev) => ({
                                          ...prev,
                                          [activePost.id]: prev[activePost.id].map((c) =>
                                            c.id === comment.id
                                              ? { ...c, replies: [...(c.replies || []), newReply] }
                                              : c
                                          ),
                                        }))
                                        setReplyingTo(null)
                                        setReplyText('')
                                        setReplyIsAnon(true)
                                        const success = await submitComment({
                                          postId: activePost.id,
                                          parentId: comment.id,
                                          body,
                                          isAnonymous: replyIsAnon,
                                        })
                                        if (success) {
                                          setActivePost((prev) => (
                                            prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev
                                          ))
                                        }
                                      }}
                                    >
                                      <Text style={styles.replySubmitText}>Reply</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>
                            )}
                              </View>
                          </View>
                            ))}
                          </View>
                        ) : (
                          <View style={styles.emptyCommentsBox}>
                            <Text style={styles.emptyCommentsText}>
                              No comments yet. Be the first to comment!
                            </Text>
                          </View>
                        )}
                    </ScrollView>

                    {/* New comment input - Fixed at bottom */}
                    <View style={styles.newCommentContainer}>
                    <TextInput
                      style={styles.newCommentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor={theme.colors.softBlack}
                      value={newCommentText}
                      onChangeText={setNewCommentText}
                      multiline
                    />
                    <View style={styles.newCommentActions}>
                      <TouchableOpacity
                        style={[
                          styles.anonPillSmall,
                          newCommentIsAnon && styles.anonPillActiveSmall,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setNewCommentIsAnon((prev) => !prev)}
                      >
                        {newCommentIsAnon ? (
                          <EyeOff
                            size={hp(1.6)}
                            color={theme.colors.white}
                            strokeWidth={2}
                            style={{ marginRight: wp(1) }}
                          />
                        ) : (
                          <Person
                            size={hp(1.6)}
                            color={theme.colors.bondedPurple}
                            strokeWidth={2}
                            style={{ marginRight: wp(1) }}
                          />
                        )}
                        <Text
                          style={[
                            styles.anonPillTextSmall,
                            newCommentIsAnon && { color: theme.colors.white },
                          ]}
                        >
                          {newCommentIsAnon ? 'Anon' : 'Name'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.commentSubmitButton,
                          !newCommentText.trim() && styles.commentSubmitButtonDisabled,
                        ]}
                        activeOpacity={0.8}
                        onPress={async () => {
                          if (!newCommentText.trim()) return
                          const body = newCommentText.trim()
                          const tempId = `temp-comment-${activePost.id}-${Date.now()}`
                          const newComment = {
                            id: tempId,
                            author: newCommentIsAnon ? 'Anon' : 'You',
                            isAnon: newCommentIsAnon,
                            body,
                            upvotes: 0,
                            downvotes: 0,
                            timeAgo: 'now',
                            replies: [],
                          }
                          setComments((prev) => ({
                            ...prev,
                            [activePost.id]: [...(prev[activePost.id] || []), newComment],
                          }))
                          pendingCommentIds.current[activePost.id] = [
                            ...(pendingCommentIds.current[activePost.id] || []),
                            newComment,
                          ]
                          setNewCommentText('')
                          setNewCommentIsAnon(true)
                          Keyboard.dismiss()
                          const success = await submitComment({
                            postId: activePost.id,
                            body,
                            isAnonymous: newCommentIsAnon,
                            tempId,
                          })
                          if (!success) {
                            pendingCommentIds.current[activePost.id] = (
                              pendingCommentIds.current[activePost.id] || []
                            ).filter((item) => item.id !== tempId)
                          }
                          if (success) {
                            setActivePost((prev) => (
                              prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev
                            ))
                          }
                        }}
                      >
                        <Text style={styles.commentSubmitText}>Post</Text>
                      </TouchableOpacity>
                    </View>
                    </View>
                  </KeyboardAvoidingView>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Author Profile Modal */}
        <Modal
          visible={!!activeAuthorPost}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveAuthorPost(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setActiveAuthorPost(null)}
          >
            <Pressable
              style={styles.profileModalContent}
              onPress={(e) => e.stopPropagation()}
            >
              {activeAuthorPost && (
                <>
                  <View style={styles.profileModalHeader}>
                    <View style={styles.profileModalHeaderText}>
                      <Text style={styles.profileName}>
                        {activeAuthorPost.isAnon
                          ? 'Anonymous'
                          : activeAuthorPost.author}
                      </Text>
                      <Text style={styles.profileSubText}>
                        {activeAuthorPost.forum} • {activeAuthorPost.timeAgo}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveAuthorPost(null)}
                      style={styles.modalCloseButton}
                    >
                      <X
                        size={hp(2.6)}
                        color={theme.colors.textPrimary}
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.profileBody}>
                    <View style={styles.profileAvatarLarge}>
                      <Text style={styles.profileAvatarLargeText}>
                        {activeAuthorPost.isAnon
                          ? '?'
                          : activeAuthorPost.author.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.profileMetaRow}>
                      <View style={styles.profileMetaPill}>
                        <MessageCircle
                          size={hp(1.8)}
                          color={theme.colors.info}
                          strokeWidth={2}
                          style={{ marginRight: wp(1) }}
                        />
                        <Text style={styles.profileMetaPillText}>
                          {(activeAuthorPost.upvotes || 0) - (activeAuthorPost.downvotes || 0)} karma
                        </Text>
                      </View>
                    </View>

                    <View style={styles.profileSection}>
                      <Text style={styles.profileSectionLabel}>Recent post</Text>
                      <Text style={styles.profileQuote}>
                        {activeAuthorPost.title}
                      </Text>
                    </View>

                    <View style={styles.profileActions}>
                      <AnonymousMessageButton
                        userId={activeAuthorPost.authorId || 'user-123'}
                        userName={activeAuthorPost.isAnon ? 'Anonymous' : activeAuthorPost.author}
                        onSendMessage={async (messageData) => {
                          // TODO: Implement actual anonymous message sending
                          console.log('Sending anonymous message:', messageData)
                        }}
                      />
                      <TouchableOpacity
                        style={[
                          styles.profileButton,
                          styles.profilePrimaryButton,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Person
                          size={hp(2)}
                          color={theme.colors.white}
                          strokeWidth={2}
                          style={{ marginRight: wp(1.5) }}
                        />
                        <Text style={styles.profilePrimaryText}>Connect</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Post Options Modal - Bottom Sheet Style */}
        <Modal
          visible={!!postOptionsPost}
          transparent
          animationType="slide"
          onRequestClose={() => setPostOptionsPost(null)}
        >
          <Pressable
            style={styles.postOptionsOverlay}
            onPress={() => setPostOptionsPost(null)}
          >
            <Pressable
              style={styles.postOptionsBottomSheet}
              onPress={(e) => e.stopPropagation()}
            >
              {postOptionsPost && (
                <>
                  {/* Drag Handle */}
                  <View style={styles.postOptionsHandle} />
                  
                  {/* Options List */}
                  <View style={styles.postOptionsList}>
                    {postOptionsPost.userId === currentUser.id && (
                      <TouchableOpacity
                        style={styles.postOptionItem}
                        onPress={() => {
                          setPostOptionsPost(null)
                          handleDeletePost(postOptionsPost)
                        }}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.postOptionTextDanger}>
                          Delete Post
                        </Text>
                      </TouchableOpacity>
                    )}
                    {postOptionsPost.userId !== currentUser.id && (
                      <TouchableOpacity
                        style={styles.postOptionItem}
                        onPress={() => {
                          setPostOptionsPost(null)
                          // TODO: Implement report functionality
                          Alert.alert('Report', 'Report functionality coming soon')
                        }}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.postOptionText}>
                          Report Post
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Cancel Button */}
                  <TouchableOpacity
                    style={styles.postOptionsCancel}
                    onPress={() => setPostOptionsPost(null)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.postOptionsCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* New Post Modal - Fizz Style */}
        <Modal
          visible={isCreateModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsCreateModalVisible(false)}
          presentationStyle="pageSheet"
        >
          <View style={styles.fizzModalWrapper}>
            <SafeAreaView style={styles.fizzModalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
            <KeyboardAvoidingView
              style={styles.fizzModalContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
              {/* Header */}
              <View style={[styles.fizzModalHeader, { paddingTop: Math.max(insets.top, hp(2)) }]}>
                <TouchableOpacity
                  onPress={() => setIsCreateModalVisible(false)}
                  activeOpacity={0.8}
                  style={styles.fizzHeaderButton}
                >
                  <X size={hp(2.5)} color={theme.colors.textPrimary} strokeWidth={2.5} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss()
                    setShowPostAsModal(true)
                  }}
                  activeOpacity={0.8}
                  style={styles.fizzHeaderCenter}
                >
                  {/* Show current forum name */}
                  {currentForum && (
                    <Text style={[styles.fizzModalTitle, { fontSize: hp(1.4), color: theme.colors.textSecondary, marginBottom: hp(0.3) }]} numberOfLines={1}>
                      {currentForum.name}
                    </Text>
                  )}
                  <View style={styles.fizzAnonymousRow}>
                    <View style={styles.fizzAnonymousIcon}>
                      <Person size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.fizzAnonymousText}>
                      {draftIsAnon ? 'Anonymous' : 'Your Name'}
                    </Text>
                    <ChevronDown size={hp(1.8)} color={theme.colors.textPrimary} strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!draftBody.trim() || createPostMutation.isPending}
                  onPress={async () => {
                    console.log('Post button pressed')
                    console.log('draftBody:', draftBody)
                    console.log('currentForum:', currentForum)
                    console.log('currentForumId:', currentForum?.id)
                    console.log('forums available:', visibleForums.length)
                    
                    if (!draftBody.trim()) {
                      Alert.alert('Required', 'Please enter a post body')
                      setIsCreateModalVisible(false)
                      return
                    }

                    // Use the currently viewed forum - this should always be set
                    let forumToUse = currentForum
                    let forumIdToUse = currentForum?.id
                    
                    // If somehow currentForum is still null, try to get it from forums
                    if (!forumToUse && visibleForums.length > 0) {
                      // Auto-select default forum if none selected
                      forumToUse = visibleForums.find(f => f.type === 'campus') || visibleForums[0]
                      if (forumToUse) {
                        console.log('Auto-selecting forum:', forumToUse.name, forumToUse.id)
                        setCurrentForum(forumToUse)
                        forumIdToUse = forumToUse.id
                      }
                    }
                    
                    if (!forumIdToUse) {
                      console.error('No forum selected and no forums available')
                      Alert.alert('Error', 'Please select a forum first')
                      return
                    }
                    
                    console.log('Using forum for post:', forumToUse.name, forumIdToUse)

                    try {
                      console.log('Creating post with data:', {
                        forumId: forumIdToUse,
                        body: draftBody.trim(),
                        isAnonymous: draftIsAnon,
                      })
                      
                      // Extract media URLs from draftMedia
                      const mediaUrls = []
                      
                      // Prepare tags array
                      const tags = draftTags.length > 0 
                        ? draftTags 
                        : (selectedTag ? [selectedTag] : [])

                      // Create the post
                      const result = await createPostMutation.mutateAsync({
                        forumId: forumIdToUse,
                        title: draftTitle.trim() || null,
                        body: draftBody.trim(),
                        tags,
                        mediaUrls,
                        isAnonymous: draftIsAnon,
                        poll: draftPoll || null,
                      })

                      console.log('Post created successfully:', result)
                      
                      // Extract post and any poll error from result
                      const createdPost = result?.post || result
                      const pollError = result?.pollError

                      // Show warning if poll creation failed
                      if (pollError) {
                        Alert.alert(
                          'Poll Creation Issue',
                          'Your post was created but the poll failed to attach. You can try creating a new post with the poll.',
                          [{ text: 'OK' }]
                        )
                      }

                      if (createdPost?.id && draftMedia.length > 0) {
                        try {
                          console.log('📸 Uploading media for post:', createdPost.id)
                          const mediaPaths = await uploadPostMedia(createdPost.id)
                          console.log('📸 Media paths:', mediaPaths)

                          if (mediaPaths.length > 0) {
                            const { error: updateError } = await supabase
                              .from('posts')
                              .update({ media_urls: mediaPaths })
                              .eq('id', createdPost.id)

                            if (updateError) {
                              console.error('Failed to update post with media:', updateError)
                            } else {
                              console.log('✅ Post updated with media successfully')
                              // Invalidate queries to show updated post with images
                              // Invalidate all posts queries for the current forum
                              queryClient.invalidateQueries({ queryKey: ['posts', currentForumId] })
                              // Also invalidate any posts queries without filters
                              queryClient.invalidateQueries({ queryKey: ['posts'] })
                            }
                          }
                        } catch (mediaError) {
                          console.error('Post media upload failed:', mediaError)
                          Alert.alert(
                            'Media Upload Failed',
                            'Your post was created but the images failed to upload. You can try editing the post to add them again.'
                          )
                        }
                      }

                      // Reset form
                      setDraftTitle('')
                      setDraftBody('')
                      setDraftIsAnon(true)
                      setDraftMedia([])
                      setDraftTags([])
                      setSelectedTag(null)
                      setDraftPoll(null)
                      setIsCreateModalVisible(false)
                    } catch (error) {
                      console.error('Error creating post:', error)
                      console.error('Error details:', JSON.stringify(error, null, 2))
                      console.error('Error code:', error.code)
                      console.error('Error message:', error.message)
                      console.error('Error details:', error.details)
                      
                      let errorMessage = 'Failed to create post. Please try again.'
                      if (error.message) {
                        errorMessage = error.message
                      } else if (error.details) {
                        errorMessage = error.details
                      } else if (error.code) {
                        errorMessage = `Error ${error.code}: ${error.message || 'Failed to create post'}`
                      }
                      
                      Alert.alert('Error Creating Post', errorMessage)
                    }
                  }}
                  style={[
                    styles.fizzPostButton,
                    (!draftBody.trim() || createPostMutation.isPending) && styles.fizzPostButtonDisabled,
                  ]}
                >
                  <Text style={styles.fizzPostButtonText}>
                    {createPostMutation.isPending ? 'Posting...' : 'Post'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content Area */}
              <View style={styles.fizzContentArea}>
                {/* Optional Title Input */}
                <TextInput
                  value={draftTitle}
                  onChangeText={setDraftTitle}
                  placeholder="Add a title (optional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={styles.fizzTitleInput}
                  maxLength={100}
                />
                
                {/* Body Input */}
                <TextInput
                  value={draftBody}
                  onChangeText={setDraftBody}
                  placeholder="Share what's really on your mind..."
                  placeholderTextColor={theme.colors.textSecondary}
                  style={styles.fizzTextInput}
                  multiline
                  textAlignVertical="top"
                />
                
                {/* Draft Media Preview - Industry Standard Design */}
                {draftMedia.length > 0 && (
                  <View style={styles.draftMediaPreview}>
                    {draftMedia.length === 1 ? (
                      // Single image - full width, Instagram-style
                      <View style={styles.draftMediaSingle}>
                        <Image
                          source={{ uri: draftMedia[0].uri }}
                          style={styles.draftMediaSingleImage}
                        />
                        <TouchableOpacity
                          style={styles.draftMediaRemoveSingle}
                          onPress={() => setDraftMedia([])}
                          activeOpacity={0.7}
                        >
                          <View style={styles.draftMediaRemoveSingleButton}>
                            <X size={hp(2.2)} color={theme.colors.white} strokeWidth={2.5} />
                          </View>
                        </TouchableOpacity>
                      </View>
                    ) : draftMedia.length === 2 ? (
                      // Two images - side by side with gap
                      <View style={styles.draftMediaTwoGrid}>
                        {draftMedia.map((media, index) => (
                          <View key={index} style={styles.draftMediaTwoItem}>
                            <Image
                              source={{ uri: media.uri }}
                              style={styles.draftMediaTwoImage}
                            />
                            <TouchableOpacity
                              style={styles.draftMediaRemoveTwo}
                              onPress={() => {
                                setDraftMedia((prev) => prev.filter((_, i) => i !== index))
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={styles.draftMediaRemoveTwoButton}>
                                <X size={hp(1.9)} color={theme.colors.white} strokeWidth={2.5} />
                              </View>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) : (
                      // Three or more - clean grid layout
                      <View style={styles.draftMediaGrid}>
                        {draftMedia.slice(0, 4).map((media, index) => (
                          <View key={index} style={styles.draftMediaGridItem}>
                            <Image
                              source={{ uri: media.uri }}
                              style={styles.draftMediaGridImage}
                            />
                            {index === 3 && draftMedia.length > 4 && (
                              <View style={styles.draftMediaMoreOverlay}>
                                <Text style={styles.draftMediaMoreText}>+{draftMedia.length - 4}</Text>
                              </View>
                            )}
                            <TouchableOpacity
                              style={styles.draftMediaRemoveGrid}
                              onPress={() => {
                                setDraftMedia((prev) => prev.filter((_, i) => i !== index))
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={styles.draftMediaRemoveGridButton}>
                                <X size={hp(1.7)} color={theme.colors.white} strokeWidth={2.5} />
                              </View>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Selected Tag Display - Moved above action bar */}
              {selectedTag && (() => {
                const tagColors = {
                  'QUESTION': '#5B8DEF',
                  'CONFESSION': '#FF7A8A',
                  'CRUSH': '#FF8CC8',
                  'DM ME': '#4DD0E1',
                  'EVENT': '#FFB84D',
                  'PSA': '#FF6B6B',
                  'SHOUTOUT': '#4ECDC4',
                  'DUB': '#FFD93D',
                  'RIP': '#95A5A6',
                  'MEME': '#A78BFA',
                  'LOST & FOUND': '#E67E22',
                }
                const tagColor = tagColors[selectedTag] || theme.colors.bondedPurple
                return (
                  <View style={[styles.fizzSelectedTag, { backgroundColor: tagColor }]}>
                    <Text style={styles.fizzSelectedTagText}>{selectedTag}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedTag(null)}
                      activeOpacity={0.8}
                      style={styles.fizzSelectedTagClose}
                    >
                      <X size={hp(1.6)} color={theme.colors.white} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )
              })()}

              {/* Action Bar - Above Keyboard */}
              <View style={styles.fizzActionBar}>
                <View style={styles.fizzMediaIconsRow}>
                  <TouchableOpacity
                    style={styles.fizzMediaIcon}
                    onPress={() => handlePickMedia('image')}
                    activeOpacity={0.7}
                  >
                    <ImageIcon size={hp(2.8)} color={theme.colors.textPrimary} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fizzMediaIcon}
                    onPress={() => handlePickMedia('video')}
                    activeOpacity={0.7}
                  >
                    <Video size={hp(2.8)} color={theme.colors.textPrimary} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
              {selectedTag && (() => {
                const tagColors = {
                  'QUESTION': '#5B8DEF',
                  'CONFESSION': '#FF7A8A',
                  'CRUSH': '#FF8CC8',
                  'DM ME': '#4DD0E1',
                  'EVENT': '#FFB84D',
                  'PSA': '#FF6B6B',
                  'SHOUTOUT': '#4ECDC4',
                  'DUB': '#FFD93D',
                  'RIP': '#95A5A6',
                  'MEME': '#A78BFA',
                  'LOST & FOUND': '#E67E22',
                }
                const tagColor = tagColors[selectedTag] || theme.colors.bondedPurple
                return (
                  <View style={[styles.fizzSelectedTag, { backgroundColor: tagColor }]}>
                  <Text style={styles.fizzSelectedTagText}>{selectedTag}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedTag(null)}
                    activeOpacity={0.8}
                      style={styles.fizzSelectedTagClose}
                  >
                      <X size={hp(1.6)} color={theme.colors.white} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
                )
              })()}

              {/* Tag Selector Overlay - Inside create post modal */}
              {showTagSelector && (
                <View style={styles.tagSelectorOverlay}>
          <Pressable
                    style={styles.tagSelectorOverlayBackdrop}
            onPress={() => setShowTagSelector(false)}
          >
                    <Pressable
                      style={styles.tagSelectorOverlayContent}
                      onPress={(e) => e.stopPropagation()}
                    >
              <View style={styles.tagModalHeader}>
                <Text style={styles.tagModalTitle}>Select Tag</Text>
                <TouchableOpacity
                  onPress={() => setShowTagSelector(false)}
                  activeOpacity={0.8}
                          style={styles.tagModalCloseButton}
                >
                          <X size={hp(2.2)} color={theme.colors.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
                      <ScrollView 
                        style={styles.tagList} 
                        contentContainerStyle={styles.tagListContent}
                        showsVerticalScrollIndicator={false}
                      >
                {[
                  { label: 'QUESTION', color: '#5B8DEF', gradient: ['#5B8DEF', '#4A7CE8'] },
                  { label: 'CONFESSION', color: '#FF7A8A', gradient: ['#FF7A8A', '#FF6B7D'] },
                  { label: 'CRUSH', color: '#FF8CC8', gradient: ['#FF8CC8', '#FF7BB8'] },
                  { label: 'DM ME', color: '#4DD0E1', gradient: ['#4DD0E1', '#3BC5D6'] },
                  { label: 'EVENT', color: '#FFB84D', gradient: ['#FFB84D', '#FFA733'] },
                  { label: 'PSA', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF5555'] },
                  { label: 'SHOUTOUT', color: '#4ECDC4', gradient: ['#4ECDC4', '#3DBBB3'] },
                  { label: 'DUB', color: '#FFD93D', gradient: ['#FFD93D', '#FFD024'] },
                  { label: 'RIP', color: '#95A5A6', gradient: ['#95A5A6', '#839496'] },
                  { label: 'MEME', color: '#A78BFA', gradient: ['#A78BFA', '#9675F5'] },
                  { label: 'LOST & FOUND', color: '#E67E22', gradient: ['#E67E22', '#D35400'] },
                ].map((tag) => (
                  <TouchableOpacity
                    key={tag.label}
                    style={[
                      styles.fizzTagPill,
                      selectedTag === tag.label && styles.fizzTagPillSelected,
                    ]}
                    onPress={() => {
                      setSelectedTag(tag.label)
                      setShowTagSelector(false)
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={tag.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.fizzTagGradient}
                    >
                      <Text style={styles.fizzTagPillText}>{tag.label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
          </Pressable>
                  </Pressable>
                </View>
              )}

              {/* Post As Overlay - Inside create post modal */}
              {showPostAsModal && (
                <View style={styles.postAsOverlay}>
          <Pressable
                    style={styles.postAsOverlayBackdrop}
            onPress={() => setShowPostAsModal(false)}
          >
                    <View style={styles.postAsOverlayContent}>
              <View style={styles.postAsModalHandle} />
              <Text style={styles.postAsModalTitle}>Post as</Text>
              
                      {/* Anonymous Option */}
              <TouchableOpacity
                style={styles.postAsOption}
                activeOpacity={0.8}
                        onPress={() => {
                          setDraftIsAnon(true)
                          setShowPostAsModal(false)
                        }}
              >
                <View style={styles.postAsIcon}>
                          <Person size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
                </View>
                <View style={styles.postAsOptionText}>
                          <Text style={styles.postAsOptionTitle}>Anonymous</Text>
                          <Text style={styles.postAsOptionSubtitle}>Post without revealing your identity</Text>
                </View>
                        {draftIsAnon && (
                          <View style={styles.postAsCheck}>
                            <Check size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
                          </View>
                        )}
              </TouchableOpacity>

                      {/* Your Name Option */}
              <TouchableOpacity
                style={styles.postAsOption}
                activeOpacity={0.8}
                onPress={() => {
                          setDraftIsAnon(false)
                  setShowPostAsModal(false)
                }}
              >
                <View style={styles.postAsIcon}>
                  <Person size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
                </View>
                <View style={styles.postAsOptionText}>
                          <Text style={styles.postAsOptionTitle}>Your Name</Text>
                          <Text style={styles.postAsOptionSubtitle}>Post with your name visible</Text>
                </View>
                        {!draftIsAnon && (
                  <View style={styles.postAsCheck}>
                    <Check size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
                  </View>
                )}
              </TouchableOpacity>

                      {/* Org Page Option (for admins) */}
                      {isAdmin && (
              <TouchableOpacity
                style={styles.postAsOption}
                activeOpacity={0.8}
                onPress={() => {
                            // TODO: Set posting as org
                  setShowPostAsModal(false)
                }}
              >
                <View style={styles.postAsIcon}>
                  <Add size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
                </View>
                <View style={styles.postAsOptionText}>
                            <Text style={styles.postAsOptionTitle}>Organization Page</Text>
                            <Text style={styles.postAsOptionSubtitle}>Post as your organization</Text>
                </View>
              </TouchableOpacity>
                      )}
            </View>
          </Pressable>
                </View>
              )}
              </KeyboardAvoidingView>
            </SafeAreaView>
          </View>
        </Modal>


        {/* Story Flow (Create/Edit/Preview) */}
        <StoryFlow
          visible={isStoryFlowVisible}
          forumId={currentForumId}
          forumName={currentForum}
          userId={currentUser.id}
          userName={currentUser.name}
          userAvatar={currentUser.avatar}
          onClose={() => setIsStoryFlowVisible(false)}
        />

        {/* Story Viewer */}
        <StoryViewer
          visible={isStoryViewerVisible}
          stories={viewerStories}
          initialIndex={selectedStoryIndex}
          currentUserId={currentUser.id}
          onClose={() => setIsStoryViewerVisible(false)}
        />

        {/* Share Modal */}
        <ShareModal
          visible={showShareModal}
          content={shareContent}
          onClose={() => {
            setShowShareModal(false)
            setShareContent(null)
          }}
        />


        {/* Floating Create Post Button */}
        <TouchableOpacity
          style={styles.floatingCreateButton}
          onPress={() => {
            // Check onboarding completion
            if (!userProfile?.onboarding_complete) {
              Alert.alert(
                'Complete Your Profile',
                `Please complete your onboarding to create posts. You're ${userProfile?.profile_completion_percentage || 0}% done!`,
                [
                  { text: 'Later', style: 'cancel' },
                  { text: 'Complete Now', onPress: () => router.push('/onboarding') },
                ]
              )
              return
            }
            
            // Ensure we have a forum selected before opening modal
            if (!currentForum && visibleForums.length > 0) {
              const mainForum = visibleForums.find(f => f.type === 'campus') || visibleForums[0]
              if (mainForum) {
                console.log('Setting forum before opening modal:', mainForum.name, mainForum.id)
                setCurrentForum(mainForum)
              }
            }
            setIsCreateModalVisible(true)
          }}
          activeOpacity={0.8}
        >
          <Add size={hp(2.5)} color={theme.colors.white} strokeWidth={2.5} />
        </TouchableOpacity>

        <BottomNav scrollY={scrollY} />

        {/* Campus Selector Modal (Super Admin) */}
        <Modal
          visible={isCampusSelectorVisible}
          transparent
          animationType="slide"
          presentationStyle="overFullScreen"
          onRequestClose={() => setIsCampusSelectorVisible(false)}
        >
          <Pressable
            style={styles.campusModalOverlay}
            onPress={() => setIsCampusSelectorVisible(false)}
          >
            <Pressable
              style={styles.campusModalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.campusModalHeader}>
                <Text style={styles.campusModalTitle}>Select Campus</Text>
                <TouchableOpacity
                  onPress={() => setIsCampusSelectorVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <X size={hp(2.4)} color={theme.colors.textPrimary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {universitiesLoading ? (
                <View style={styles.campusModalEmpty}>
                  <Text style={styles.campusModalEmptyText}>Loading campuses...</Text>
                </View>
              ) : universities.length === 0 ? (
                <View style={styles.campusModalEmpty}>
                  <Text style={styles.campusModalEmptyText}>No campuses found</Text>
                </View>
              ) : (
                <FlatList
                  data={universities}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.campusModalList}
                  renderItem={({ item }) => {
                    const isSelected = item.id === selectedUniversityId
                    return (
                      <TouchableOpacity
                        style={[
                          styles.campusModalItem,
                          isSelected && styles.campusModalItemActive,
                        ]}
                        onPress={() => {
                          setSelectedUniversityId(item.id)
                          setIsCampusSelectorVisible(false)
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.campusModalItemText,
                            isSelected && styles.campusModalItemTextActive,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {!!item.domain && (
                          <Text style={styles.campusModalItemSubtext}>
                            {item.domain}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )
                  }}
                />
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Forum Selector Modal */}
        <ForumSelectorModal
          visible={isForumSelectorVisible}
          forums={visibleForums}
          currentForumId={currentForumId}
          onSelectForum={(forum) => {
            setCurrentForum(forum)
            // Filter posts by forum if needed
          }}
          onClose={() => setIsForumSelectorVisible(false)}
        />

        {/* Repost Modal */}
        <RepostModal
          visible={showRepostModal}
          post={repostPost}
          onClose={() => {
            setShowRepostModal(false)
            setRepostPost(null)
          }}
          onRepost={async (repostData) => {
            // TODO: Save repost to Supabase
            // For now, refetch to get updated repost count
            await refetchPosts()
            // TODO: Save repost to backend
            console.log('Reposting:', repostData)
          }}
          groups={[]} // TODO: Get user's groups
        />
      </View>
    </SafeAreaView>
  )
}

function getTimeAgo(dateString) {
  if (!dateString) return 'Just now'

  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks}w`

  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo`
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  forumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(0.5),
  },
  forumTitle: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    letterSpacing: -0.3,
  },
  favoriteButton: {
    padding: hp(0.8),
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
  },
  headerButton: {
    width: hp(4.5),
    height: hp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
  },
  headerRight: {
    width: hp(4.5),
  },
  searchContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(0.5),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    gap: wp(2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
  },
  clearButton: {
    paddingHorizontal: wp(2),
  },
  clearButtonText: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  createPostIconButton: {
    padding: hp(0.5),
  },
  createPostRowContainer: {
    paddingTop: hp(1.5), // Spacing between header and buttons
  },
  createPostRow: {
    flexDirection: 'row',
    gap: wp(2),
    paddingBottom: hp(0.5),
  },
  createButton: {
    flex: 1,
  },
  createPostButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.pill,
    paddingVertical: hp(1.1),
    paddingHorizontal: wp(4),
  },
  createPostText: {
    fontSize: hp(1.6),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  createEventButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingVertical: hp(0.9),
    paddingHorizontal: wp(4),
  },
  createEventText: {
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: wp(2),
    paddingBottom: hp(0.5),
    paddingHorizontal: wp(4),
  },
  filterChip: {
    flex: 1,
  },
  filterButton: {
    flex: 1,
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.pill,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  filterButtonActive: {
    backgroundColor: 'transparent',
  },
  filterButtonText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  storiesWrapper: {
    marginBottom: hp(1.5),
    position: 'relative',
  },
  storiesGradient: {
    paddingVertical: hp(0.8),
    borderRadius: hp(1),
  },
  storiesRow: {
    marginBottom: hp(0.5),
  },
  storyItem: {
    width: wp(16),
    alignItems: 'center',
  },
  storyAvatar: {
    width: wp(13),
    height: wp(13),
    borderRadius: wp(6.5),
    backgroundColor: theme.colors.background,
    borderWidth: 2.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.8),
    ...Platform.select({
      ios: {
        shadowColor: theme.mode === 'dark' ? '#000' : '#718096',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  storyAddAvatar: {
    borderStyle: 'dashed',
  },
  storyAvatarText: {
    fontSize: hp(2.2),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  storyLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  listHeader: {
    paddingTop: hp(0.5),
    paddingBottom: hp(1.5),
  },
  postsList: {
    paddingBottom: hp(10),
    paddingHorizontal: 0,
  },
  postCard: {
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: wp(2),
  },
  postAvatar: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.5),
  },
  postAvatarText: {
    fontSize: hp(2),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
  },
  postMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.1),
    fontWeight: '400',
  },
  postBody: {
    marginBottom: hp(1),
  },
  postTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.6),
    lineHeight: hp(2.6),
  },
  postBodyText: {
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.2),
    marginTop: hp(0.2),
  },
  postTagsContainer: {
    marginTop: hp(0.8),
  },
  postPollContainer: {
    marginTop: hp(1),
  },
  postMediaPreview: {
    marginTop: hp(1),
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
  },
  postMediaImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: hp(25),
    resizeMode: 'cover',
  },
  postMediaVideo: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: hp(25),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.charcoal,
  },
  postMediaVideoText: {
    marginTop: hp(0.5),
    fontSize: hp(1.5),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(1),
    paddingTop: hp(1),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  postVotesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  voteButton: {
    padding: hp(0.5),
    borderRadius: theme.radius.full,
  },
  postVoteCount: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    minWidth: wp(5),
    textAlign: 'center',
  },
  postVotePositive: {
    color: theme.colors.success,
  },
  postVoteNegative: {
    color: theme.colors.error,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    padding: hp(0.5),
    borderRadius: theme.radius.full,
  },
  postActionText: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  postModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(2),
    maxHeight: '92%',
    minHeight: hp(55),
    flex: 1,
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  createModalSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  createModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.xl,
    gap: wp(1.5),
  },
  createPostButtonText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  fizzModalSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fizzModalWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fizzModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fizzModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    minHeight: hp(7),
  },
  fizzHeaderButton: {
    width: hp(4),
    height: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  fizzHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: wp(4),
  },
  fizzAnonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  fizzAnonymousIcon: {
    width: hp(3),
    height: hp(3),
    borderRadius: hp(1.5),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fizzAnonymousText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  fizzPostButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bondedPurple,
  },
  fizzPostButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  fizzPostButtonText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  fizzContentArea: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
  },
  fizzTitleInput: {
    fontSize: hp(2.2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    paddingBottom: hp(1),
    marginBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  fizzTextInput: {
    flex: 1,
    fontSize: hp(1.9),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
    minHeight: hp(15),
    maxHeight: hp(40),
  },
  fizzActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    minHeight: hp(6),
    backgroundColor: theme.colors.background,
  },
  fizzMediaIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  fizzMediaIcon: {
    width: hp(4),
    height: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  fizzSelectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5.5),
    paddingVertical: hp(1.6),
    marginHorizontal: wp(4),
    marginTop: hp(1),
    marginBottom: hp(0.5),
    borderRadius: theme.radius.xl,
    minHeight: hp(4.6),
    gap: wp(2),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  fizzSelectedTagText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: 0.3,
    flex: 1,
  },
  fizzSelectedTagClose: {
    padding: hp(0.3),
  },
  tagSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  tagSelectorOverlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagSelectorOverlayContent: {
    width: wp(90),
    maxHeight: hp(75),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 32,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  tagModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  tagModalContent: {
    width: wp(85),
    maxHeight: hp(70),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    padding: wp(5),
    zIndex: 10000,
    elevation: 10000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 10000,
      },
    }),
  },
  tagModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  tagModalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  tagModalCloseButton: {
    width: hp(4.5),
    height: hp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  tagList: {
    maxHeight: hp(55),
  },
  tagListContent: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  fizzTagPill: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  fizzTagPillSelected: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    transform: [{ scale: 1.02 }],
  },
  fizzTagGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(4.5),
  },
  fizzTagPillText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
    letterSpacing: 0.2,
  },
  postAsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  postAsOverlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  postAsOverlayContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingBottom: hp(4),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  postAsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 9999,
  },
  postAsModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingBottom: hp(4),
    zIndex: 10000,
    elevation: 10000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 10000,
      },
    }),
  },
  postAsModalHandle: {
    width: wp(12),
    height: hp(0.5),
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    alignSelf: 'center',
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  postAsModalTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  postAsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    gap: wp(3),
  },
  postAsIcon: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAsOptionText: {
    flex: 1,
  },
  postAsOptionTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  postAsOptionSubtitle: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginTop: hp(0.3),
  },
  postAsCheck: {
    width: hp(3),
    height: hp(3),
    borderRadius: hp(1.5),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  postModalHeaderTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  mediaIconsRow: {
    flexDirection: 'row',
    gap: wp(3),
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  mediaIconButton: {
    padding: hp(1),
  },
  tagPollToggleRow: {
    flexDirection: 'row',
    gap: wp(2),
    paddingHorizontal: wp(4),
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  tagPollToggleButton: {
    width: hp(4),
    height: hp(4),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagPollToggleButtonActive: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.border,
  },
  tagsSection: {
    paddingHorizontal: wp(4),
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(1.5),
  },
  pollSection: {
    paddingHorizontal: wp(4),
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  composeFooter: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.offWhite,
    backgroundColor: theme.colors.background,
  },
  postFooterButton: {
    width: '100%',
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postFooterButtonDisabled: {
    opacity: 0.5,
  },
  postFooterButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  postModalTitle: {
    flex: 1,
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginRight: wp(2),
  },
  postModalMeta: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
    marginBottom: hp(1),
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  postModalBody: {
    flex: 1,
  },
  postModalBodyContent: {
    paddingBottom: hp(2),
    flexGrow: 1,
  },
  postModalBodyText: {
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.6),
    marginBottom: hp(2),
  },
  commentsSection: {
    marginTop: hp(2),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  commentsTitle: {
    fontSize: hp(1.8),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  commentsCount: {
    fontSize: hp(1.6),
    fontWeight: '400',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  commentsList: {
    gap: hp(2),
  },
  commentCard: {
    flexDirection: 'row',
    paddingVertical: hp(1),
    paddingRight: wp(4),
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2),
  },
  commentAvatarText: {
    fontSize: hp(1.8),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  commentAuthorInfo: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    marginRight: wp(1.5),
  },
  commentMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.1),
  },
  commentBody: {
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.3),
    marginBottom: hp(0.5),
    marginLeft: wp(14), // Align with text after avatar
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.3),
    marginLeft: wp(14), // Align with text after avatar
    gap: wp(3),
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
  },
  commentLikeText: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  commentLikeTextActive: {
    color: theme.colors.info,
  },
  commentLikeLabel: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  commentLikeLabelActive: {
    color: theme.colors.info,
  },
  commentReplyButton: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
  },
  commentReplyText: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: hp(1),
    marginLeft: wp(14), // Align with main comment content
    paddingLeft: wp(2),
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.border,
    gap: hp(0.5),
  },
  replyCard: {
    flexDirection: 'row',
    paddingVertical: hp(0.8),
    paddingRight: wp(2),
  },
  replyHeader: {
    marginBottom: hp(0.3),
  },
  replyAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyAvatar: {
    width: hp(3.2),
    height: hp(3.2),
    borderRadius: hp(1.6),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(1.5),
  },
  replyAvatarText: {
    fontSize: hp(1.5),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  replyAuthorInfo: {
    flex: 1,
  },
  replyAuthorName: {
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    marginRight: wp(1.5),
  },
  replyMetaText: {
    fontSize: hp(1.2),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.1),
  },
  replyBody: {
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.2),
    marginBottom: hp(0.3),
    marginLeft: wp(10.5), // Align with text after avatar
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(10.5), // Align with text after avatar
    gap: wp(3),
  },
  replyInputContainer: {
    marginTop: hp(1),
    padding: wp(3),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  replyInput: {
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    minHeight: hp(6),
    maxHeight: hp(12),
    marginBottom: hp(1),
  },
  replyInputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyInputButtons: {
    flexDirection: 'row',
    gap: wp(2),
  },
  replyCancelButton: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
  },
  replyCancelText: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  replySubmitButton: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.pill,
  },
  replySubmitButtonDisabled: {
    opacity: 0.5,
  },
  replySubmitText: {
    fontSize: hp(1.5),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  newCommentContainer: {
    padding: wp(4),
    paddingTop: hp(1.2),
    paddingBottom: hp(1.5),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  newCommentInput: {
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    minHeight: hp(5),
    maxHeight: hp(10),
    marginBottom: hp(1),
    textAlignVertical: 'center',
  },
  newCommentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentSubmitButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.pill,
    ...Platform.select({
      ios: {
        shadowColor: theme.mode === 'dark' ? '#000' : '#718096',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  commentSubmitButtonDisabled: {
    opacity: 0.5,
  },
  commentSubmitText: {
    fontSize: hp(1.6),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  anonPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(2.5),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  anonPillActiveSmall: {
    backgroundColor: theme.colors.bondedPurple,
    borderWidth: 0,
  },
  anonPillTextSmall: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  emptyCommentsBox: {
    paddingVertical: hp(3),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(164, 92, 255, 0.08)',
    borderStyle: 'dashed',
  },
  emptyCommentsText: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.7,
    textAlign: 'center',
  },
  profileModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  profileModalHeaderText: {
    flex: 1,
    marginRight: wp(4),
  },
  profileName: {
    fontSize: hp(2.4),
    fontWeight: '800',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  profileSubText: {
    marginTop: hp(0.5),
    fontSize: hp(1.7),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
  },
  profileBody: {
    marginTop: hp(1),
  },
  profileAvatarLarge: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(3.5),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.8),
  },
  profileAvatarLargeText: {
    fontSize: hp(3),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  profileMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(1.8),
  },
  profileMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
  },
  profileMetaPillText: {
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
  profileSection: {
    marginBottom: hp(1.8),
  },
  profileSectionLabel: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.6),
  },
  profileQuote: {
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.6),
  },
  profileActions: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(2),
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.4),
    borderRadius: theme.radius.lg,
  },
  profileSecondaryButton: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  profilePrimaryButton: {
    backgroundColor: theme.colors.bondedPurple,
  },
  profileSecondaryText: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  profilePrimaryText: {
    fontSize: hp(1.8),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: hp(1.8),
  },
  inputLabel: {
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.5),
  },
  inputHint: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    opacity: 0.8,
    fontFamily: theme.typography.fontFamily.body,
  },
  textInput: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
  textArea: {
    minHeight: hp(12),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  mediaRow: {
    flexDirection: 'row',
    gap: wp(2),
    marginBottom: hp(0.6),
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.9),
    paddingHorizontal: wp(3.4),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  mediaButtonText: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  composeBody: {
    flex: 1,
    maxHeight: hp(50),
  },
  optionalFeaturesRow: {
    flexDirection: 'row',
    gap: wp(2),
    marginTop: hp(1.5),
    marginBottom: hp(1),
  },
  optionalFeatureButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: wp(1.5),
  },
  optionalFeatureButtonActive: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.border,
  },
  optionalFeatureButtonText: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  optionalFeatureButtonTextActive: {
    color: theme.colors.white,
  },
  collapsibleSection: {
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  composeTitleInput: {
    fontSize: hp(1.8),
    fontWeight: '500',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(1.5),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  composeInput: {
    flex: 1,
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.4),
    paddingHorizontal: wp(4),
    minHeight: hp(15),
  },
  composeToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composeCancelText: {
    fontSize: hp(1.7),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  composePostButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.9),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bondedPurple,
  },
  composePostButtonText: {
    fontSize: hp(1.7),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  anonPill: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  anonPillActive: {
    backgroundColor: theme.colors.bondedPurple,
    borderWidth: 0,
  },
  mediaAttachedRow: {
    marginTop: hp(1.2),
  },
  mediaAttachedText: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
  },
  draftMediaPreview: {
    marginTop: hp(2),
    paddingHorizontal: wp(4),
  },
  // Single image - full width, large preview
  // Single image - full width, Instagram/Twitter style
  draftMediaSingle: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: hp(1.2),
    overflow: 'hidden',
    backgroundColor: theme.colors.border || '#E5E5E5',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || '#E5E5E5',
  },
  draftMediaSingleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  draftMediaRemoveSingle: {
    position: 'absolute',
    top: hp(1.2),
    right: hp(1.2),
    zIndex: 10,
  },
  draftMediaRemoveSingleButton: {
    width: hp(3.2),
    height: hp(3.2),
    borderRadius: hp(1.6),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // Two images - side by side with gap
  draftMediaTwoGrid: {
    flexDirection: 'row',
    gap: wp(1.5),
  },
  draftMediaTwoItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: hp(1.2),
    overflow: 'hidden',
    backgroundColor: theme.colors.border || '#E5E5E5',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || '#E5E5E5',
  },
  draftMediaTwoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  draftMediaRemoveTwo: {
    position: 'absolute',
    top: hp(1),
    right: hp(1),
    zIndex: 10,
  },
  draftMediaRemoveTwoButton: {
    width: hp(2.8),
    height: hp(2.8),
    borderRadius: hp(1.4),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // Grid layout for 3+ images
  draftMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1.5),
  },
  draftMediaGridItem: {
    width: (wp(100) - wp(8) - wp(1.5)) / 2, // Screen width - padding - gap, divided by 2
    aspectRatio: 1,
    borderRadius: hp(1.2),
    overflow: 'hidden',
    backgroundColor: theme.colors.border || '#E5E5E5',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || '#E5E5E5',
  },
  draftMediaGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  draftMediaMoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftMediaMoreText: {
    fontSize: hp(2.8),
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  draftMediaRemoveGrid: {
    position: 'absolute',
    top: hp(0.8),
    right: hp(0.8),
    zIndex: 10,
  },
  draftMediaRemoveGridButton: {
    width: hp(2.6),
    height: hp(2.6),
    borderRadius: hp(1.3),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
  },
  loadingText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.error || '#ef4444',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary || theme.colors.bondedPurple,
    borderRadius: theme.radius.md,
  },
  retryButtonText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: hp(2),
  },
  createFirstPostButton: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.2),
    borderRadius: hp(1.5),
    marginTop: hp(1),
  },
  createFirstPostButtonText: {
    fontSize: hp(1.6),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.semibold,
  },
  draftMediaPreview: {
    marginTop: hp(1.5),
    paddingHorizontal: wp(4),
  },
  draftMediaScroll: {
    flexDirection: 'row',
  },
  draftMediaRemove: {
    position: 'absolute',
    top: -hp(0.8),
    right: -hp(0.8),
  },
  draftMediaRemoveButton: {
    width: hp(2.5),
    height: hp(2.5),
    borderRadius: hp(1.25),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  tagFilterRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  tagFilterChip: {
    marginRight: wp(2),
  },
  pollSection: {
    marginTop: hp(1),
  },
  addPollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    gap: wp(1.5),
  },
  addPollText: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  commentsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  sortSegmented: {
    marginLeft: theme.spacing.sm,
  },
  floatingCreateButton: {
    position: 'absolute',
    bottom: hp(12),
    right: wp(4),
    width: hp(6.5),
    height: hp(6.5),
    borderRadius: hp(3.25),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  campusSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.2),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.6),
    borderRadius: hp(1.8),
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  campusSelectorText: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    maxWidth: wp(28),
  },
  campusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  campusModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: hp(2),
    borderTopRightRadius: hp(2),
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(3),
    maxHeight: hp(60),
  },
  campusModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  campusModalTitle: {
    fontSize: hp(2),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  campusModalList: {
    paddingBottom: hp(2),
  },
  campusModalItem: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    borderRadius: hp(1.6),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  campusModalItemActive: {
    borderColor: theme.colors.bondedPurple,
    backgroundColor: 'rgba(123, 97, 255, 0.08)',
  },
  campusModalItemText: {
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  campusModalItemTextActive: {
    color: theme.colors.bondedPurple,
  },
  campusModalItemSubtext: {
    marginTop: hp(0.4),
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  campusModalEmpty: {
    paddingVertical: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  campusModalEmptyText: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  emptyForumState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(10),
  },
  emptyForumStateTitle: {
    fontSize: hp(2.2),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  emptyForumStateText: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
    marginBottom: hp(2),
  },
  emptyForumStateButton: {
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.1),
    borderRadius: hp(2.4),
    backgroundColor: theme.colors.bondedPurple,
  },
  emptyForumStateButtonText: {
    fontSize: hp(1.5),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
  },
  postOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  postOptionsBottomSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: hp(2.5),
    borderTopRightRadius: hp(2.5),
    paddingBottom: hp(2),
    paddingTop: hp(1),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  postOptionsHandle: {
    width: wp(12),
    height: hp(0.5),
    backgroundColor: theme.colors.border || 'rgba(0, 0, 0, 0.2)',
    borderRadius: hp(0.25),
    alignSelf: 'center',
    marginBottom: hp(1.5),
  },
  postOptionsList: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.5),
  },
  postOptionItem: {
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderRadius: hp(1),
    marginBottom: hp(0.5),
    backgroundColor: theme.colors.backgroundSecondary || 'rgba(0, 0, 0, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postOptionText: {
    fontSize: hp(1.9),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  postOptionTextDanger: {
    fontSize: hp(1.9),
    color: theme.colors.error || '#FF3B30',
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  postOptionsCancel: {
    marginTop: hp(1),
    marginHorizontal: wp(4),
    paddingVertical: hp(1.8),
    borderRadius: hp(1),
    backgroundColor: theme.colors.backgroundSecondary || 'rgba(0, 0, 0, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postOptionsCancelText: {
    fontSize: hp(1.9),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
})
