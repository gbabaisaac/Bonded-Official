/**
 * URI Events Service
 * Scrapes events from URI Involved and creates events in Bonded
 * Links to URI Involved page for more details
 */

import { supabase } from '../lib/supabase'

// URI Involved base URL - UPDATE THIS with actual URI Involved URL
const URI_INVOLVED_BASE_URL = 'https://uriinvolved.uri.edu' // Replace with actual URL

/**
 * Scrape events from URI Involved
 * 
 * NOTE: This is a placeholder implementation.
 * You'll need to:
 * 1. Check if URI Involved has an API endpoint
 * 2. If yes, use that API
 * 3. If no, implement web scraping (using cheerio, puppeteer, or similar)
 * 
 * Returns array of event objects
 */
export async function scrapeURIEvents() {
  try {
    // TODO: Implement actual scraping
    // Option 1: If URI Involved has an API
    // const response = await fetch(`${URI_INVOLVED_BASE_URL}/api/events`)
    // const events = await response.json()
    
    // Option 2: Web scraping (if no API)
    // Use a library like cheerio (Node.js) or puppeteer
    // Example:
    // const response = await fetch(URI_INVOLVED_BASE_URL)
    // const html = await response.text()
    // Parse HTML to extract events
    
    // PLACEHOLDER: Sample events structure
    // Replace this with actual scraping logic
    const events = [
      {
        title: 'URI Basketball Game vs Brown',
        description: 'Come support URI basketball! Cheer on the Rams as they take on Brown University.',
        startDate: new Date('2024-12-15T19:00:00'),
        endDate: new Date('2024-12-15T21:00:00'),
        location: 'Ryan Center',
        uriInvolvedUrl: `${URI_INVOLVED_BASE_URL}/events/12345`,
        category: 'sports',
        imageUrl: null
      },
      {
        title: 'Student Organization Fair',
        description: 'Discover all the clubs and organizations URI has to offer! Meet current members and learn how to get involved.',
        startDate: new Date('2024-12-18T12:00:00'),
        endDate: new Date('2024-12-18T15:00:00'),
        location: 'Memorial Union',
        uriInvolvedUrl: `${URI_INVOLVED_BASE_URL}/events/12346`,
        category: 'campus',
        imageUrl: null
      },
      {
        title: 'Guest Speaker: Tech Entrepreneurship',
        description: 'Join us for an inspiring talk about building startups in tech. Q&A session to follow.',
        startDate: new Date('2024-12-20T18:00:00'),
        endDate: new Date('2024-12-20T19:30:00'),
        location: 'Engineering Building, Room 201',
        uriInvolvedUrl: `${URI_INVOLVED_BASE_URL}/events/12347`,
        category: 'academic',
        imageUrl: null
      }
    ]
    
    return events
  } catch (error) {
    console.error('Error scraping URI events:', error)
    return []
  }
}

/**
 * Create events in Bonded from scraped URI events
 * 
 * @param {string} userId - User ID of the organizer (founder/admin)
 * @param {string} universityId - University ID (URI)
 * @returns {Promise<Array>} Array of created event objects
 */
export async function seedURIEvents(userId, universityId) {
  if (!userId || !universityId) {
    throw new Error('userId and universityId are required')
  }
  
  const scrapedEvents = await scrapeURIEvents()
  
  if (scrapedEvents.length === 0) {
    console.warn('No events scraped from URI Involved')
    return []
  }
  
  const createdEvents = []
  
  for (const event of scrapedEvents) {
    try {
      // Check if event already exists (by title and start date)
      const { data: existing } = await supabase
        .from('uri_events')
        .select('id')
        .eq('title', event.title)
        .eq('start_at', event.startDate.toISOString())
        .limit(1)
        .single()
      
      if (existing) {
        console.log(`Event already exists: ${event.title}`)
        continue
      }
      
      // Create event in Bonded
      const { data, error } = await supabase
        .from('uri_events')
        .insert({
          organizer_id: userId,
          title: event.title,
          description: `${event.description}\n\n[View on URI Involved](${event.uriInvolvedUrl})`,
          start_at: event.startDate.toISOString(),
          end_at: event.endDate.toISOString(),
          location_name: event.location,
          visibility: 'public',
          created_by: userId,
          // Add external_url if column exists
          // external_url: event.uriInvolvedUrl,
          // category: event.category,
          // cover_image_url: event.imageUrl
        })
        .select()
        .single()
      
      if (error) {
        console.error(`Error creating event "${event.title}":`, error)
        continue
      }
      
      createdEvents.push(data)
      console.log(`Created event: ${event.title}`)
    } catch (error) {
      console.error(`Error processing event "${event.title}":`, error)
    }
  }
  
  return createdEvents
}

/**
 * Manual function to run event seeding
 * Call this from a script or admin panel
 */
export async function runURIEventsSeeding() {
  try {
    // Get URI university
    const { data: uri } = await supabase
      .from('universities')
      .select('id')
      .eq('domain', 'uri.edu')
      .single()
    
    if (!uri) {
      throw new Error('URI university not found')
    }
    
    // Get founder/admin user (Isaac)
    const { data: founder } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()
    
    if (!founder) {
      throw new Error('Founder/admin user not found')
    }
    
    const events = await seedURIEvents(founder.id, uri.id)
    
    console.log(`Successfully seeded ${events.length} events from URI Involved`)
    return events
  } catch (error) {
    console.error('Error running URI events seeding:', error)
    throw error
  }
}







