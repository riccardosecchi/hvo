-- ============================================
-- FIX: Allow anonymous users to validate invite tokens
-- ============================================

-- Function to validate an invite token (can be called by anonymous users)
-- Returns the email if valid, NULL if invalid/expired/already confirmed
CREATE OR REPLACE FUNCTION public.validate_invite_token(p_token TEXT)
RETURNS TABLE(email TEXT, is_valid BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.email,
    TRUE as is_valid
  FROM public.admin_invites ai
  WHERE ai.invitation_token = p_token
    AND ai.is_confirmed = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to anonymous users
GRANT EXECUTE ON FUNCTION public.validate_invite_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invite_token(TEXT) TO authenticated;

-- ============================================
-- FIX: Track when user has actually registered
-- ============================================

-- Add column to track if the invited user has registered
ALTER TABLE public.admin_invites
ADD COLUMN IF NOT EXISTS has_registered BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ;

-- Function to mark invite as registered when user signs up
-- This is called by the handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, is_master_admin)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email = 'riccardosecchi1@gmail.com' THEN TRUE ELSE FALSE END
  );
  
  -- Mark the invite as registered (if exists)
  UPDATE public.admin_invites
  SET 
    has_registered = TRUE,
    registered_at = NOW()
  WHERE email = NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
