/**
 * CDN Type Definitions
 * Complete TypeScript interfaces for the CDN system
 */

// ============================================
// CORE TYPES
// ============================================

export interface CdnFile {
  id: string;

  // Metadata
  name: string;
  display_name: string;
  description: string | null;
  mime_type: string;
  file_size: number; // bytes

  // Storage
  storage_path: string;
  storage_bucket: string;

  // Encryption
  is_encrypted: boolean;
  encryption_key_id: string | null;
  encryption_metadata: EncryptionMetadata | null;

  // Organization
  folder_id: string | null;

  // Version control
  version_number: number;
  parent_file_id: string | null;
  is_latest_version: boolean;

  // Tags & Search
  tags: string[];
  search_vector: string | null;

  // Audit
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Preview
  thumbnail_path: string | null;
  preview_available: boolean;
}

export interface CdnFolder {
  id: string;
  name: string;
  description: string | null;

  // Hierarchy
  parent_folder_id: string | null;
  path: string;
  depth: number;

  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CdnFileVersion {
  id: string;
  file_id: string;
  version_number: number;

  // Snapshot
  storage_path: string;
  file_size: number;
  mime_type: string;

  // Changes
  change_description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CdnShareLink {
  id: string;
  file_id: string;

  // Link configuration
  share_token: string;
  password_hash: string | null;

  // Access control
  max_downloads: number | null;
  download_count: number;
  expires_at: string | null;

  // Permissions
  allow_preview: boolean;
  allow_download: boolean;

  // Audit
  created_by: string;
  created_at: string;
  last_accessed_at: string | null;
  is_active: boolean;
}

export interface CdnFileComment {
  id: string;
  file_id: string;

  // Comment data
  comment_text: string;
  comment_type: CommentType;

  // Annotations
  annotation_data: AnnotationData | null;

  // Thread support
  parent_comment_id: string | null;

  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
}

export interface CdnAuditLog {
  id: string;

  // Action details
  action_type: AuditActionType;

  // Resource references
  file_id: string | null;
  folder_id: string | null;
  share_link_id: string | null;

  // Context
  metadata: Record<string, any>;

  // Actor
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;

  // Timestamp
  created_at: string;
}

export interface CdnEncryptionKey {
  id: string;

  // Key info
  encrypted_key: string;
  key_salt: string;
  key_iv: string;

  // Access control
  owner_id: string;
  shared_with: string[];

  // Metadata
  created_at: string;
  last_used_at: string | null;
}

export interface CdnUploadSession {
  id: string;

  // Session info
  session_token: string;
  file_name: string;
  file_size: number;
  mime_type: string;

  // Upload progress
  chunks_uploaded: number;
  total_chunks: number;
  bytes_uploaded: number;
  uploaded_chunk_indexes: number[];

  // Metadata
  folder_id: string | null;
  is_encrypted: boolean;

  // State
  status: UploadSessionStatus;
  error_message: string | null;

  // Audit
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// ============================================
// ENUM TYPES
// ============================================

export type CommentType = 'general' | 'annotation' | 'review';

export type AuditActionType =
  | 'file_upload'
  | 'file_download'
  | 'file_delete'
  | 'file_update'
  | 'file_view'
  | 'file_restore'
  | 'file_move'
  | 'file_rename'
  | 'folder_create'
  | 'folder_delete'
  | 'folder_update'
  | 'folder_move'
  | 'share_create'
  | 'share_access'
  | 'share_revoke'
  | 'share_update'
  | 'comment_create'
  | 'comment_update'
  | 'comment_delete'
  | 'version_create'
  | 'version_restore'
  | 'version_delete';

export type UploadSessionStatus = 'active' | 'completed' | 'failed' | 'cancelled';

export type FileViewMode = 'grid' | 'list';

export type FileSortBy = 'name' | 'date' | 'size' | 'type';

export type FileSortOrder = 'asc' | 'desc';

// ============================================
// NESTED DATA TYPES
// ============================================

export interface EncryptionMetadata {
  iv: string; // Initialization vector (base64)
  salt: string; // Salt for key derivation (base64)
  algorithm: 'AES-GCM-256';
  keyDerivation?: {
    algorithm: 'PBKDF2';
    iterations: number;
    hash: 'SHA-256';
  };
}

export interface AnnotationData {
  // Position
  x: number;
  y: number;
  width?: number;
  height?: number;

  // For PDFs
  page?: number;

  // Visual properties
  shape?: 'rectangle' | 'circle' | 'arrow' | 'freehand' | 'text';
  color?: string;
  strokeWidth?: number;

  // Text annotation
  text?: string;

  // Freehand drawing
  points?: Array<{ x: number; y: number }>;
}

// ============================================
// CLIENT-SIDE TYPES
// ============================================

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
  currentChunk: number;
  totalChunks: number;
  status: 'uploading' | 'paused' | 'completed' | 'error';
  error?: string;
}

export interface FileUploadQueueItem {
  id: string; // Unique ID for this upload
  file: File;
  sessionToken?: string;
  progress: UploadProgress;
  folderId: string | null;
  isEncrypted: boolean;
  encryptionKey?: CryptoKey;
}

export interface FilePreviewData {
  fileId: string;
  file: CdnFile;
  signedUrl?: string;
  blobUrl?: string; // For decrypted files
  isDecrypted?: boolean;
}

export interface ShareLinkConfig {
  expiresIn?: number; // minutes
  expiresAt?: Date;
  password?: string;
  maxDownloads?: number;
  allowPreview: boolean;
  allowDownload: boolean;
}

export interface FileFilters {
  search?: string;
  mimeTypes?: string[];
  sizeMin?: number;
  sizeMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  isEncrypted?: boolean;
  uploadedBy?: string;
}

export interface FolderTreeNode extends CdnFolder {
  children: FolderTreeNode[];
  fileCount?: number;
  isExpanded?: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FileListResponse {
  files: CdnFile[];
  folders: CdnFolder[];
  total: number;
}

export interface UploadInitResponse {
  sessionToken: string;
  uploadUrl: string;
  chunkSize: number;
  totalChunks: number;
}

export interface ShareLinkValidation {
  valid: boolean;
  requiresPassword: boolean;
  file?: CdnFile;
  link?: CdnShareLink;
  error?: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface FileIconMap {
  [mimeType: string]: string; // Lucide icon name
}

export interface FileSizeFormatted {
  value: number;
  unit: 'B' | 'KB' | 'MB' | 'GB' | 'TB';
  formatted: string;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
  path: string;
}

// ============================================
// FORM TYPES
// ============================================

export interface CreateFolderFormData {
  name: string;
  description?: string;
  parentFolderId: string | null;
}

export interface UpdateFileFormData {
  display_name?: string;
  description?: string;
  tags?: string[];
  folder_id?: string | null;
}

export interface CreateCommentFormData {
  comment_text: string;
  comment_type?: CommentType;
  annotation_data?: AnnotationData;
  parent_comment_id?: string | null;
}

export interface CreateShareLinkFormData {
  file_id: string;
  expires_at?: string | null;
  password?: string;
  max_downloads?: number | null;
  allow_preview?: boolean;
  allow_download?: boolean;
}

// ============================================
// ENCRYPTION TYPES
// ============================================

export interface DerivedKeyData {
  key: CryptoKey;
  salt: Uint8Array;
  iterations: number;
}

export interface EncryptedFileData {
  encryptedData: ArrayBuffer;
  encryptedFileKey: ArrayBuffer;
  dataIv: Uint8Array;
  keyIv: Uint8Array;
  salt: Uint8Array;
}

export interface DecryptionSession {
  masterKey: CryptoKey;
  passphrase: string;
  createdAt: Date;
  expiresAt: Date;
}

// ============================================
// STATISTICS TYPES
// ============================================

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  usedQuota: number;
  maxQuota: number;
  percentageUsed: number;
  filesByType: Record<string, number>;
  recentUploads: number; // Last 7 days
}

export interface ActivityStats {
  totalActions: number;
  todayActions: number;
  actionsByType: Record<AuditActionType, number>;
  activeShareLinks: number;
  totalDownloads: number;
}

// ============================================
// CONTEXT TYPES (for React Context)
// ============================================

export interface CdnContextValue {
  // Current state
  currentFolderId: string | null;
  viewMode: FileViewMode;
  selectedFiles: Set<string>;

  // Files and folders
  files: CdnFile[];
  folders: CdnFolder[];
  isLoading: boolean;

  // Actions
  setCurrentFolderId: (id: string | null) => void;
  setViewMode: (mode: FileViewMode) => void;
  toggleFileSelection: (fileId: string) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;
  refreshFiles: () => Promise<void>;

  // Upload
  uploadQueue: FileUploadQueueItem[];
  addToUploadQueue: (files: File[], folderId: string | null, isEncrypted: boolean) => void;
}

// ============================================
// EXPORT HELPERS
// ============================================

export type * from './cdn'; // Re-export all types

// Type guards
export function isCdnFile(obj: any): obj is CdnFile {
  return obj && typeof obj.id === 'string' && typeof obj.mime_type === 'string';
}

export function isCdnFolder(obj: any): obj is CdnFolder {
  return obj && typeof obj.id === 'string' && typeof obj.path === 'string';
}
