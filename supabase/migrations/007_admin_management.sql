-- ============================================
-- ADMIN MANAGEMENT: Suspension & Removal
-- ============================================

-- Add suspension columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================
-- UPDATE is_admin() TO CHECK SUSPENSION
-- ============================================

-- Drop and recreate the function to check suspension status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_suspended = FALSE  -- Suspended admins are blocked
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ADMIN MANAGEMENT FUNCTIONS (Master Admin Only)
-- ============================================

-- Function to suspend an admin (master admin only)
CREATE OR REPLACE FUNCTION public.suspend_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  target_is_master BOOLEAN;
BEGIN
  -- Check if caller is master admin
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Only master admin can suspend users';
  END IF;
  
  -- Check if target is master admin (cannot suspend master)
  SELECT is_master_admin INTO target_is_master
  FROM public.profiles WHERE id = target_user_id;
  
  IF target_is_master THEN
    RAISE EXCEPTION 'Cannot suspend master admin';
  END IF;
  
  -- Suspend the user
  UPDATE public.profiles
  SET 
    is_suspended = TRUE,
    suspended_at = NOW(),
    suspended_by = auth.uid()
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reactivate a suspended admin (master admin only)
CREATE OR REPLACE FUNCTION public.reactivate_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if caller is master admin
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Only master admin can reactivate users';
  END IF;
  
  -- Reactivate the user
  UPDATE public.profiles
  SET 
    is_suspended = FALSE,
    suspended_at = NULL,
    suspended_by = NULL
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove an admin completely (master admin only)
-- This deletes the auth user which cascades to profile
CREATE OR REPLACE FUNCTION public.remove_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  target_is_master BOOLEAN;
BEGIN
  -- Check if caller is master admin
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Only master admin can remove users';
  END IF;
  
  -- Check if target is master admin (cannot remove master)
  SELECT is_master_admin INTO target_is_master
  FROM public.profiles WHERE id = target_user_id;
  
  IF target_is_master THEN
    RAISE EXCEPTION 'Cannot remove master admin';
  END IF;
  
  -- Delete the profile (auth.users deletion requires service role)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLICY FOR MASTER ADMIN TO DELETE INVITES
-- ============================================

-- Allow master admin to delete invites
DROP POLICY IF EXISTS "Master admin can delete invites" ON public.admin_invites;

CREATE POLICY "Master admin can delete invites"
ON public.admin_invites
FOR DELETE
TO authenticated
USING (public.is_master_admin());
