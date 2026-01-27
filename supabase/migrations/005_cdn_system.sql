-- ============================================
-- CDN FILES & FOLDERS SYSTEM
-- Migration: 005_cdn_system
-- Description: Complete CDN system with files, folders, versions, share links, comments, audit log, encryption keys, and upload sessions
-- ============================================

-- ============================================
-- FOLDERS TABLE (Hierarchical structure)
-- ============================================

CREATE TABLE public.cdn_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,

  -- Hierarchy (materialized path for fast lookups)
  parent_folder_id UUID REFERENCES public.cdn_folders(id) ON DELETE CASCADE,
  path TEXT NOT NULL, -- e.g., '/root/subfolder/' for breadcrumbs
  depth INTEGER DEFAULT 0 NOT NULL,

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_folder_name_per_parent UNIQUE(name, parent_folder_id),
  CONSTRAINT check_depth_range CHECK (depth >= 0 AND depth <= 10) -- Max 10 levels
);

-- ============================================
-- FILES TABLE (Main CDN files)
-- ============================================

CREATE TABLE public.cdn_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Metadata
  name TEXT NOT NULL, -- Internal name (unique storage path)
  display_name TEXT NOT NULL, -- User-friendly name
  description TEXT,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- bytes

  -- Storage
  storage_path TEXT NOT NULL UNIQUE, -- Supabase storage path
  storage_bucket TEXT DEFAULT 'cdn-files' NOT NULL,

  -- Encryption
  is_encrypted BOOLEAN DEFAULT FALSE NOT NULL, -- E2E encryption flag
  encryption_key_id UUID, -- References encryption key (for E2E)
  encryption_metadata JSONB, -- { iv, salt, algorithm: 'AES-GCM-256' }

  -- Organization
  folder_id UUID REFERENCES public.cdn_folders(id) ON DELETE SET NULL,

  -- Version control
  version_number INTEGER DEFAULT 1 NOT NULL,
  parent_file_id UUID REFERENCES public.cdn_files(id) ON DELETE SET NULL, -- For versions
  is_latest_version BOOLEAN DEFAULT TRUE NOT NULL,

  -- Tags & Search
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  search_vector tsvector, -- For full-text search

  -- Audit
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Preview
  thumbnail_path TEXT, -- For images/videos
  preview_available BOOLEAN DEFAULT FALSE,

  CONSTRAINT check_version_number CHECK (version_number > 0),
  CONSTRAINT check_file_size CHECK (file_size >= 0)
);

-- ============================================
-- FILE VERSIONS HISTORY
-- ============================================

CREATE TABLE public.cdn_file_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES public.cdn_files(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,

  -- Snapshot of file at this version
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,

  -- Changes
  change_description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_file_version UNIQUE(file_id, version_number),
  CONSTRAINT check_version_number_positive CHECK (version_number > 0)
);

-- ============================================
-- SHAREABLE LINKS
-- ============================================

CREATE TABLE public.cdn_share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES public.cdn_files(id) ON DELETE CASCADE NOT NULL,

  -- Link configuration
  share_token TEXT NOT NULL UNIQUE, -- Random token for URL (UUID)
  password_hash TEXT, -- Hashed password (nullable)

  -- Access control
  max_downloads INTEGER, -- NULL = unlimited
  download_count INTEGER DEFAULT 0 NOT NULL,
  expires_at TIMESTAMPTZ, -- NULL = never expires

  -- Permissions
  allow_preview BOOLEAN DEFAULT TRUE,
  allow_download BOOLEAN DEFAULT TRUE,

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,

  CONSTRAINT check_download_count CHECK (download_count >= 0),
  CONSTRAINT check_max_downloads CHECK (max_downloads IS NULL OR max_downloads > 0)
);

-- ============================================
-- FILE COMMENTS & ANNOTATIONS
-- ============================================

CREATE TABLE public.cdn_file_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES public.cdn_files(id) ON DELETE CASCADE NOT NULL,

  -- Comment data
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general' CHECK (comment_type IN ('general', 'annotation', 'review')),

  -- Annotations (for PDFs, images) - store coordinates, shapes, colors
  annotation_data JSONB, -- { x, y, width, height, page, shape, color, text }

  -- Thread support
  parent_comment_id UUID REFERENCES public.cdn_file_comments(id) ON DELETE CASCADE,

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,

  CONSTRAINT check_comment_text_not_empty CHECK (LENGTH(TRIM(comment_text)) > 0)
);

-- ============================================
-- ACTIVITY AUDIT LOG
-- ============================================

CREATE TABLE public.cdn_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'file_upload', 'file_download', 'file_delete', 'file_update', 'file_view',
    'file_restore', 'file_move', 'file_rename',
    'folder_create', 'folder_delete', 'folder_update', 'folder_move',
    'share_create', 'share_access', 'share_revoke', 'share_update',
    'comment_create', 'comment_update', 'comment_delete',
    'version_create', 'version_restore', 'version_delete'
  )),

  -- Resource references
  file_id UUID REFERENCES public.cdn_files(id) ON DELETE SET NULL,
  folder_id UUID REFERENCES public.cdn_folders(id) ON DELETE SET NULL,
  share_link_id UUID REFERENCES public.cdn_share_links(id) ON DELETE SET NULL,

  -- Context (additional info about the action)
  metadata JSONB, -- { file_name, old_value, new_value, bytes_transferred, etc. }

  -- Actor
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Cached for reporting
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- ENCRYPTION KEYS (for E2E encrypted files)
-- ============================================

CREATE TABLE public.cdn_encryption_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Key info (encrypted file encryption key)
  encrypted_key TEXT NOT NULL, -- FEK encrypted with admin's derived key
  key_salt TEXT NOT NULL, -- Salt for PBKDF2 derivation
  key_iv TEXT NOT NULL, -- Initialization vector for key encryption

  -- Access control
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with UUID[] DEFAULT ARRAY[]::UUID[], -- Array of user IDs with access

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ
);

-- ============================================
-- CHUNKED UPLOAD SESSIONS (for resumable uploads)
-- ============================================

CREATE TABLE public.cdn_upload_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Session info
  session_token TEXT NOT NULL UNIQUE, -- Random token for upload tracking
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,

  -- Upload progress
  chunks_uploaded INTEGER DEFAULT 0 NOT NULL,
  total_chunks INTEGER NOT NULL,
  bytes_uploaded BIGINT DEFAULT 0 NOT NULL,
  uploaded_chunk_indexes INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Track which chunks uploaded

  -- Metadata
  folder_id UUID REFERENCES public.cdn_folders(id) ON DELETE CASCADE,
  is_encrypted BOOLEAN DEFAULT FALSE,

  -- State
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
  error_message TEXT,

  -- Audit
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, -- Auto-cleanup after 7 days

  CONSTRAINT check_chunks_valid CHECK (chunks_uploaded >= 0 AND chunks_uploaded <= total_chunks),
  CONSTRAINT check_bytes_uploaded CHECK (bytes_uploaded >= 0 AND bytes_uploaded <= file_size),
  CONSTRAINT check_total_chunks CHECK (total_chunks > 0)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Files
CREATE INDEX idx_cdn_files_folder_id ON public.cdn_files(folder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cdn_files_uploaded_by ON public.cdn_files(uploaded_by);
CREATE INDEX idx_cdn_files_created_at ON public.cdn_files(created_at DESC);
CREATE INDEX idx_cdn_files_updated_at ON public.cdn_files(updated_at DESC);
CREATE INDEX idx_cdn_files_tags ON public.cdn_files USING GIN(tags);
CREATE INDEX idx_cdn_files_search ON public.cdn_files USING GIN(search_vector);
CREATE INDEX idx_cdn_files_parent ON public.cdn_files(parent_file_id) WHERE parent_file_id IS NOT NULL;
CREATE INDEX idx_cdn_files_mime_type ON public.cdn_files(mime_type);
CREATE INDEX idx_cdn_files_deleted ON public.cdn_files(deleted_at) WHERE deleted_at IS NOT NULL;

-- Folders
CREATE INDEX idx_cdn_folders_parent ON public.cdn_folders(parent_folder_id);
CREATE INDEX idx_cdn_folders_path ON public.cdn_folders(path);
CREATE INDEX idx_cdn_folders_created_by ON public.cdn_folders(created_by);

-- Versions
CREATE INDEX idx_cdn_versions_file_id ON public.cdn_file_versions(file_id);
CREATE INDEX idx_cdn_versions_created_at ON public.cdn_file_versions(created_at DESC);

-- Share links
CREATE INDEX idx_cdn_share_links_file_id ON public.cdn_share_links(file_id);
CREATE INDEX idx_cdn_share_links_token ON public.cdn_share_links(share_token);
CREATE INDEX idx_cdn_share_links_expires ON public.cdn_share_links(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_cdn_share_links_active ON public.cdn_share_links(is_active) WHERE is_active = TRUE;

-- Comments
CREATE INDEX idx_cdn_comments_file_id ON public.cdn_file_comments(file_id);
CREATE INDEX idx_cdn_comments_parent ON public.cdn_file_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_cdn_comments_created_by ON public.cdn_file_comments(created_by);

-- Audit log
CREATE INDEX idx_cdn_audit_action ON public.cdn_audit_log(action_type);
CREATE INDEX idx_cdn_audit_file_id ON public.cdn_audit_log(file_id) WHERE file_id IS NOT NULL;
CREATE INDEX idx_cdn_audit_user ON public.cdn_audit_log(user_id);
CREATE INDEX idx_cdn_audit_created ON public.cdn_audit_log(created_at DESC);

-- Encryption keys
CREATE INDEX idx_cdn_encryption_keys_owner ON public.cdn_encryption_keys(owner_id);

-- Upload sessions
CREATE INDEX idx_cdn_upload_sessions_user ON public.cdn_upload_sessions(uploaded_by);
CREATE INDEX idx_cdn_upload_sessions_status ON public.cdn_upload_sessions(status);
CREATE INDEX idx_cdn_upload_sessions_expires ON public.cdn_upload_sessions(expires_at);
CREATE INDEX idx_cdn_upload_sessions_token ON public.cdn_upload_sessions(session_token);

-- ============================================
-- FULL-TEXT SEARCH TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION cdn_files_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cdn_files_search_update
BEFORE INSERT OR UPDATE ON public.cdn_files
FOR EACH ROW
EXECUTE FUNCTION cdn_files_search_trigger();

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cdn_files_updated_at
BEFORE UPDATE ON public.cdn_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cdn_folders_updated_at
BEFORE UPDATE ON public.cdn_folders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cdn_comments_updated_at
BEFORE UPDATE ON public.cdn_file_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cdn_upload_sessions_updated_at
BEFORE UPDATE ON public.cdn_upload_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.cdn_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdn_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdn_file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdn_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdn_file_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdn_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdn_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdn_upload_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FILES POLICIES - Admins have full access
-- ============================================

CREATE POLICY "Admins can manage all files"
ON public.cdn_files FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

-- ============================================
-- FOLDERS POLICIES
-- ============================================

CREATE POLICY "Admins can manage all folders"
ON public.cdn_folders FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

-- ============================================
-- VERSIONS POLICIES
-- ============================================

CREATE POLICY "Admins can view versions"
ON public.cdn_file_versions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can create versions"
ON public.cdn_file_versions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can delete versions"
ON public.cdn_file_versions FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

-- ============================================
-- SHARE LINKS POLICIES
-- ============================================

CREATE POLICY "Admins can manage share links"
ON public.cdn_share_links FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

-- Public can access via share links (for validating tokens)
CREATE POLICY "Public can access active share links"
ON public.cdn_share_links FOR SELECT TO anon
USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- ============================================
-- COMMENTS POLICIES
-- ============================================

CREATE POLICY "Admins can manage comments"
ON public.cdn_file_comments FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

-- ============================================
-- AUDIT LOG POLICIES (read-only for admins)
-- ============================================

CREATE POLICY "Admins can view audit log"
ON public.cdn_audit_log FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

-- System can insert audit logs (via security definer functions)
CREATE POLICY "System can insert audit logs"
ON public.cdn_audit_log FOR INSERT
WITH CHECK (true);

-- ============================================
-- ENCRYPTION KEYS POLICIES (only owner can access)
-- ============================================

CREATE POLICY "Users can manage own encryption keys"
ON public.cdn_encryption_keys FOR ALL TO authenticated
USING (owner_id = auth.uid() OR auth.uid() = ANY(shared_with))
WITH CHECK (owner_id = auth.uid());

-- ============================================
-- UPLOAD SESSIONS POLICIES
-- ============================================

CREATE POLICY "Users can manage own upload sessions"
ON public.cdn_upload_sessions FOR ALL TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create CDN files bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cdn-files',
  'cdn-files',
  FALSE, -- Private bucket, access via signed URLs
  5368709120, -- 5GB in bytes
  NULL -- Allow all mime types (we'll validate in application)
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES FOR CDN-FILES BUCKET
-- ============================================

-- Admins can upload to cdn-files
CREATE POLICY "Admins can upload to cdn-files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cdn-files' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

-- Admins can update cdn-files
CREATE POLICY "Admins can update cdn-files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'cdn-files' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
)
WITH CHECK (
  bucket_id = 'cdn-files' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

-- Admins can delete cdn-files
CREATE POLICY "Admins can delete from cdn-files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'cdn-files' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

-- Admins can read cdn-files
CREATE POLICY "Admins can read cdn-files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'cdn-files' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create audit log entry (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION cdn_log_action(
  p_action_type TEXT,
  p_file_id UUID DEFAULT NULL,
  p_folder_id UUID DEFAULT NULL,
  p_share_link_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get user email if authenticated
  IF auth.uid() IS NOT NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
  END IF;

  INSERT INTO public.cdn_audit_log (
    action_type, file_id, folder_id, share_link_id, metadata,
    user_id, user_email, ip_address, user_agent
  ) VALUES (
    p_action_type, p_file_id, p_folder_id, p_share_link_id, p_metadata,
    auth.uid(), v_user_email, p_ip_address, p_user_agent
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired upload sessions
CREATE OR REPLACE FUNCTION cleanup_expired_upload_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.cdn_upload_sessions
  WHERE expires_at < NOW() AND status != 'completed';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment share link download count and check validity
CREATE OR REPLACE FUNCTION increment_share_link_download(p_share_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_link public.cdn_share_links;
  v_result JSONB;
BEGIN
  -- Lock the row for update
  SELECT * INTO v_link
  FROM public.cdn_share_links
  WHERE share_token = p_share_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_token');
  END IF;

  -- Check if link is still valid
  IF NOT v_link.is_active THEN
    RETURN jsonb_build_object('success', false, 'reason', 'link_deactivated');
  END IF;

  IF v_link.expires_at IS NOT NULL AND v_link.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'reason', 'link_expired');
  END IF;

  IF v_link.max_downloads IS NOT NULL AND v_link.download_count >= v_link.max_downloads THEN
    RETURN jsonb_build_object('success', false, 'reason', 'download_limit_reached');
  END IF;

  -- Increment download count
  UPDATE public.cdn_share_links
  SET download_count = download_count + 1,
      last_accessed_at = NOW()
  WHERE share_token = p_share_token;

  RETURN jsonb_build_object('success', true, 'download_count', v_link.download_count + 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get folder path (recursive)
CREATE OR REPLACE FUNCTION get_folder_path(p_folder_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_path TEXT := '';
  v_folder public.cdn_folders;
BEGIN
  IF p_folder_id IS NULL THEN
    RETURN '/';
  END IF;

  SELECT * INTO v_folder FROM public.cdn_folders WHERE id = p_folder_id;

  IF NOT FOUND THEN
    RETURN '/';
  END IF;

  RETURN v_folder.path || v_folder.name || '/';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED CLEANUP (requires pg_cron extension)
-- ============================================

-- Note: This requires pg_cron extension to be enabled
-- To enable: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- To schedule: SELECT cron.schedule('cleanup-cdn-uploads', '0 2 * * *', 'SELECT cleanup_expired_upload_sessions()');

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.cdn_files IS 'Main CDN files table with encryption, versioning, and soft delete support';
COMMENT ON TABLE public.cdn_folders IS 'Hierarchical folder structure with materialized path';
COMMENT ON TABLE public.cdn_file_versions IS 'Version history for files';
COMMENT ON TABLE public.cdn_share_links IS 'Shareable links with password protection and expiration';
COMMENT ON TABLE public.cdn_file_comments IS 'Comments and annotations on files';
COMMENT ON TABLE public.cdn_audit_log IS 'Comprehensive audit log for all CDN actions';
COMMENT ON TABLE public.cdn_encryption_keys IS 'Encrypted file encryption keys for E2E encryption';
COMMENT ON TABLE public.cdn_upload_sessions IS 'Resumable upload sessions for large files';

COMMENT ON FUNCTION cdn_log_action IS 'Log CDN actions to audit table (security definer)';
COMMENT ON FUNCTION cleanup_expired_upload_sessions IS 'Clean up expired upload sessions (scheduled job)';
COMMENT ON FUNCTION increment_share_link_download IS 'Increment download counter and validate share link';
COMMENT ON FUNCTION get_folder_path IS 'Get full path for a folder (recursive)';
