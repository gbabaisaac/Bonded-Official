# Events System Implementation Guide

## ✅ Completed

### 1. Database Schema
- **File**: `database/events-schema.sql`
- **Tables Created**:
  - `events` - Main events table with all fields from spec
  - `event_ticket_types` - Ticket types for paid events
  - `event_attendance` - RSVP/attendance tracking
  - `event_invites` - Invite management
- **Features**:
  - Row Level Security (RLS) policies
  - Indexes for performance
  - Helper function `get_user_events()` for Calendar
  - Update triggers

### 2. Navigation
- **File**: `components/BottomNav.jsx`
- **Changes**: Added Events tab between Messages and Forum
- **Route**: `/events`

### 3. Events Home Screen
- **File**: `app/events/index.jsx`
- **Features**:
  - Search bar
  - Filter chips (Today, This Week, Free, On Campus, etc.)
  - Sections: Featured, Tonight, Upcoming
  - Pull-to-refresh
  - Create Event FAB button

### 4. EventCard Component
- **File**: `components/Events/EventCard.jsx`
- **Features**:
  - Image with gradient overlay
  - Date/time display
  - Location
  - Attendees count
  - Free/Paid badge
  - Visibility badges
  - Action buttons (Going, Request, Buy Ticket)
  - "Going ✓" indicator

### 5. React Query Hooks
- **Files**: `hooks/events/*.js`
- **Hooks Created**:
  - `useEventsForUser(userId)` - Fetches all events user can see
  - `useEvent(eventId)` - Fetches single event with full details
  - `useEventAttendance(eventId, userId)` - Gets user's attendance status
  - `useEventAttendanceState(event, userId)` - Derived state for UI
  - `useEventActions(event, userId)` - Actions (toggleGoing, requestJoin)

### 6. API Functions
- **File**: `api/events/createEvent.js`
- **Function**: `createEvent(input)` - Creates event with ticket types and invites
- **Features**:
  - Transactional (rolls back on error)
  - Creates host attendance automatically
  - Supports ticket types and invites

## 🚧 Still To Do

### 1. EventDetailScreen
- **File**: `app/events/[id].jsx` (exists but needs updates)
- **Needs**:
  - Use `useEvent` hook instead of context
  - Use `useEventActions` for RSVP logic
  - Add ticket purchase flow
  - Show guest list (if not hidden)
  - Show approval queue (if organizer)

### 2. EventCreateWizard
- **File**: `app/events/create.jsx` (exists but needs rewrite)
- **Needs**:
  - Multi-step wizard (BASICS, VISIBILITY, TICKETING, INVITES, PREVIEW, PUBLISH)
  - Use React Hook Form
  - Use `createEvent` API function
  - Preview step using EventDetailContent component

### 3. EventManageScreen
- **File**: `app/events/[id]/manage.jsx` (needs creation)
- **Features**:
  - Quick actions (Share, View, Edit, Invite)
  - Analytics (tickets sold, revenue, attendance)
  - Approval queue
  - Attendee list
  - Ticket scanning (future)

### 4. Calendar Integration
- **File**: `app/calendar.jsx` (exists, needs updates)
- **Needs**:
  - Use `useEventsForUser` hook
  - Map events to calendar format
  - Color coding by visibility
  - Navigate to EventDetail on tap

### 5. Additional Components Needed
- `components/Events/EventDetailContent.jsx` - Reusable detail view
- `components/Events/EventCreateWizard/` - Wizard step components
- `components/Events/TicketTypePicker.jsx` - For paid events

## 📋 Implementation Notes

### Database Setup
1. Run `database/events-schema.sql` in Supabase SQL Editor
2. Make sure you have `profiles` and `orgs` tables first
3. Adjust `org_members` reference if your schema differs

### Testing
1. Start with mock data (EventsContext) to test UI
2. Then connect to real Supabase queries
3. Test visibility rules (public, org_only, invite_only)
4. Test RSVP flows (free, approval-required, paid)

### Next Steps Priority
1. **Fix EventCard** - Make sure hooks work correctly
2. **Update EventDetail** - Use new hooks and API
3. **Create Wizard** - Multi-step form with React Hook Form
4. **Calendar Integration** - Connect events to calendar view
5. **Event Management** - Organizer dashboard

## 🔧 Technical Decisions

### Why React Query?
- Automatic caching and refetching
- Optimistic updates
- Error handling
- Loading states

### Why Separate Hooks?
- Business logic separated from UI
- Reusable across components
- Easier to test
- Follows spec pattern

### Why Single API Function?
- Transactional safety
- Single source of truth
- Easier error handling
- Matches spec recommendation

## 📝 Code Patterns

### Event Actions Pattern
```javascript
const { attendanceState, toggleGoing, requestJoin } = useEventActions(event, userId)

if (attendanceState.canToggleGoing) {
  // Show "Going" button
}
if (attendanceState.canRequest) {
  // Show "Request" button
}
```

### Event Query Pattern
```javascript
const { data: events, isLoading } = useEventsForUser(userId)
const { data: event } = useEvent(eventId)
```

### Create Event Pattern
```javascript
const event = await createEvent({
  organizer_id: userId,
  title: 'My Event',
  start_at: startDate,
  end_at: endDate,
  ticket_types: [...],
  invites: [...]
})
```

