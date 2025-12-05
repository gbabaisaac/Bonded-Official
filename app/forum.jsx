import React, { useState, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { 
  Add, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  MessageCircle, 
  Share2, 
  Repeat, 
  MoreHorizontal,
  ImageIcon,
  Video,
  EyeOff,
  Person,
  X,
  Tag,
  BarChart3,
  Mail,
  ChevronDown,
  MapPin,
  Check
} from '../components/Icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'
import AppTopBar from '../components/AppTopBar'
import BottomNav from '../components/BottomNav'
import Stories from '../components/Stories/Stories'
import StoryViewer from '../components/Stories/StoryViewer'
import StoryFlow from '../components/Stories/StoryFlow'
import ShareModal from '../components/ShareModal'
import AppCard from '../components/AppCard'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import Chip from '../components/Chip'
import ForumSwitcher from '../components/ForumSwitcher'
import ForumSelectorModal from '../components/ForumSelectorModal'
import { LinearGradient } from 'expo-linear-gradient'
import { useStoriesContext } from '../contexts/StoriesContext'
import TagSelector from '../components/Forum/TagSelector'
import PollBuilder from '../components/Forum/PollBuilder'
import PollRenderer from '../components/Forum/PollRenderer'
import RepostModal from '../components/Forum/RepostModal'
import AnonymousMessageButton from '../components/Forum/AnonymousMessageButton'
import PostTags from '../components/Forum/PostTags'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

const MOCK_STORIES = Array.from({ length: 8 }).map((_, index) => ({
  id: `story-${index + 1}`,
  name: ['Dorms', 'Library', 'Quad', 'Clubs', 'Dining', 'Events', 'Study', 'Random'][index % 8],
}))

const MOCK_COMMENTS = {
  'post-1': [
    {
      id: 'comment-1-1',
      author: 'Student123',
      isAnon: false,
      body: 'The 24/7 study room in the engineering building is great! Usually pretty quiet after 8pm.',
      upvotes: 8,
      downvotes: 0,
      timeAgo: '1h',
      replies: [
        {
          id: 'reply-1-1-1',
          author: 'Anon',
          isAnon: true,
          body: 'Thanks for the tip! Will check it out.',
          upvotes: 2,
          downvotes: 0,
          timeAgo: '45m',
        },
      ],
    },
    {
      id: 'comment-1-2',
      author: 'Anon',
      isAnon: true,
      body: 'Coffee shop near the quad stays open until midnight. Good vibes but can get loud.',
      upvotes: 5,
      downvotes: 0,
      timeAgo: '45m',
      replies: [],
    },
    {
      id: 'comment-1-3',
      author: 'StudyBuddy',
      isAnon: false,
      body: 'Library basement is underrated. Super quiet and has good lighting.',
      upvotes: 12,
      downvotes: 0,
      timeAgo: '30m',
      replies: [],
    },
    {
      id: 'comment-1-4',
      author: 'Anon',
      isAnon: true,
      body: 'The new student center has private study pods you can book. Worth checking out!',
      upvotes: 3,
      downvotes: 0,
      timeAgo: '15m',
      replies: [],
    },
  ],
  'post-2': [
    {
      id: 'comment-2-1',
      author: 'CS Major',
      isAnon: false,
      body: 'Took it last semester. Focus on the practice problems from the textbook - very similar format.',
      upvotes: 15,
      downvotes: 0,
      timeAgo: '3h',
      replies: [
        {
          id: 'reply-2-1-1',
          author: 'Anon',
          isAnon: true,
          body: 'Which chapter should I focus on most?',
          upvotes: 1,
          downvotes: 0,
          timeAgo: '2h',
        },
        {
          id: 'reply-2-1-2',
          author: 'CS Major',
          isAnon: false,
          body: 'Chapters 5-7 are the most important for the midterm.',
          upvotes: 4,
          downvotes: 0,
          timeAgo: '1h',
        },
      ],
    },
    {
      id: 'comment-2-2',
      author: 'Anon',
      isAnon: true,
      body: 'The midterm is fair but time is tight. Practice writing code by hand.',
      upvotes: 9,
      downvotes: 0,
      timeAgo: '2h',
      replies: [],
    },
    {
      id: 'comment-2-3',
      author: 'DataStructures',
      isAnon: false,
      body: 'Review the linked list and tree traversal algorithms. Those always show up.',
      upvotes: 11,
      downvotes: 0,
      timeAgo: '1h',
      replies: [],
    },
  ],
  'post-3': [
    {
      id: 'comment-3-1',
      author: 'Former Student',
      isAnon: false,
      body: 'Hard but fair is accurate. Workload is heavy but you learn a lot. Worth it if you put in the effort.',
      upvotes: 7,
      downvotes: 0,
      timeAgo: '6h',
      replies: [],
    },
    {
      id: 'comment-3-2',
      author: 'Anon',
      isAnon: true,
      body: 'Expect 10-15 hours per week on assignments. Lectures are clear though.',
      upvotes: 4,
      downvotes: 0,
      timeAgo: '5h',
      replies: [],
    },
  ],
}

const POST_TITLES = [
  // Social/Casual posts
  'Anyone else see that couple making out in the library?',
  'Who else is procrastinating right now?',
  'The dining hall pizza is actually fire today',
  'Someone left their AirPods in the quad',
  'Why is everyone so quiet in the elevator?',
  'Best spot to people watch on campus?',
  'Anyone else tired of group project members who do nothing?',
  'The WiFi in my dorm is absolutely terrible',
  'Who else is surviving on coffee and ramen?',
  'Someone please tell me why tuition keeps going up',
  'Anyone else feel like they\'re faking it till they make it?',
  'The library at 2am hits different',
  'Who else is already counting down to spring break?',
  'Someone left their laundry in the dryer for 3 hours',
  'Why do professors assign work over break?',
  'Anyone else get anxiety from group chats?',
  'The person who sits next to me in class smells amazing',
  'Who else is living that broke college student life?',
  'Someone please adopt this stray cat near the dorms',
  'Why is it so hard to make friends in college?',
  'Anyone else feel like they\'re drowning in assignments?',
  'The person in front of me in line paid with change',
  'Who else is questioning their major choice?',
  'Someone left their car running in the parking lot',
  'Why do we have 8am classes?',
  'Anyone else get weird vibes from that one professor?',
  'The dining hall ran out of the good food again',
  'Who else is just trying to pass at this point?',
  'Someone please explain why textbooks cost $200',
  'Anyone else see that person fall down the stairs?',
  // School-related posts
  'Best study spots on campus?',
  'CS 201 midterm thread',
  'Prof. Nguyen for Data Structures',
  'Dorm room setup ideas?',
  'Best coffee shops near campus',
  'Looking for a study group for MATH 150',
  'Campus gym hours?',
  'Anyone know good parking spots?',
  'Rate my schedule: CS 201, ENGL 101, MATH 150',
  'Best professors for intro classes?',
  'Library vs study rooms?',
  'How to survive finals week',
  'Looking for roommates for next year',
  'Best clubs to join?',
  'Campus dining hall reviews',
  'Textbook buy/sell thread',
  'Internship opportunities?',
  'Study abroad experiences?',
  'Best time to register for classes?',
  'Campus WiFi issues?',
]

const POST_BODIES = [
  // Social/Casual bodies
  'Like get a room please',
  'I have 3 assignments due tomorrow and I\'m on here',
  'No cap, best pizza they\'ve had all semester',
  'Found them by the fountain, come get them',
  'It\'s so awkward when it\'s just you and one other person',
  'I like sitting by the main entrance and watching people',
  'Literally did all the work myself and they get the same grade',
  'Can\'t even load a YouTube video',
  'This is my diet and I\'m not ashamed',
  'Like what are we even paying for at this point?',
  'Every day I wake up and pretend I know what I\'m doing',
  'The vibes are immaculate',
  'Only 47 more days',
  'I\'m about to take them out myself',
  'We literally have ONE week off',
  'The constant notifications give me anxiety',
  'What cologne/perfume is that? Asking for a friend',
  'Ramen for breakfast, lunch, and dinner',
  'She\'s so cute but I\'m allergic',
  'It\'s been 2 months and I still eat alone',
  'I have 5 papers due this week send help',
  'I felt so bad for them',
  'Is it too late to switch?',
  'It\'s been running for 20 minutes now',
  'Who decided this was a good idea?',
  'Something\'s off about them',
  'They always run out right when I get there',
  'Cs get degrees right?',
  'I could buy a whole laptop for that',
  'I hope they\'re okay',
  // School-related bodies
  'Looking for quiet places that stay open late. Any recommendations besides the main library?',
  'How is everyone feeling about the midterm next week? Any tips from people who took it last semester?',
  'Thinking of taking Nguyen for Data Structures. Hard but fair? How heavy is the workload?',
  'Moving into the dorms next week. Any tips for making the space feel like home?',
  'Need caffeine but tired of Starbucks. What are the best local spots?',
  'Struggling with calculus. Anyone want to form a study group?',
  'What are the gym hours? Is it usually crowded?',
  'Commuting to campus and parking is a nightmare. Any secret spots?',
  'Is this schedule too heavy? Looking for honest opinions.',
  'Taking intro classes next semester. Who should I avoid?',
]

const FORUMS = ['Quad', 'Classes', 'RMP', 'Campus Life', 'Dorms', 'Library', 'Clubs', 'Random']
const AUTHORS = ['Anon', 'CS 201', 'Rate My Professor', 'Student123', 'StudyBuddy', 'CS Major', 'DataStructures', 'Former Student']

// Mock Forums Data
const MOCK_FORUMS = [
  // Main Forum (Pinned)
  {
    id: 'forum-quad',
    name: 'Main Forum',
    type: 'main',
    description: 'Campus-wide discussions',
    memberCount: 12450,
    postCount: 1245,
    unreadCount: 0,
    isPinned: true,
    code: null,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
  },
  // Classes
  {
    id: 'forum-cs-201',
    name: 'CS 201 - Data Structures',
    type: 'class',
    description: 'Professor: Dr. Smith',
    memberCount: 234,
    postCount: 45,
    unreadCount: 3,
    isPinned: false,
    code: 'CS 201',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
  },
  {
    id: 'forum-engl-101',
    name: 'ENGL 101 - Writing',
    type: 'class',
    description: 'Professor: Dr. Johnson',
    memberCount: 189,
    postCount: 28,
    unreadCount: 1,
    isPinned: false,
    code: 'ENGL 101',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
  },
  {
    id: 'forum-math-150',
    name: 'MATH 150 - Calc I',
    type: 'class',
    description: 'Professor: Dr. Williams',
    memberCount: 312,
    postCount: 67,
    unreadCount: 0,
    isPinned: false,
    code: 'MATH 150',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
  },
  // Organizations
  {
    id: 'forum-cs-club',
    name: 'Computer Science Club',
    type: 'org',
    description: 'Tech talks, hackathons, and networking',
    memberCount: 145,
    postCount: 89,
    unreadCount: 5,
    isPinned: false,
    code: null,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
  },
  {
    id: 'forum-basketball',
    name: 'Basketball Team',
    type: 'org',
    description: 'Team updates and events',
    memberCount: 12,
    postCount: 23,
    unreadCount: 2,
    isPinned: false,
    code: null,
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
  },
  // Private Forums
  {
    id: 'forum-roommates',
    name: 'Roommates',
    type: 'private',
    description: 'Private group chat',
    memberCount: 4,
    postCount: 12,
    unreadCount: 0,
    isPinned: false,
    code: null,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
  },
  {
    id: 'forum-study-group',
    name: 'Study Group CS 201',
    type: 'private',
    description: 'Study sessions and notes',
    memberCount: 8,
    postCount: 34,
    unreadCount: 1,
    isPinned: false,
    code: null,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
  },
]

const MOCK_POSTS = Array.from({ length: 60 }).map((_, index) => ({
  id: `post-${index + 1}`,
  author: AUTHORS[index % AUTHORS.length],
  isAnon: index % 3 === 0,
  title: POST_TITLES[index % POST_TITLES.length],
  body: POST_BODIES[index % POST_BODIES.length],
  forum: FORUMS[index % FORUMS.length],
  upvotes: Math.floor(Math.random() * 100) + 5,
  commentsCount: Math.floor(Math.random() * 50) + 2,
  timeAgo: `${Math.floor(Math.random() * 24)}h`,
  tags: index % 4 === 0 ? ['Housing', 'Advice'] : index % 4 === 1 ? ['Events'] : index % 4 === 2 ? ['STEM', 'Need Help'] : [],
  repostsCount: Math.floor(Math.random() * 20),
  ...(index % 5 === 0 && {
    media: [
      {
        uri: `https://images.pexels.com/photos/${140945 + index}/pexels-photo-${140945 + index}.jpeg?auto=compress&cs=tinysrgb&w=800`,
        type: 'image',
      },
    ],
  }),
}))

export default function Forum() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [posts, setPosts] = useState(MOCK_POSTS)
  const [activePost, setActivePost] = useState(null)
  const [activeAuthorPost, setActiveAuthorPost] = useState(null)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftIsAnon, setDraftIsAnon] = useState(true)
  const [draftMedia, setDraftMedia] = useState([])
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [showPostAsModal, setShowPostAsModal] = useState(false)
  const [selectedTag, setSelectedTag] = useState(null)
  const [draftLocation, setDraftLocation] = useState('Valley, RI') // Mock location
  const [draftTags, setDraftTags] = useState([])
  const [draftPoll, setDraftPoll] = useState(null)
  const [showPollBuilder, setShowPollBuilder] = useState(false)
  const [currentSchool, setCurrentSchool] = useState(params.schoolName || 'University of Rhode Island')
  const [currentForum, setCurrentForum] = useState(MOCK_FORUMS[0]) // Start with Main Forum
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
  
  const { getForumStories } = useStoriesContext()
  
  // Mock current user - replace with real auth
  const currentUser = {
    id: 'user-123',
    name: 'John Doe',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  }
  
  const currentForumId = currentForum?.id || 'forum-quad'
  
  // Filter posts for current forum
  const allPosts = useMemo(() => {
    // Filter regular posts by current forum
    const forumPosts = posts.filter((post) => {
      // If forum property exists, match it
      if (post.forum) {
        // Map forum names to forum IDs
        const forumMap = {
          'Quad': 'forum-quad',
          'Classes': 'forum-cs-201', // Default class forum
          'RMP': 'forum-quad',
          'Campus Life': 'forum-quad',
          'Dorms': 'forum-quad',
          'Library': 'forum-quad',
          'Clubs': 'forum-cs-club',
          'Random': 'forum-quad',
        }
        return forumMap[post.forum] === currentForumId || currentForumId === 'forum-quad'
      }
      // Default: show in main forum
      return currentForumId === 'forum-quad'
    })
    
    const regularPosts = forumPosts.map((post) => ({
      ...post,
      type: 'post',
      sortDate: new Date(post.createdAt || Date.now()),
    }))
    
    const sorted = regularPosts.sort((a, b) => b.sortDate - a.sortDate)
    
    // All posts are shown (no filter needed)
    let filtered = sorted
    
    // Apply tag filter
    if (tagFilter) {
      filtered = filtered.filter((item) => {
        return item.tags && item.tags.includes(tagFilter)
      })
    }
    
    return filtered
  }, [posts, currentForumId, tagFilter])
  
  // Update school if params change
  React.useEffect(() => {
    if (params.schoolName) {
      setCurrentSchool(params.schoolName)
    }
  }, [params.schoolName])
  const [isFavorited, setIsFavorited] = useState(false)
  const [comments, setComments] = useState(MOCK_COMMENTS)
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

  const handlePickMedia = async (kind) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          kind === 'image'
            ? ImagePicker.MediaType.Image
            : ImagePicker.MediaType.Video,
        allowsEditing: false,
        quality: 0.7,
      })

      if (result.canceled) return

      const asset = result.assets?.[0]
      if (!asset) return

      setDraftMedia((prev) => [
        ...prev,
        {
          uri: asset.uri,
          type: kind,
        },
      ])
    } catch (error) {
      console.log('Media pick error', error)
    }
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
              color={theme.colors.bondedPurple}
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
      <AppCard style={styles.postCard}>
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
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>
            {item.isAnon ? '?' : item.author.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>
            {item.isAnon ? 'Anonymous' : item.author}
          </Text>
          <Text style={styles.postMetaText}>
            {item.forum} • {item.timeAgo}
          </Text>
        </View>
      </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7}>
          <MoreHorizontal
            size={hp(2.4)}
            color={theme.colors.softBlack}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

        {/* Content */}
        <View style={styles.postBody}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text numberOfLines={3} style={styles.postBodyText}>
            {item.body}
          </Text>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <PostTags tags={item.tags} maxDisplay={2} />
          )}

          {/* Poll */}
          {polls[item.id] && (
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
                    size={hp(4)}
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

        {/* Actions */}
        <View style={styles.postActionsRow}>
        <View style={styles.postVotesRow}>
          <TouchableOpacity
            style={styles.voteButton}
            activeOpacity={0.7}
            onPress={() =>
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === item.id ? { ...p, upvotes: p.upvotes + 1 } : p
                )
              )
            }
          >
            <ArrowUpCircle
              size={hp(2.8)}
              color={item.upvotes > 0 ? '#2ecc71' : theme.colors.softBlack}
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
            onPress={() =>
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === item.id ? { ...p, upvotes: p.upvotes - 1 } : p
                )
              )
            }
          >
            <ArrowDownCircle
              size={hp(2.8)}
              color={item.upvotes < 0 ? '#e74c3c' : theme.colors.softBlack}
              strokeWidth={2}
              fill={item.upvotes < 0 ? '#e74c3c' : 'none'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.postCommentsButton}
          activeOpacity={0.7}
          onPress={() => setActivePost(item)}
        >
          <MessageCircle
            size={hp(2.2)}
            color={theme.colors.softBlack}
            strokeWidth={2}
          />
          <Text style={styles.postCommentsText}>
            {item.commentsCount} comments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postRepostButton}
          activeOpacity={0.7}
          onPress={() => {
            setRepostPost(item)
            setShowRepostModal(true)
          }}
        >
          <Repeat
            size={hp(2.2)}
            color={theme.colors.softBlack}
            strokeWidth={2}
          />
          {item.repostsCount > 0 && (
            <Text style={styles.repostCount}>{item.repostsCount}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postShareButton}
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
            size={hp(2.2)}
            color={theme.colors.softBlack}
            strokeWidth={2}
          />
        </TouchableOpacity>
        </View>
      </AppCard>
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
            unreadCount={MOCK_FORUMS.reduce((sum, f) => sum + f.unreadCount, 0)}
          />
        </View>

        <View style={styles.headerButton} />
      </View>

      {/* Tag Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagFilterRow}
      >
        <Chip
          label="All"
          active={tagFilter === null}
          onPress={() => setTagFilter(null)}
          style={styles.tagFilterChip}
        />
        {['Housing', 'Advice', 'Events', 'Clubs', 'Random', 'Confessions', 'STEM', 'Need Help'].map(
          (tag) => (
            <Chip
              key={tag}
              label={tag}
              active={tagFilter === tag}
              onPress={() => setTagFilter(tagFilter === tag ? null : tag)}
              style={styles.tagFilterChip}
            />
          )
        )}
      </ScrollView>

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
        <AnimatedFlatList
          data={allPosts}
          keyExtractor={(item) => item.id || item.event?.id}
          contentContainerStyle={styles.postsList}
          showsVerticalScrollIndicator={false}
          renderItem={renderPost}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={renderListHeader}
        />

        {/* Create Post FAB */}
        <TouchableOpacity
          style={styles.createPostFAB}
          onPress={() => setIsCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Add size={hp(2.5)} color={theme.colors.white} strokeWidth={2.5} />
        </TouchableOpacity>

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
                    <Text style={styles.postModalTitle}>{activePost.title}</Text>
                    <TouchableOpacity
                      onPress={() => setActivePost(null)}
                      style={styles.modalCloseButton}
                    >
                      <X
                        size={hp(2.6)}
                        color={theme.colors.charcoal}
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.postModalMeta}>
                    {activePost.isAnon ? 'Anonymous' : activePost.author} •{' '}
                    {activePost.forum} • {activePost.timeAgo}
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

                      <View style={styles.commentsHeader}>
                        <Text style={styles.commentsTitle}>Comments</Text>
                        <View style={styles.commentsHeaderRight}>
                          <Text style={styles.commentsCount}>
                            {activePost.commentsCount} total
                          </Text>
                          <View style={styles.sortButtons}>
                            <TouchableOpacity
                              style={[
                                styles.sortButton,
                                commentSort === 'best' && styles.sortButtonActive,
                              ]}
                              onPress={() => setCommentSort('best')}
                            >
                              <Text
                                style={[
                                  styles.sortButtonText,
                                  commentSort === 'best' && styles.sortButtonTextActive,
                                ]}
                              >
                                Best
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.sortButton,
                                commentSort === 'new' && styles.sortButtonActive,
                              ]}
                              onPress={() => setCommentSort('new')}
                            >
                              <Text
                                style={[
                                  styles.sortButtonText,
                                  commentSort === 'new' && styles.sortButtonTextActive,
                                ]}
                              >
                                New
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.sortButton,
                                commentSort === 'old' && styles.sortButtonActive,
                              ]}
                              onPress={() => setCommentSort('old')}
                            >
                              <Text
                                style={[
                                  styles.sortButtonText,
                                  commentSort === 'old' && styles.sortButtonTextActive,
                                ]}
                              >
                                Old
                              </Text>
                            </TouchableOpacity>
                          </View>
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
                            <View style={styles.commentHeader}>
                              <View style={styles.commentAuthorRow}>
                                <View style={styles.commentAvatar}>
                                  <Text style={styles.commentAvatarText}>
                                    {comment.isAnon ? '?' : comment.author.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={styles.commentAuthorInfo}>
                                  <Text style={styles.commentAuthorName}>
                                    {comment.isAnon ? 'Anonymous' : comment.author}
                                  </Text>
                                  <Text style={styles.commentMetaText}>
                                    {comment.timeAgo}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <Text style={styles.commentBody}>{comment.body}</Text>
                            <View style={styles.commentActions}>
                              <View style={styles.commentVotesRow}>
                                <TouchableOpacity
                                  style={styles.commentVoteButton}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    const currentVote = userVotes[comment.id]
                                    const newVote = currentVote === 'up' ? null : 'up'
                                    setUserVotes((prev) => ({ ...prev, [comment.id]: newVote }))
                                    setComments((prev) => ({
                                      ...prev,
                                      [activePost.id]: prev[activePost.id].map((c) => {
                                        if (c.id !== comment.id) return c
                                        let newUpvotes = c.upvotes
                                        let newDownvotes = c.downvotes
                                        if (currentVote === 'up') {
                                          newUpvotes = Math.max(0, newUpvotes - 1)
                                        } else if (currentVote === 'down') {
                                          newDownvotes = Math.max(0, newDownvotes - 1)
                                          newUpvotes += 1
                                        } else {
                                          newUpvotes += 1
                                        }
                                        return { ...c, upvotes: newUpvotes, downvotes: newDownvotes }
                                      }),
                                    }))
                                  }}
                                >
                                  <ArrowUpCircle
                                    size={hp(2.2)}
                                    color={userVotes[comment.id] === 'up' ? '#2ecc71' : theme.colors.softBlack}
                                    strokeWidth={2}
                                    fill={userVotes[comment.id] === 'up' ? '#2ecc71' : 'none'}
                                  />
                                </TouchableOpacity>
                                <Text
                                  style={[
                                    styles.commentVoteCount,
                                    (comment.upvotes - comment.downvotes) > 0 && styles.commentVotePositive,
                                    (comment.upvotes - comment.downvotes) < 0 && styles.commentVoteNegative,
                                  ]}
                                >
                                  {comment.upvotes - comment.downvotes}
                                </Text>
                                <TouchableOpacity
                                  style={styles.commentVoteButton}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    const currentVote = userVotes[comment.id]
                                    const newVote = currentVote === 'down' ? null : 'down'
                                    setUserVotes((prev) => ({ ...prev, [comment.id]: newVote }))
                                    setComments((prev) => ({
                                      ...prev,
                                      [activePost.id]: prev[activePost.id].map((c) => {
                                        if (c.id !== comment.id) return c
                                        let newUpvotes = c.upvotes
                                        let newDownvotes = c.downvotes
                                        if (currentVote === 'down') {
                                          newDownvotes = Math.max(0, newDownvotes - 1)
                                        } else if (currentVote === 'up') {
                                          newUpvotes = Math.max(0, newUpvotes - 1)
                                          newDownvotes += 1
                                        } else {
                                          newDownvotes += 1
                                        }
                                        return { ...c, upvotes: newUpvotes, downvotes: newDownvotes }
                                      }),
                                    }))
                                  }}
                                >
                                  <ArrowDownCircle
                                    size={hp(2.2)}
                                    color={userVotes[comment.id] === 'down' ? '#e74c3c' : theme.colors.softBlack}
                                    strokeWidth={2}
                                    fill={userVotes[comment.id] === 'down' ? '#e74c3c' : 'none'}
                                  />
                                </TouchableOpacity>
                              </View>
                              <TouchableOpacity
                                style={styles.replyButton}
                                activeOpacity={0.7}
                                onPress={() => setReplyingTo(comment.id)}
                              >
                                <MessageCircle
                                  size={hp(1.8)}
                                  color={theme.colors.softBlack}
                                  strokeWidth={2}
                                  style={{ marginRight: wp(1) }}
                                />
                                <Text style={styles.replyButtonText}>Reply</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <View style={styles.repliesContainer}>
                                {comment.replies.map((reply) => (
                                  <View key={reply.id} style={styles.replyCard}>
                                    <View style={styles.replyHeader}>
                                      <View style={styles.replyAuthorRow}>
                                        <View style={styles.replyAvatar}>
                                          <Text style={styles.replyAvatarText}>
                                            {reply.isAnon ? '?' : reply.author.charAt(0).toUpperCase()}
                                          </Text>
                                        </View>
                                        <View style={styles.replyAuthorInfo}>
                                          <Text style={styles.replyAuthorName}>
                                            {reply.isAnon ? 'Anonymous' : reply.author}
                                          </Text>
                                          <Text style={styles.replyMetaText}>
                                            {reply.timeAgo}
                                          </Text>
                                        </View>
                                      </View>
                                    </View>
                                    <Text style={styles.replyBody}>{reply.body}</Text>
                                    <View style={styles.replyActions}>
                                      <View style={styles.commentVotesRow}>
                                        <TouchableOpacity
                                          style={styles.commentVoteButton}
                                          activeOpacity={0.7}
                                          onPress={() => {
                                            const replyVoteKey = `${comment.id}-${reply.id}`
                                            const currentVote = userVotes[replyVoteKey]
                                            const newVote = currentVote === 'up' ? null : 'up'
                                            setUserVotes((prev) => ({ ...prev, [replyVoteKey]: newVote }))
                                            setComments((prev) => ({
                                              ...prev,
                                              [activePost.id]: prev[activePost.id].map((c) => {
                                                if (c.id !== comment.id) return c
                                                return {
                                                  ...c,
                                                  replies: c.replies.map((r) => {
                                                    if (r.id !== reply.id) return r
                                                    let newUpvotes = r.upvotes
                                                    let newDownvotes = r.downvotes
                                                    if (currentVote === 'up') {
                                                      newUpvotes = Math.max(0, newUpvotes - 1)
                                                    } else if (currentVote === 'down') {
                                                      newDownvotes = Math.max(0, newDownvotes - 1)
                                                      newUpvotes += 1
                                                    } else {
                                                      newUpvotes += 1
                                                    }
                                                    return { ...r, upvotes: newUpvotes, downvotes: newDownvotes }
                                                  }),
                                                }
                                              }),
                                            }))
                                          }}
                                        >
                                          <ArrowUpCircle
                                            size={hp(1.8)}
                                            color={userVotes[`${comment.id}-${reply.id}`] === 'up' ? '#2ecc71' : theme.colors.softBlack}
                                            strokeWidth={2}
                                            fill={userVotes[`${comment.id}-${reply.id}`] === 'up' ? '#2ecc71' : 'none'}
                                          />
                                        </TouchableOpacity>
                                        <Text
                                          style={[
                                            styles.commentVoteCount,
                                            { fontSize: hp(1.4) },
                                            (reply.upvotes - reply.downvotes) > 0 && styles.commentVotePositive,
                                            (reply.upvotes - reply.downvotes) < 0 && styles.commentVoteNegative,
                                          ]}
                                        >
                                          {reply.upvotes - reply.downvotes}
                                        </Text>
                                        <TouchableOpacity
                                          style={styles.commentVoteButton}
                                          activeOpacity={0.7}
                                          onPress={() => {
                                            const replyVoteKey = `${comment.id}-${reply.id}`
                                            const currentVote = userVotes[replyVoteKey]
                                            const newVote = currentVote === 'down' ? null : 'down'
                                            setUserVotes((prev) => ({ ...prev, [replyVoteKey]: newVote }))
                                            setComments((prev) => ({
                                              ...prev,
                                              [activePost.id]: prev[activePost.id].map((c) => {
                                                if (c.id !== comment.id) return c
                                                return {
                                                  ...c,
                                                  replies: c.replies.map((r) => {
                                                    if (r.id !== reply.id) return r
                                                    let newUpvotes = r.upvotes
                                                    let newDownvotes = r.downvotes
                                                    if (currentVote === 'down') {
                                                      newDownvotes = Math.max(0, newDownvotes - 1)
                                                    } else if (currentVote === 'up') {
                                                      newUpvotes = Math.max(0, newUpvotes - 1)
                                                      newDownvotes += 1
                                                    } else {
                                                      newDownvotes += 1
                                                    }
                                                    return { ...r, upvotes: newUpvotes, downvotes: newDownvotes }
                                                  }),
                                                }
                                              }),
                                            }))
                                          }}
                                        >
                                          <ArrowDownCircle
                                            size={hp(1.8)}
                                            color={userVotes[`${comment.id}-${reply.id}`] === 'down' ? '#e74c3c' : theme.colors.softBlack}
                                            strokeWidth={2}
                                            fill={userVotes[`${comment.id}-${reply.id}`] === 'down' ? '#e74c3c' : 'none'}
                                          />
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
                                  placeholderTextColor={theme.colors.softBlack}
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
                                        color={theme.colors.bondedPurple}
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
                                      onPress={() => {
                                        if (!replyText.trim()) return
                                        const newReply = {
                                          id: `reply-${comment.id}-${Date.now()}`,
                                          author: replyIsAnon ? 'Anon' : 'You',
                                          isAnon: replyIsAnon,
                                          body: replyText.trim(),
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
                                      }}
                                    >
                                      <Text style={styles.replySubmitText}>Reply</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>
                            )}
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
                        onPress={() => {
                          if (!newCommentText.trim()) return
                          const newComment = {
                            id: `comment-${activePost.id}-${Date.now()}`,
                            author: newCommentIsAnon ? 'Anon' : 'You',
                            isAnon: newCommentIsAnon,
                            body: newCommentText.trim(),
                            upvotes: 0,
                            downvotes: 0,
                            timeAgo: 'now',
                            replies: [],
                          }
                          setComments((prev) => ({
                            ...prev,
                            [activePost.id]: [...(prev[activePost.id] || []), newComment],
                          }))
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === activePost.id
                                ? { ...p, commentsCount: p.commentsCount + 1 }
                                : p
                            )
                          )
                          setNewCommentText('')
                          setNewCommentIsAnon(true)
                          Keyboard.dismiss()
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
                        color={theme.colors.charcoal}
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
                          color={theme.colors.bondedPurple}
                          strokeWidth={2}
                          style={{ marginRight: wp(1) }}
                        />
                        <Text style={styles.profileMetaPillText}>
                          {activeAuthorPost.upvotes} karma
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

        {/* New Post Modal - Fizz Style */}
        <Modal
          visible={isCreateModalVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setIsCreateModalVisible(false)}
        >
          <SafeAreaView style={styles.fizzModalSafeArea} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
              style={styles.fizzModalContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              {/* Header */}
              <View style={styles.fizzModalHeader}>
                <TouchableOpacity
                  onPress={() => setIsCreateModalVisible(false)}
                  activeOpacity={0.8}
                  style={styles.fizzHeaderButton}
                >
                  <X size={hp(2.5)} color={theme.colors.white} strokeWidth={2.5} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowPostAsModal(true)}
                  activeOpacity={0.8}
                  style={styles.fizzHeaderCenter}
                >
                  <View style={styles.fizzAnonymousRow}>
                    <View style={styles.fizzAnonymousIcon}>
                      <Person size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.fizzAnonymousText}>Anonymous</Text>
                    <ChevronDown size={hp(1.8)} color={theme.colors.white} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.fizzLocationText}>{draftLocation}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    if (!draftBody.trim()) {
                      setIsCreateModalVisible(false)
                      return
                    }

                    const newPost = {
                      id: `post-${Date.now()}`,
                      author: draftIsAnon ? 'Anon' : 'You',
                      isAnon: draftIsAnon,
                      title: draftTitle.trim() || '',
                      body: draftBody.trim(),
                      forum: 'Main Forum',
                      upvotes: 0,
                      commentsCount: 0,
                      timeAgo: 'now',
                      media: draftMedia,
                      tags: selectedTag ? [selectedTag] : [],
                      repostsCount: 0,
                    }

                    setPosts((prev) => [newPost, ...prev])
                    setDraftTitle('')
                    setDraftBody('')
                    setDraftIsAnon(true)
                    setDraftMedia([])
                    setSelectedTag(null)
                    setIsCreateModalVisible(false)
                  }}
                  style={styles.fizzPostButton}
                >
                  <Text style={styles.fizzPostButtonText}>Post</Text>
                </TouchableOpacity>
              </View>

              {/* Content Area - Dark Mode */}
              <View style={styles.fizzContentArea}>
                <TextInput
                  value={draftBody}
                  onChangeText={setDraftBody}
                  placeholder="Share what's really on your mind..."
                  placeholderTextColor={theme.colors.textSecondary}
                  style={styles.fizzTextInput}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </View>

              {/* Action Bar - Above Keyboard */}
              <View style={styles.fizzActionBar}>
                <TouchableOpacity
                  style={styles.fizzTagButton}
                  onPress={() => setShowTagSelector(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.fizzTagButtonText}>+ Tag</Text>
                </TouchableOpacity>

                <View style={styles.fizzMediaIconsRow}>
                  <TouchableOpacity
                    style={styles.fizzMediaIcon}
                    onPress={() => handlePickMedia('image')}
                    activeOpacity={0.7}
                  >
                    <ImageIcon size={hp(2.5)} color={theme.colors.white} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fizzMediaIcon}
                    onPress={() => handlePickMedia('video')}
                    activeOpacity={0.7}
                  >
                    <Video size={hp(2.5)} color={theme.colors.white} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fizzMediaIcon}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fizzMemeText}>MEME</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fizzMediaIcon}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fizzGifText}>GIF</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Selected Tag Display */}
              {selectedTag && (
                <View style={styles.fizzSelectedTag}>
                  <Text style={styles.fizzSelectedTagText}>{selectedTag}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedTag(null)}
                    activeOpacity={0.8}
                  >
                    <X size={hp(1.8)} color={theme.colors.white} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>

        {/* Tag Selector Modal - Fizz Style */}
        <Modal
          visible={showTagSelector}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTagSelector(false)}
        >
          <Pressable
            style={styles.tagModalOverlay}
            onPress={() => setShowTagSelector(false)}
          >
            <View style={styles.tagModalContent}>
              <View style={styles.tagModalHeader}>
                <Text style={styles.tagModalTitle}>Select Tag</Text>
                <TouchableOpacity
                  onPress={() => setShowTagSelector(false)}
                  activeOpacity={0.8}
                >
                  <X size={hp(2.5)} color={theme.colors.white} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.tagList} contentContainerStyle={styles.tagListContent}>
                {[
                  { label: 'QUESTION', color: '#007AFF' },
                  { label: 'CONFESSION', color: '#FF6B6B' },
                  { label: 'CRUSH', color: '#FF69B4' },
                  { label: 'DM ME', color: '#00CED1' },
                  { label: 'EVENT', color: '#FF9500' },
                  { label: 'PSA', color: '#FF3B30' },
                  { label: 'SHOUTOUT', color: '#34C759' },
                  { label: 'DUB', color: '#FFD700' },
                  { label: 'RIP', color: '#808080' },
                  { label: 'MEME', color: '#A45CFF' },
                  { label: 'LOST & FOUND', color: '#D2691E' },
                ].map((tag) => (
                  <TouchableOpacity
                    key={tag.label}
                    style={[styles.fizzTagPill, { backgroundColor: tag.color }]}
                    onPress={() => {
                      setSelectedTag(tag.label)
                      setShowTagSelector(false)
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.fizzTagPillText}>{tag.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        {/* Post As Modal - Fizz Style */}
        <Modal
          visible={showPostAsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPostAsModal(false)}
        >
          <Pressable
            style={styles.postAsModalOverlay}
            onPress={() => setShowPostAsModal(false)}
          >
            <View style={styles.postAsModalContent}>
              <View style={styles.postAsModalHandle} />
              <Text style={styles.postAsModalTitle}>Post as</Text>
              
              {/* Location Option */}
              <TouchableOpacity
                style={styles.postAsOption}
                activeOpacity={0.8}
              >
                <View style={styles.postAsIcon}>
                  <MapPin size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
                </View>
                <View style={styles.postAsOptionText}>
                  <Text style={styles.postAsOptionTitle}>{draftLocation}</Text>
                  <Text style={styles.postAsOptionSubtitle}>Not accurate? Update location</Text>
                </View>
              </TouchableOpacity>

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
                </View>
                {draftIsAnon && (
                  <View style={styles.postAsCheck}>
                    <Check size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Create Handle Option */}
              <TouchableOpacity
                style={styles.postAsOption}
                activeOpacity={0.8}
                onPress={() => {
                  setDraftIsAnon(false)
                  setShowPostAsModal(false)
                }}
              >
                <View style={styles.postAsIcon}>
                  <Add size={hp(2)} color={theme.colors.white} strokeWidth={2.5} />
                </View>
                <View style={styles.postAsOptionText}>
                  <Text style={styles.postAsOptionTitle}>Create a handle</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Pressable>
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


        <BottomNav scrollY={scrollY} />

        {/* Forum Selector Modal */}
        <ForumSelectorModal
          visible={isForumSelectorVisible}
          forums={MOCK_FORUMS}
          currentForumId={currentForumId}
          onSelectForum={(forum) => {
            setCurrentForum(forum)
            // Filter posts by forum if needed
          }}
          onClose={() => setIsForumSelectorVisible(false)}
          onCreateForum={() => {
            router.push('/create-forum')
          }}
        />

        {/* Repost Modal */}
        <RepostModal
          visible={showRepostModal}
          post={repostPost}
          onClose={() => {
            setShowRepostModal(false)
            setRepostPost(null)
          }}
          onRepost={(repostData) => {
            // Update post repost count
            setPosts((prev) =>
              prev.map((p) =>
                p.id === repostData.postId
                  ? { ...p, repostsCount: (p.repostsCount || 0) + 1 }
                  : p
              )
            )
            // TODO: Save repost to backend
            console.log('Reposting:', repostData)
          }}
          groups={[]} // TODO: Get user's groups
        />
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
    marginBottom: hp(2.5),
    position: 'relative',
  },
  storiesGradient: {
    paddingVertical: hp(1),
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
    backgroundColor: theme.colors.white,
    borderWidth: 2.5,
    borderColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.8),
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.bondedPurple,
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
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  storyLabel: {
    fontSize: hp(1.3),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
  },
  listHeader: {
    paddingTop: hp(1),
    paddingBottom: hp(2),
  },
  postsList: {
    paddingBottom: hp(10),
    paddingHorizontal: 0,
  },
  postCard: {
    marginHorizontal: wp(4),
    marginBottom: hp(3), // Increased spacing
    paddingVertical: hp(2), // Increased padding
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5), // Increased spacing
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: wp(2),
  },
  postAvatar: {
    width: hp(5.5), // Increased size
    height: hp(5.5), // Increased size
    borderRadius: hp(2.75),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3), // Increased spacing
    opacity: 0.15,
  },
  postAvatarText: {
    fontSize: hp(2.3), // Increased size
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: hp(2), // Increased size
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
  },
  postMetaText: {
    fontSize: hp(1.5), // Increased size
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.2),
    fontWeight: '400',
  },
  postBody: {
    marginBottom: hp(1.5), // Increased spacing
  },
  postTitle: {
    fontSize: hp(2.2), // Increased size
    fontWeight: '700', // Bolder
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(1), // Increased spacing
    lineHeight: hp(2.8), // Increased line height
  },
  postBodyText: {
    fontSize: hp(1.9), // Increased size
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.8), // Increased line height
    marginTop: hp(0.5),
  },
  postMediaPreview: {
    marginTop: hp(1.2),
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
    // Clean, minimal - no shadows
  },
  postMediaImage: {
    width: '100%',
    height: hp(35), // Increased size (Instagram/Fizz style)
    resizeMode: 'cover',
  },
  postMediaVideo: {
    width: '100%',
    height: hp(35), // Increased size
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.charcoal,
  },
  postMediaVideoText: {
    marginTop: hp(0.5),
    fontSize: hp(1.6),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(1.5), // Increased spacing
    paddingTop: hp(1.2),
  },
  postVotesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  voteButton: {
    padding: hp(0.8),
    borderRadius: theme.radius.full,
  },
  postVoteCount: {
    fontSize: hp(1.7), // Increased size
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600', // Bolder
    minWidth: wp(6),
    textAlign: 'center',
  },
  postVotePositive: {
    color: theme.colors.success,
  },
  postVoteNegative: {
    color: theme.colors.error,
  },
  postCommentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    padding: hp(0.8),
    borderRadius: theme.radius.full,
  },
  postCommentsText: {
    fontSize: hp(1.7), // Increased size
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500', // Slightly bolder
  },
  createPostFAB: {
    position: 'absolute',
    bottom: hp(12), // Above BottomNav
    right: wp(4),
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  postModalContent: {
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.white,
  },
  createModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  fizzModalSafeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fizzModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fizzModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: hp(1), // Reduced since SafeAreaView handles top inset
    paddingBottom: hp(1.5),
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
    color: theme.colors.white,
  },
  fizzLocationText: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginTop: hp(0.3),
  },
  fizzPostButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.white,
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
    paddingTop: hp(2),
  },
  fizzTextInput: {
    flex: 1,
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.white,
    minHeight: hp(40),
  },
  fizzActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  fizzTagButton: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fizzTagButtonText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  fizzMediaIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  fizzMediaIcon: {
    width: hp(4),
    height: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  fizzMemeText: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  fizzGifText: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  fizzSelectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: wp(2),
  },
  fizzSelectedTagText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  tagModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: theme.radius.xl,
    padding: wp(4),
  },
  tagModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  tagModalTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.white,
  },
  tagList: {
    maxHeight: hp(50),
  },
  tagListContent: {
    gap: hp(1.5),
  },
  fizzTagPill: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.pill,
    alignItems: 'center',
  },
  fizzTagPillText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  postAsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  postAsModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingBottom: hp(4),
  },
  postAsModalHandle: {
    width: wp(12),
    height: hp(0.5),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: theme.radius.pill,
    alignSelf: 'center',
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  postAsModalTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.white,
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
    color: theme.colors.white,
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
    color: theme.colors.charcoal,
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
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagPollToggleButtonActive: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.bondedPurple,
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
    color: theme.colors.charcoal,
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
    backgroundColor: theme.colors.white,
  },
  postFooterButton: {
    width: '100%',
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.offWhite,
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
    color: theme.colors.charcoal,
  },
  postModalTitle: {
    flex: 1,
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginRight: wp(2),
  },
  postModalMeta: {
    fontSize: hp(1.5),
    color: theme.colors.softBlack,
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
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.6),
    marginBottom: hp(2),
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  commentsTitle: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
  },
  commentsCount: {
    fontSize: hp(1.5),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
  },
  commentsList: {
    gap: hp(1.5),
  },
  commentCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: wp(4.5),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: 'rgba(164, 92, 255, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.8),
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    width: hp(3.2),
    height: hp(3.2),
    borderRadius: hp(1.6),
    backgroundColor: theme.colors.bondedPurple,
    opacity: 0.12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.5),
  },
  commentAvatarText: {
    fontSize: hp(1.5),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  commentAuthorInfo: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: hp(1.6),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
  },
  commentMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.softBlack,
    opacity: 0.8,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.1),
  },
  commentBody: {
    fontSize: hp(1.8),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.5),
    marginBottom: hp(1),
    opacity: 0.95,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(0.5),
  },
  commentVotesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  commentVoteButton: {
    padding: hp(0.5),
    borderRadius: theme.radius.sm,
  },
  commentVoteCount: {
    fontSize: hp(1.5),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    minWidth: wp(4),
    textAlign: 'center',
  },
  commentVotePositive: {
    color: '#2ecc71',
  },
  commentVoteNegative: {
    color: '#e74c3c',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(2.5),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.offWhite,
  },
  replyButtonText: {
    fontSize: hp(1.5),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: hp(1.5),
    marginLeft: wp(4),
    paddingLeft: wp(3),
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.offWhite,
    gap: hp(1),
  },
  replyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: wp(3.5),
    marginBottom: hp(0.8),
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.bondedPurple,
    borderWidth: 1,
    borderColor: 'rgba(164, 92, 255, 0.1)',
  },
  replyHeader: {
    marginBottom: hp(0.5),
  },
  replyAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyAvatar: {
    width: hp(2.2),
    height: hp(2.2),
    borderRadius: hp(1.1),
    backgroundColor: theme.colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(1.5),
  },
  replyAvatarText: {
    fontSize: hp(1.1),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  replyAuthorInfo: {
    flex: 1,
  },
  replyAuthorName: {
    fontSize: hp(1.5),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
  },
  replyMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.softBlack,
    opacity: 0.85,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.1),
  },
  replyBody: {
    fontSize: hp(1.7),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.3),
    marginBottom: hp(0.5),
    opacity: 0.95,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyInputContainer: {
    marginTop: hp(1),
    padding: wp(3),
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  replyInput: {
    fontSize: hp(1.7),
    color: theme.colors.charcoal,
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
    color: theme.colors.softBlack,
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
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  newCommentInput: {
    fontSize: hp(1.7),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    backgroundColor: '#F2F2F7',
    borderRadius: hp(1.2),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    minHeight: hp(6),
    maxHeight: hp(12),
    marginBottom: hp(1),
    textAlignVertical: 'top',
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
        shadowColor: theme.colors.bondedPurple,
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
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.bondedPurple,
  },
  anonPillActiveSmall: {
    backgroundColor: theme.colors.bondedPurple,
    borderWidth: 0,
  },
  anonPillTextSmall: {
    fontSize: hp(1.4),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  emptyCommentsBox: {
    paddingVertical: hp(3),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(164, 92, 255, 0.08)',
    borderStyle: 'dashed',
  },
  emptyCommentsText: {
    fontSize: hp(1.8),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.7,
    textAlign: 'center',
  },
  profileModalContent: {
    backgroundColor: theme.colors.white,
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
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
  },
  profileSubText: {
    marginTop: hp(0.5),
    fontSize: hp(1.7),
    color: theme.colors.softBlack,
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
    backgroundColor: theme.colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.8),
  },
  profileAvatarLargeText: {
    fontSize: hp(3),
    color: theme.colors.charcoal,
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
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.radius.pill,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
  },
  profileMetaPillText: {
    fontSize: hp(1.6),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
  },
  profileSection: {
    marginBottom: hp(1.8),
  },
  profileSectionLabel: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.6),
  },
  profileQuote: {
    fontSize: hp(1.8),
    color: theme.colors.charcoal,
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
    backgroundColor: theme.colors.offWhite,
  },
  profilePrimaryButton: {
    backgroundColor: theme.colors.bondedPurple,
  },
  profileSecondaryText: {
    fontSize: hp(1.8),
    color: theme.colors.bondedPurple,
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
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.5),
  },
  inputHint: {
    fontSize: hp(1.4),
    color: theme.colors.softBlack,
    opacity: 0.8,
    fontFamily: theme.typography.fontFamily.body,
  },
  textInput: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
    backgroundColor: theme.colors.white,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    fontSize: hp(1.7),
    color: theme.colors.charcoal,
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
    backgroundColor: theme.colors.offWhite,
  },
  mediaButtonText: {
    fontSize: hp(1.6),
    color: theme.colors.bondedPurple,
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
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.bondedPurple,
    gap: wp(1.5),
  },
  optionalFeatureButtonActive: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.bondedPurple,
  },
  optionalFeatureButtonText: {
    fontSize: hp(1.5),
    color: theme.colors.bondedPurple,
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
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(1.5),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  composeInput: {
    flex: 1,
    fontSize: hp(1.8),
    color: theme.colors.charcoal,
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
    color: theme.colors.softBlack,
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
    backgroundColor: theme.colors.offWhite,
    borderWidth: 1,
    borderColor: theme.colors.bondedPurple,
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
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
  },
  draftMediaItem: {
    marginRight: wp(2),
  },
  draftMediaImage: {
    width: wp(16),
    height: wp(16),
    borderRadius: theme.radius.md,
    resizeMode: 'cover',
  },
  draftMediaVideo: {
    width: wp(16),
    height: wp(16),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftMediaRemove: {
    position: 'absolute',
    top: -hp(0.8),
    right: -hp(0.8),
  },
  tagFilterRow: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(0.5),
    gap: wp(2),
  },
  tagFilterChip: {
    marginRight: wp(2),
  },
  postRepostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    padding: hp(0.8),
    borderRadius: theme.radius.full,
  },
  repostCount: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
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
    backgroundColor: theme.colors.offWhite,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    gap: wp(1.5),
  },
  addPollText: {
    fontSize: hp(1.6),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  commentsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  sortButtons: {
    flexDirection: 'row',
    gap: wp(1),
    marginLeft: wp(2),
  },
  sortButton: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.offWhite,
  },
  sortButtonActive: {
    backgroundColor: theme.colors.bondedPurple,
  },
  sortButtonText: {
    fontSize: hp(1.3),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
})


