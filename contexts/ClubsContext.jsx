import React, { createContext, useContext, useState } from 'react'

const ClubsContext = createContext()

// TODO: Remove generateMockClubs - clubs should come from Supabase
// Mock data removed - using real Supabase data
const generateMockClubs = () => {
  // Return empty - clubs should come from Supabase
  return {}
  const clubs = {}
  
  const createClub = (id, name, description, category, members, leadership, isPublic, requiresApproval, coverImage = null, admins = []) => {
    clubs[id] = {
      id,
      name,
      description,
      category,
      members,
      leadership,
      isPublic,
      requiresApproval,
      coverImage,
      admins,
      forumId: `club-forum-${id}`,
      createdAt: new Date().toISOString(),
      posts: [],
      events: [],
      requests: [],
      interested: [],
    }
  }

  createClub(
    'club-1',
    'CS Club',
    'A community for CS students to collaborate, learn, and build projects together.',
    'academic',
    ['user-123', 'user-1', 'user-2', 'user-3', 'user-4'],
    [{ userId: 'user-123', role: 'President', name: 'You' }],
    true,
    false,
    'https://picsum.photos/seed/cs-club/800/400',
    ['user-123']
  )

  createClub(
    'club-2',
    'Basketball Team',
    'Join us for weekly games, tournaments, and team practices.',
    'sports',
    ['user-5', 'user-6', 'user-7'],
    [
      { userId: 'user-5', role: 'Captain', name: 'Mike Chen' },
      { userId: 'user-6', role: 'Coach', name: 'Sarah Williams' },
    ],
    true,
    true,
    'https://picsum.photos/seed/basketball/800/400'
  )

  createClub(
    'club-3',
    'Debate Society',
    'Engage in intellectual discussions and competitive debate tournaments.',
    'academic',
    ['user-8', 'user-9', 'user-10'],
    [{ userId: 'user-8', role: 'President', name: 'Emily Davis' }],
    true,
    false,
    'https://picsum.photos/seed/debate/800/400'
  )

  createClub(
    'club-4',
    'Photography Club',
    'Share your passion for photography, learn new techniques, and explore campus.',
    'arts',
    ['user-11', 'user-12', 'user-13', 'user-14', 'user-15'],
    [
      { userId: 'user-11', role: 'President', name: 'David Kim' },
      { userId: 'user-12', role: 'Vice President', name: 'Jessica Lee' },
    ],
    true,
    false,
    'https://picsum.photos/seed/photography/800/400'
  )

  createClub(
    'club-5',
    'Environmental Action Group',
    'Working together to make our campus and community more sustainable.',
    'service',
    ['user-16', 'user-17', 'user-18'],
    [{ userId: 'user-16', role: 'Coordinator', name: 'Olivia Brown' }],
    true,
    true,
    'https://picsum.photos/seed/environment/800/400'
  )

  createClub(
    'club-6',
    'Music Production Society',
    'Create, collaborate, and share music with fellow producers and artists.',
    'arts',
    ['user-19', 'user-20'],
    [{ userId: 'user-19', role: 'Founder', name: 'Ryan Taylor' }],
    true,
    false,
    'https://picsum.photos/seed/music/800/400'
  )

  createClub(
    'club-7',
    'Entrepreneurship Club',
    'Network with aspiring entrepreneurs and learn from successful founders.',
    'business',
    ['user-21', 'user-22', 'user-23', 'user-24'],
    [
      { userId: 'user-21', role: 'President', name: 'Chris Wilson' },
      { userId: 'user-22', role: 'Treasurer', name: 'Sophia Martinez' },
    ],
    true,
    true,
    'https://picsum.photos/seed/entrepreneurship/800/400'
  )

  createClub(
    'club-8',
    'Chess Club',
    'Weekly games, tournaments, and strategy sessions for all skill levels.',
    'academic',
    ['user-25', 'user-26'],
    [{ userId: 'user-25', role: 'President', name: 'Noah Anderson' }],
    true,
    false,
    'https://picsum.photos/seed/chess/800/400'
  )

  return clubs
}

export function ClubsProvider({ children }) {
  const [clubs, setClubs] = useState(generateMockClubs())
  const [userMemberships, setUserMemberships] = useState({})
  const [userRequests, setUserRequests] = useState({})
  const [userInterests, setUserInterests] = useState({})

  // Mock current user - replace with real auth
  const currentUserId = 'user-123'

  const getAllClubs = () => {
    return Object.values(clubs)
  }

  const getClub = (clubId) => {
    return clubs[clubId] || null
  }

  const getClubsByCategory = (category) => {
    return Object.values(clubs).filter((club) => club.category === category)
  }

  const isUserMember = (clubId, userId = currentUserId) => {
    const club = clubs[clubId]
    if (!club) return false
    return club.members.includes(userId) || userMemberships[clubId]?.includes(userId)
  }

  const hasUserRequested = (clubId, userId = currentUserId) => {
    return userRequests[clubId]?.includes(userId) || clubs[clubId]?.requests?.includes(userId)
  }

  const isUserInterested = (clubId, userId = currentUserId) => {
    return userInterests[clubId]?.includes(userId) || clubs[clubId]?.interested?.includes(userId)
  }

  const requestToJoin = (clubId, userId = currentUserId) => {
    const club = clubs[clubId]
    if (!club) return false

    if (club.requiresApproval) {
      setUserRequests((prev) => ({
        ...prev,
        [clubId]: [...(prev[clubId] || []), userId],
      }))
      setClubs((prev) => ({
        ...prev,
        [clubId]: {
          ...prev[clubId],
          requests: [...(prev[clubId].requests || []), userId],
        },
      }))
    } else {
      // Auto-approve for public clubs
      setUserMemberships((prev) => ({
        ...prev,
        [clubId]: [...(prev[clubId] || []), userId],
      }))
      setClubs((prev) => ({
        ...prev,
        [clubId]: {
          ...prev[clubId],
          members: [...prev[clubId].members, userId],
        },
      }))
    }
    return true
  }

  const showInterest = (clubId, userId = currentUserId) => {
    setUserInterests((prev) => ({
      ...prev,
      [clubId]: [...(prev[clubId] || []), userId],
    }))
    setClubs((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        interested: [...(prev[clubId].interested || []), userId],
      },
    }))
  }

  const removeInterest = (clubId, userId = currentUserId) => {
    setUserInterests((prev) => ({
      ...prev,
      [clubId]: (prev[clubId] || []).filter((id) => id !== userId),
    }))
    setClubs((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        interested: (prev[clubId].interested || []).filter((id) => id !== userId),
      },
    }))
  }

  const approveRequest = (clubId, userId) => {
    setUserRequests((prev) => ({
      ...prev,
      [clubId]: (prev[clubId] || []).filter((id) => id !== userId),
    }))
    setUserMemberships((prev) => ({
      ...prev,
      [clubId]: [...(prev[clubId] || []), userId],
    }))
    setClubs((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        requests: (prev[clubId].requests || []).filter((id) => id !== userId),
        members: [...prev[clubId].members, userId],
      },
    }))
  }

  const rejectRequest = (clubId, userId) => {
    setUserRequests((prev) => ({
      ...prev,
      [clubId]: (prev[clubId] || []).filter((id) => id !== userId),
    }))
    setClubs((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        requests: (prev[clubId].requests || []).filter((id) => id !== userId),
      },
    }))
  }

  const leaveClub = (clubId, userId = currentUserId) => {
    setUserMemberships((prev) => ({
      ...prev,
      [clubId]: (prev[clubId] || []).filter((id) => id !== userId),
    }))
    setClubs((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        members: (prev[clubId].members || []).filter((id) => id !== userId),
      },
    }))
  }

  const getUserClubs = (userId = currentUserId) => {
    return Object.values(clubs).filter((club) => isUserMember(club.id, userId))
  }

  const removeMember = (clubId, userId) => {
    // Only admins can remove members
    const club = clubs[clubId]
    if (!club || !isUserAdmin(clubId)) {
      return false
    }
    
    // Don't allow removing admins
    if (club.admins && club.admins.includes(userId)) {
      return false
    }
    
    setUserMemberships((prev) => ({
      ...prev,
      [clubId]: (prev[clubId] || []).filter((id) => id !== userId),
    }))
    setClubs((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        members: (prev[clubId].members || []).filter((id) => id !== userId),
      },
    }))
    return true
  }

  const getAdminClubs = (userId = currentUserId) => {
    return Object.values(clubs).filter((club) => isUserAdmin(club.id, userId))
  }

  const isUserAdmin = (clubId, userId = currentUserId) => {
    const club = clubs[clubId]
    if (!club) return false
    // Check if user is in admins array or in leadership
    return (club.admins || []).includes(userId) || 
           (club.leadership || []).some(leader => leader.userId === userId)
  }

  const addAdmin = (clubId, userId) => {
    setClubs((prev) => {
      const club = prev[clubId]
      if (!club) return prev
      return {
        ...prev,
        [clubId]: {
          ...club,
          admins: [...(club.admins || []), userId],
        },
      }
    })
  }

  const removeAdmin = (clubId, userId) => {
    setClubs((prev) => {
      const club = prev[clubId]
      if (!club) return prev
      return {
        ...prev,
        [clubId]: {
          ...club,
          admins: (club.admins || []).filter((id) => id !== userId),
        },
      }
    })
  }

  const createClub = (clubData) => {
    const clubId = `club-${Date.now()}`
    const newClub = {
      id: clubId,
      name: clubData.name,
      description: clubData.description,
      category: clubData.category,
      isPublic: clubData.isPublic !== undefined ? clubData.isPublic : true,
      requiresApproval: clubData.requiresApproval !== undefined ? clubData.requiresApproval : false,
      coverImage: clubData.coverImage || null,
      avatar: clubData.avatar || null,
      meetingTimes: clubData.meetingTimes || null,
      meetingLocation: clubData.meetingLocation || null,
      locationCoords: clubData.locationCoords || null,
      isMeetingPublic: clubData.isMeetingPublic !== undefined ? clubData.isMeetingPublic : true,
      members: [currentUserId], // Creator is automatically a member
      leadership: [{ userId: currentUserId, role: 'Founder', name: 'You' }],
      admins: [currentUserId], // Creator is automatically an admin
      forumId: `club-forum-${clubId}`,
      createdAt: new Date().toISOString(),
      posts: [],
      events: [],
      requests: [],
      interested: [],
    }

    setClubs((prev) => ({
      ...prev,
      [clubId]: newClub,
    }))

    // Creator is automatically a member
    setUserMemberships((prev) => ({
      ...prev,
      [clubId]: [currentUserId],
    }))

    return clubId
  }

  const addClubPost = (clubId, post) => {
    setClubs((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        posts: [
          {
            ...post,
            id: `post-${Date.now()}`,
            createdAt: new Date().toISOString(),
          },
          ...(prev[clubId].posts || []),
        ],
      },
    }))
  }

  const addClubEvent = (clubId, eventId) => {
    setClubs((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        events: [...(prev[clubId].events || []), eventId],
      },
    }))
  }

  return (
    <ClubsContext.Provider
      value={{
        clubs,
        getAllClubs,
        getClub,
        getClubsByCategory,
        isUserMember,
        hasUserRequested,
        isUserInterested,
        requestToJoin,
        showInterest,
        removeInterest,
        approveRequest,
        rejectRequest,
        leaveClub,
        getUserClubs,
        getAdminClubs,
        isUserAdmin,
        addAdmin,
        removeMember,
        removeAdmin,
        addClubPost,
        addClubEvent,
        createClub,
        currentUserId,
      }}
    >
      {children}
    </ClubsContext.Provider>
  )
}

export const useClubsContext = () => {
  const context = useContext(ClubsContext)
  if (!context) {
    throw new Error('useClubsContext must be used within ClubsProvider')
  }
  return context
}

