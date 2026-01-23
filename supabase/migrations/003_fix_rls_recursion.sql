-- Fix infinite recursion in profiles RLS policies
-- The issue: policies on "profiles" table were querying "profiles" table, causing infinite loop

-- Step 1: Create a security definer function to check admin status
-- This bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_master_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 2: Drop the problematic policies
DROP POLICY IF EXISTS "Master admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
DROP POLICY IF EXISTS "Admins can view invites" ON public.admin_invites;
DROP POLICY IF EXISTS "Admins can create invites" ON public.admin_invites;
DROP POLICY IF EXISTS "Master admin can update invites" ON public.admin_invites;
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;

-- Step 3: Recreate policies using the security definer functions

-- Profiles: Master admin can view all profiles
CREATE POLICY "Master admin can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_master_admin());

-- Events: Admins can manage all events
CREATE POLICY "Admins can manage all events"
  ON public.events
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin invites: Admins can view
CREATE POLICY "Admins can view invites"
  ON public.admin_invites
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admin invites: Admins can create
CREATE POLICY "Admins can create invites"
  ON public.admin_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin invites: Master admin can update
CREATE POLICY "Master admin can update invites"
  ON public.admin_invites
  FOR UPDATE
  TO authenticated
  USING (public.is_master_admin())
  WITH CHECK (public.is_master_admin());

-- Storage: Admins can upload
CREATE POLICY "Admins can upload event images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-images' AND
    public.is_admin()
  );

-- Storage: Admins can delete
CREATE POLICY "Admins can delete event images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-images' AND
    public.is_admin()
  );

-- Also fix booking tables if they exist
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "Admins can manage booking fields" ON public.event_booking_fields;
  DROP POLICY IF EXISTS "Admins can manage bookings" ON public.event_bookings;

  -- Recreate with security definer functions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_booking_fields') THEN
    CREATE POLICY "Admins can manage booking fields"
      ON public.event_booking_fields
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_bookings') THEN
    CREATE POLICY "Admins can manage bookings"
      ON public.event_bookings
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;
