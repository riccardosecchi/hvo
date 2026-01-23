-- =============================================
-- BOOKING SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- =============================================

-- Add booking_type to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'external';
-- 'external' = external link, 'internal' = internal booking form

-- Create event_booking_fields table
-- Defines custom form fields for each event
CREATE TABLE IF NOT EXISTS public.event_booking_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT DEFAULT 'text' CHECK (field_type IN ('text', 'email', 'tel', 'number', 'textarea', 'select')),
  field_options JSONB DEFAULT '[]'::jsonb, -- For select fields: ["Option 1", "Option 2"]
  is_required BOOLEAN DEFAULT FALSE,
  field_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create event_bookings table
-- Stores user booking submissions
CREATE TABLE IF NOT EXISTS public.event_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  booking_data JSONB NOT NULL, -- Form data: { "name": "Mario", "email": "mario@..." }
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT, -- Admin notes
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_fields_event_id ON public.event_booking_fields(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.event_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.event_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.event_bookings(created_at DESC);

-- Enable RLS
ALTER TABLE public.event_booking_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR event_booking_fields
-- =============================================

-- Public can read booking fields for active events (to render the form)
CREATE POLICY "Public can view booking fields for active events"
  ON public.event_booking_fields
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = event_booking_fields.event_id 
      AND events.is_active = TRUE
    )
  );

-- Admins can manage all booking fields
CREATE POLICY "Admins can manage booking fields"
  ON public.event_booking_fields
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES FOR event_bookings
-- =============================================

-- Anyone can create a booking (public form submission)
CREATE POLICY "Anyone can create bookings"
  ON public.event_bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = event_bookings.event_id 
      AND events.is_active = TRUE 
      AND events.is_booking_open = TRUE
      AND events.booking_type = 'internal'
    )
  );

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.event_bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Admins can update bookings (approve/reject)
CREATE POLICY "Admins can update bookings"
  ON public.event_bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Admins can delete bookings
CREATE POLICY "Admins can delete bookings"
  ON public.event_bookings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );
