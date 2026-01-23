-- ============================================
-- SECURITY: Rate Limiting & Anti-Spam
-- ============================================

-- Rate limiting table to track booking attempts per IP
CREATE TABLE IF NOT EXISTS public.booking_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_event_time
ON public.booking_rate_limits(ip_address, event_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.booking_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for tracking)
CREATE POLICY "Anyone can insert rate limit"
ON public.booking_rate_limits
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Only service role can read (server-side only)
-- Anon/authenticated cannot read rate limit data
CREATE POLICY "No public read on rate limits"
ON public.booking_rate_limits
FOR SELECT
USING (false);

-- ============================================
-- BOOKINGS: Add IP tracking & duplicate prevention
-- ============================================

-- Add IP address column to bookings for audit
ALTER TABLE public.event_bookings
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Unique index to prevent duplicate email per event
-- Uses the email from booking_data JSON field
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_email_event
ON public.event_bookings(event_id, (booking_data->>'email'))
WHERE booking_data->>'email' IS NOT NULL;

-- ============================================
-- RATE LIMIT FUNCTIONS (Security Definer)
-- ============================================

-- Function to check rate limit (bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_booking_rate_limit(
    p_ip_address TEXT,
    p_event_id UUID,
    p_max_attempts INTEGER DEFAULT 3,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO attempt_count
    FROM public.booking_rate_limits
    WHERE ip_address = p_ip_address
      AND event_id = p_event_id
      AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

    RETURN attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to record a booking attempt
CREATE OR REPLACE FUNCTION public.record_booking_attempt(
    p_ip_address TEXT,
    p_event_id UUID
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.booking_rate_limits (ip_address, event_id)
    VALUES (p_ip_address, p_event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.booking_rate_limits
    WHERE created_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLICY UPDATE: Allow public booking insert
-- ============================================

-- Drop old policy if exists and recreate for anon users
DROP POLICY IF EXISTS "Anyone can create booking" ON public.event_bookings;

CREATE POLICY "Anyone can create booking"
ON public.event_bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Ensure anon can read booking fields (for form rendering)
DROP POLICY IF EXISTS "Anyone can read booking fields" ON public.event_booking_fields;

CREATE POLICY "Anyone can read booking fields"
ON public.event_booking_fields
FOR SELECT
TO anon, authenticated
USING (true);
