-- ============================================
-- Events System Database Schema
-- Comprehensive schema for events, tickets, attendance, and invites
-- ============================================

-- ============================================
-- 1. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizer_type text DEFAULT 'user' CHECK (organizer_type IN ('user', 'org')),
  title text NOT NULL,
  description text,
  image_url text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  location_name text,
  location_address text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'org_only', 'invite_only', 'school')),
  org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  requires_approval boolean DEFAULT false,
  hide_guest_list boolean DEFAULT false,
  allow_sharing boolean DEFAULT true,
  is_paid boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  source text DEFAULT 'user' CHECK (source IN ('user', 'org', 'school_sync')),
  
  -- Constraints
  CONSTRAINT valid_end_after_start CHECK (end_at > start_at),
  CONSTRAINT valid_org_event CHECK (
    (visibility = 'org_only' AND org_id IS NOT NULL) OR
    (visibility != 'org_only')
  )
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_org ON public.events(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON public.events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_source ON public.events(source);

-- ============================================
-- 2. EVENT TICKET TYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  quantity integer,
  wallet_supported boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_price CHECK (price_cents >= 0),
  CONSTRAINT valid_quantity CHECK (quantity IS NULL OR quantity > 0)
);

-- Indexes for ticket types
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON public.event_ticket_types(event_id);

-- ============================================
-- 3. EVENT ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'declined', 'requested', 'approved', 'waitlisted')),
  ticket_type_id uuid REFERENCES public.event_ticket_types(id) ON DELETE SET NULL,
  ticket_id uuid, -- Reference to tickets table if you have one
  is_host boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint: one attendance record per user per event
  UNIQUE(event_id, user_id)
);

-- Indexes for attendance
CREATE INDEX IF NOT EXISTS idx_attendance_event ON public.event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON public.event_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.event_attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_event_status ON public.event_attendance(event_id, status);

-- ============================================
-- 4. EVENT INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_scope text DEFAULT 'direct' CHECK (role_scope IN ('direct', 'org_role', 'org_all')),
  org_role_id uuid, -- Reference to org_roles table if role_scope = 'org_role'
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_invite_scope CHECK (
    (role_scope = 'direct' AND user_id IS NOT NULL) OR
    (role_scope = 'org_role' AND org_role_id IS NOT NULL) OR
    (role_scope = 'org_all')
  )
);

-- Indexes for invites
CREATE INDEX IF NOT EXISTS idx_invites_event ON public.event_invites(event_id);
CREATE INDEX IF NOT EXISTS idx_invites_user ON public.event_invites(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invites_role_scope ON public.event_invites(role_scope);

-- ============================================
-- 5. UPDATE TRIGGER FOR EVENTS
-- ============================================
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON public.events;
CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;

-- Events policies
-- Anyone can read public events
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON public.events;
CREATE POLICY "Public events are viewable by everyone"
ON public.events FOR SELECT
USING (visibility = 'public' OR visibility = 'school');

-- Users can read org-only events if they're members of that org
DROP POLICY IF EXISTS "Org members can view org events" ON public.events;
CREATE POLICY "Org members can view org events"
ON public.events FOR SELECT
USING (
  visibility = 'org_only' AND
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid()
  )
);

-- Users can read invite-only events if they're invited or attending
DROP POLICY IF EXISTS "Invited users can view invite-only events" ON public.events;
CREATE POLICY "Invited users can view invite-only events"
ON public.events FOR SELECT
USING (
  visibility = 'invite_only' AND (
    id IN (
      SELECT event_id FROM public.event_invites
      WHERE user_id = auth.uid()
    ) OR
    id IN (
      SELECT event_id FROM public.event_attendance
      WHERE user_id = auth.uid()
    )
  )
);

-- Organizers can manage their events
DROP POLICY IF EXISTS "Organizers can manage their events" ON public.events;
CREATE POLICY "Organizers can manage their events"
ON public.events FOR ALL
USING (organizer_id = auth.uid() OR created_by = auth.uid());

-- Event ticket types policies
-- Anyone can read ticket types for events they can view
DROP POLICY IF EXISTS "Ticket types viewable with event" ON public.event_ticket_types;
CREATE POLICY "Ticket types viewable with event"
ON public.event_ticket_types FOR SELECT
USING (
  event_id IN (
    SELECT id FROM public.events
    WHERE visibility = 'public' OR visibility = 'school'
  ) OR
  event_id IN (
    SELECT id FROM public.events
    WHERE visibility = 'org_only' AND
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  ) OR
  event_id IN (
    SELECT id FROM public.events
    WHERE visibility = 'invite_only' AND (
      id IN (
        SELECT event_id FROM public.event_invites
        WHERE user_id = auth.uid()
      ) OR
      id IN (
        SELECT event_id FROM public.event_attendance
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- Organizers can manage ticket types
DROP POLICY IF EXISTS "Organizers can manage ticket types" ON public.event_ticket_types;
CREATE POLICY "Organizers can manage ticket types"
ON public.event_ticket_types FOR ALL
USING (
  event_id IN (
    SELECT id FROM public.events
    WHERE organizer_id = auth.uid() OR created_by = auth.uid()
  )
);

-- Event attendance policies
-- Users can read attendance for events they can view
DROP POLICY IF EXISTS "Users can view attendance for accessible events" ON public.event_attendance;
CREATE POLICY "Users can view attendance for accessible events"
ON public.event_attendance FOR SELECT
USING (
  event_id IN (
    SELECT id FROM public.events
    WHERE visibility = 'public' OR visibility = 'school'
  ) OR
  event_id IN (
    SELECT id FROM public.events
    WHERE visibility = 'org_only' AND
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  ) OR
  event_id IN (
    SELECT id FROM public.events
    WHERE visibility = 'invite_only' AND (
      id IN (
        SELECT event_id FROM public.event_invites
        WHERE user_id = auth.uid()
      ) OR
      id IN (
        SELECT event_id FROM public.event_attendance
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- Users can manage their own attendance
DROP POLICY IF EXISTS "Users can manage their own attendance" ON public.event_attendance;
CREATE POLICY "Users can manage their own attendance"
ON public.event_attendance FOR ALL
USING (user_id = auth.uid());

-- Organizers can manage attendance for their events
DROP POLICY IF EXISTS "Organizers can manage event attendance" ON public.event_attendance;
CREATE POLICY "Organizers can manage event attendance"
ON public.event_attendance FOR ALL
USING (
  event_id IN (
    SELECT id FROM public.events
    WHERE organizer_id = auth.uid() OR created_by = auth.uid()
  )
);

-- Event invites policies
-- Users can read invites for events they organize
DROP POLICY IF EXISTS "Organizers can view event invites" ON public.event_invites;
CREATE POLICY "Organizers can view event invites"
ON public.event_invites FOR SELECT
USING (
  event_id IN (
    SELECT id FROM public.events
    WHERE organizer_id = auth.uid() OR created_by = auth.uid()
  )
);

-- Users can read their own invites
DROP POLICY IF EXISTS "Users can view their own invites" ON public.event_invites;
CREATE POLICY "Users can view their own invites"
ON public.event_invites FOR SELECT
USING (user_id = auth.uid());

-- Organizers can create invites
DROP POLICY IF EXISTS "Organizers can create invites" ON public.event_invites;
CREATE POLICY "Organizers can create invites"
ON public.event_invites FOR INSERT
WITH CHECK (
  event_id IN (
    SELECT id FROM public.events
    WHERE organizer_id = auth.uid() OR created_by = auth.uid()
  ) AND
  invited_by = auth.uid()
);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to get events for a user (for Calendar)
CREATE OR REPLACE FUNCTION get_user_events(user_id_param uuid)
RETURNS TABLE (
  event_id uuid,
  title text,
  start_at timestamptz,
  end_at timestamptz,
  visibility text,
  org_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.start_at,
    e.end_at,
    e.visibility,
    e.org_id
  FROM public.events e
  WHERE
    -- User is attending
    e.id IN (
      SELECT event_id FROM public.event_attendance
      WHERE user_id = user_id_param
      AND status IN ('going', 'approved', 'maybe', 'requested')
    )
    OR
    -- Org-only event for user's orgs
    (e.visibility = 'org_only' AND e.org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = user_id_param
    ))
    OR
    -- School events
    e.visibility = 'school'
    OR
    -- Public events
    e.visibility = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTES:
-- 1. Run this in Supabase SQL Editor
-- 2. Make sure you have 'profiles' and 'orgs' tables first
-- 3. Adjust org_members table reference if your schema differs
-- 4. Add 'tickets' table later if you implement full ticketing system
-- ============================================

