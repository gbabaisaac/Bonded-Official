import { useQuery } from '@tanstack/react-query'

/**
 * Mock events data for development/demo
 * Returns events matching the design images
 */
const generateMockEvents = () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const createDate = (daysFromToday, hours, minutes = 0) => {
    const date = new Date(today)
    date.setDate(date.getDate() + daysFromToday)
    date.setHours(hours, minutes, 0, 0)
    return date.toISOString()
  }
  
  const createEndDate = (daysFromToday, hours, minutes = 0, durationHours = 2) => {
    const date = new Date(today)
    date.setDate(date.getDate() + daysFromToday)
    date.setHours(hours + durationHours, minutes, 0, 0)
    return date.toISOString()
  }

  return [
    {
      id: 'event-spring-festival',
      title: 'Spring Music Festival',
      description: 'Join us for an amazing day of live music to celebrate the arrival of spring! Featuring performances by local bands and artists across multiple stages.',
      image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop',
      start_at: createDate(3, 16, 0), // Saturday, April 27, 4:00 PM
      end_at: createEndDate(3, 16, 0, 4),
      location_name: 'Main Quad',
      location_address: 'University of Rhode Island',
      visibility: 'public',
      is_paid: false,
      requires_approval: false,
      hide_guest_list: false,
      allow_sharing: true,
      org: {
        id: 'org-music-society',
        name: 'Music Society',
        avatar_url: null,
      },
      attendees_count: 56,
      ticket_types: [],
    },
    {
      id: 'event-art-exhibition',
      title: 'Art Exhibition',
      description: 'Student art showcase featuring works from across all disciplines. Free admission.',
      image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop',
      start_at: createDate(0, 13, 0), // Today, 1:00 PM
      end_at: createEndDate(0, 13, 0, 3),
      location_name: 'Arts Building, Gallery 1',
      location_address: 'University of Rhode Island',
      visibility: 'org_only',
      is_paid: false,
      requires_approval: true,
      hide_guest_list: false,
      allow_sharing: true,
      org: {
        id: 'org-art-club',
        name: 'Art Club',
        avatar_url: null,
      },
      attendees_count: 12,
      ticket_types: [],
    },
    {
      id: 'event-beach-cleanup',
      title: 'Volunteer Beach Cleanup',
      description: 'Help keep our beaches clean! Join us for a morning of community service and environmental stewardship.',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop',
      start_at: createDate(2, 10, 0), // Friday, 10:00 AM
      end_at: createEndDate(2, 10, 0, 3),
      location_name: 'Narragansett Beach',
      location_address: 'Narragansett, RI',
      visibility: 'public',
      is_paid: true,
      requires_approval: false,
      hide_guest_list: false,
      allow_sharing: true,
      org: {
        id: 'org-green-team',
        name: 'Green Team',
        avatar_url: null,
      },
      attendees_count: 28,
      ticket_types: [
        {
          id: 'ticket-general',
          name: 'General Admission',
          price_cents: 2000,
          currency: 'USD',
          quantity: 100,
        },
      ],
    },
    {
      id: 'event-charity-gala',
      title: 'Charity Gala',
      description: 'Annual fundraising gala supporting local charities. Formal attire requested.',
      image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
      start_at: createDate(6, 17, 0), // Thursday, May 2, 5:00 PM
      end_at: createEndDate(6, 17, 0, 4),
      location_name: 'Convention Center',
      location_address: 'Providence, RI',
      visibility: 'public',
      is_paid: true,
      requires_approval: false,
      hide_guest_list: false,
      allow_sharing: true,
      org: null,
      attendees_count: 145,
      ticket_types: [
        {
          id: 'ticket-vip',
          name: 'VIP',
          price_cents: 10000,
          currency: 'USD',
          quantity: 50,
        },
        {
          id: 'ticket-standard',
          name: 'Standard',
          price_cents: 5000,
          currency: 'USD',
          quantity: 200,
        },
      ],
    },
    {
      id: 'event-cooking-class',
      title: 'Cooking Class',
      description: 'Join us for a fun and interactive cooking class where you will learn to make delicious dishes!',
      image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=400&fit=crop',
      start_at: createDate(10, 21, 0), // May 28, 9:00 PM
      end_at: createEndDate(10, 21, 0, 2),
      location_name: '123 Example St',
      location_address: 'Kingston, RI',
      visibility: 'org_only',
      is_paid: true,
      requires_approval: false,
      hide_guest_list: false,
      allow_sharing: true,
      org: {
        id: 'org-culinary',
        name: 'Culinary Club',
        avatar_url: null,
      },
      attendees_count: 8,
      ticket_types: [
        {
          id: 'ticket-cooking',
          name: 'General Admission',
          price_cents: 1500,
          currency: 'USD',
          quantity: 20,
        },
      ],
    },
    {
      id: 'event-hackathon',
      title: 'CS Club Hackathon',
      description: '24-hour coding competition with prizes! Build something amazing with your team.',
      image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
      start_at: createDate(1, 9, 0), // Tomorrow, 9:00 AM
      end_at: createEndDate(1, 9, 0, 24),
      location_name: 'Engineering Building, Lab 301',
      location_address: 'University of Rhode Island',
      visibility: 'public',
      is_paid: false,
      requires_approval: false,
      hide_guest_list: false,
      allow_sharing: true,
      org: {
        id: 'org-cs-club',
        name: 'CS Club',
        avatar_url: null,
      },
      attendees_count: 45,
      ticket_types: [],
    },
    {
      id: 'event-study-session',
      title: 'Study Group: Calculus',
      description: 'Review session for midterm exam. Bring your notes and questions!',
      image_url: null,
      start_at: createDate(0, 14, 0), // Today, 2:00 PM
      end_at: createEndDate(0, 14, 0, 2),
      location_name: 'Library, Study Room 3',
      location_address: 'University of Rhode Island',
      visibility: 'public',
      is_paid: false,
      requires_approval: false,
      hide_guest_list: false,
      allow_sharing: true,
      org: null,
      attendees_count: 5,
      ticket_types: [],
    },
    {
      id: 'event-friday-party',
      title: 'Friday Night Party',
      description: 'End of week celebration! Music, food, and fun.',
      image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop',
      start_at: createDate(1, 20, 0), // Tomorrow, 8:00 PM
      end_at: createEndDate(1, 20, 0, 4),
      location_name: 'Off-campus: 123 Main St',
      location_address: 'Kingston, RI',
      visibility: 'public',
      is_paid: false,
      requires_approval: false,
      hide_guest_list: false,
      allow_sharing: true,
      org: null,
      attendees_count: 89,
      ticket_types: [],
    },
  ]
}

/**
 * Hook to get mock events for development
 */
export function useMockEvents() {
  return useQuery({
    queryKey: ['mockEvents'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300))
      return generateMockEvents()
    },
    staleTime: Infinity, // Mock data doesn't change
  })
}

