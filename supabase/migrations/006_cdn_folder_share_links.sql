-- ============================================
-- CDN FOLDER SHARE LINKS TABLE
-- Migration: 006_cdn_folder_share_links
-- ============================================

CREATE TABLE IF NOT EXISTS cdn_folder_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES cdn_folders(id) ON DELETE CASCADE,
  share_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  max_downloads INTEGER,
  download_count INTEGER DEFAULT 0,
  allow_preview BOOLEAN DEFAULT true,
  allow_download BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_folder_share_links_folder_id ON cdn_folder_share_links(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_share_links_token ON cdn_folder_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_folder_share_links_expires ON cdn_folder_share_links(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE cdn_folder_share_links ENABLE ROW LEVEL SECURITY;

-- Admin can manage all folder share links
CREATE POLICY "Admin can manage folder share links"
  ON cdn_folder_share_links
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- Public can read active folder share links by token
CREATE POLICY "Public can access folder share links by token"
  ON cdn_folder_share_links
  FOR SELECT
  USING (is_active = true);
