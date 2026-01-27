'use server';

/**
 * CDN Upload Server Actions
 * Handles upload session management and file creation after upload
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ApiResponse, CdnFile, CdnUploadSession } from '@/lib/types/cdn';
import { createFile } from './files';

// ============================================
// UPLOAD SESSION MANAGEMENT
// ============================================

/**
 * Create a new upload session
 */
export async function createUploadSession(params: {
  fileName: string;
  fileSize: number;
  mimeType: string;
  folderId: string | null;
  isEncrypted: boolean;
}): Promise<ApiResponse<CdnUploadSession>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate file size (5GB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    if (params.fileSize > MAX_FILE_SIZE) {
      return { success: false, error: 'File size exceeds maximum limit of 5GB' };
    }

    // Calculate chunks
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    const totalChunks = Math.ceil(params.fileSize / CHUNK_SIZE);

    // Create session token
    const sessionToken = crypto.randomUUID();

    // Set expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create session in database
    const { data, error } = await supabase
      .from('cdn_upload_sessions')
      .insert({
        session_token: sessionToken,
        file_name: params.fileName,
        file_size: params.fileSize,
        mime_type: params.mimeType,
        total_chunks: totalChunks,
        folder_id: params.folderId,
        is_encrypted: params.isEncrypted,
        uploaded_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data,
      message: 'Upload session created successfully',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get upload session by token
 */
export async function getUploadSession(
  sessionToken: string
): Promise<ApiResponse<CdnUploadSession>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('cdn_upload_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Check if session belongs to user
    if (data.uploaded_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update upload progress
 */
export async function updateSessionProgress(
  sessionToken: string,
  chunkIndex: number,
  bytesUploaded: number
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get current session
    const { data: session } = await supabase
      .from('cdn_upload_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.uploaded_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Add chunk index to uploaded list if not already there
    const uploadedIndexes = session.uploaded_chunk_indexes || [];
    if (!uploadedIndexes.includes(chunkIndex)) {
      uploadedIndexes.push(chunkIndex);
      uploadedIndexes.sort((a: number, b: number) => a - b);
    }

    // Update session
    const { error } = await supabase
      .from('cdn_upload_sessions')
      .update({
        chunks_uploaded: uploadedIndexes.length,
        bytes_uploaded: bytesUploaded,
        uploaded_chunk_indexes: uploadedIndexes,
      })
      .eq('session_token', sessionToken);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Complete upload and create file record
 */
export async function completeUpload(params: {
  sessionToken: string;
  storagePath: string;
  displayName: string;
  description?: string;
  tags?: string[];
  thumbnailPath?: string;
  encryptionKeyId?: string;
  encryptionMetadata?: any;
}): Promise<ApiResponse<CdnFile>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get upload session
    const { data: session, error: sessionError } = await supabase
      .from('cdn_upload_sessions')
      .select('*')
      .eq('session_token', params.sessionToken)
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.uploaded_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (session.status !== 'active') {
      return { success: false, error: 'Session is not active' };
    }

    // Verify all chunks uploaded
    if (session.chunks_uploaded !== session.total_chunks) {
      return {
        success: false,
        error: `Incomplete upload: ${session.chunks_uploaded}/${session.total_chunks} chunks uploaded`,
      };
    }

    // Create file record
    const fileResult = await createFile({
      name: session.file_name,
      display_name: params.displayName,
      description: params.description,
      mime_type: session.mime_type,
      file_size: session.file_size,
      storage_path: params.storagePath,
      folder_id: session.folder_id,
      is_encrypted: session.is_encrypted,
      encryption_key_id: params.encryptionKeyId,
      encryption_metadata: params.encryptionMetadata,
      tags: params.tags,
      thumbnail_path: params.thumbnailPath,
    });

    if (!fileResult.success || !fileResult.data) {
      return { success: false, error: fileResult.error || 'Failed to create file record' };
    }

    // Mark session as completed
    await supabase
      .from('cdn_upload_sessions')
      .update({ status: 'completed' })
      .eq('session_token', params.sessionToken);

    revalidatePath('/[locale]/admin/cdn', 'page');

    return {
      success: true,
      data: fileResult.data,
      message: 'Upload completed successfully',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancel upload session
 */
export async function cancelSession(sessionToken: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get session
    const { data: session } = await supabase
      .from('cdn_upload_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.uploaded_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update session status
    const { error } = await supabase
      .from('cdn_upload_sessions')
      .update({ status: 'cancelled' })
      .eq('session_token', sessionToken);

    if (error) {
      return { success: false, error: error.message };
    }

    // TODO: Clean up partial chunks from storage

    return { success: true, message: 'Upload cancelled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Retry failed upload session
 */
export async function retrySession(sessionToken: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get session
    const { data: session } = await supabase
      .from('cdn_upload_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.uploaded_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (session.status !== 'failed') {
      return { success: false, error: 'Can only retry failed sessions' };
    }

    // Reset session to active
    const { error } = await supabase
      .from('cdn_upload_sessions')
      .update({
        status: 'active',
        error_message: null,
      })
      .eq('session_token', sessionToken);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Session ready for retry' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all active upload sessions for current user
 */
export async function getActiveSessions(): Promise<ApiResponse<CdnUploadSession[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('cdn_upload_sessions')
      .select('*')
      .eq('uploaded_by', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Clean up expired sessions (scheduled task)
 */
export async function cleanupExpiredSessions(): Promise<ApiResponse<{ deleted: number }>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Call database function
    const { data, error } = await supabase.rpc('cleanup_expired_upload_sessions');

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { deleted: data || 0 },
      message: `Cleaned up ${data || 0} expired sessions`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate storage path for file
 */
export function generateStoragePath(userId: string, fileName: string): string {
  const fileId = crypto.randomUUID();
  const sanitized = sanitizeFileName(fileName);
  return `${userId}/${fileId}/${sanitized}`;
}

/**
 * Sanitize file name
 */
function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');

  // Replace dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const nameWithoutExt = sanitized.substring(0, sanitized.length - ext.length - 1);
    sanitized = nameWithoutExt.substring(0, 250 - ext.length) + '.' + ext;
  }

  return sanitized;
}
