/**
 * CDN Chunked Upload System
 * Handles large file uploads with resume capability using Supabase Storage
 */

import { createClient } from '@/lib/supabase/client';
import type { UploadProgress, FileUploadQueueItem } from '@/lib/types/cdn';

// ============================================
// CONSTANTS
// ============================================

export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
export const PARALLEL_UPLOADS = 3; // Max concurrent chunk uploads
export const MAX_RETRIES = 5;
export const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

// ============================================
// UPLOAD SESSION MANAGEMENT
// ============================================

/**
 * Initialize a chunked upload session
 * Creates a session record in the database and prepares for chunk uploads
 */
export async function initializeUpload(params: {
  fileName: string;
  fileSize: number;
  mimeType: string;
  folderId: string | null;
  isEncrypted: boolean;
}): Promise<{
  sessionToken: string;
  totalChunks: number;
  chunkSize: number;
}> {
  const totalChunks = Math.ceil(params.fileSize / CHUNK_SIZE);
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const supabase = createClient();

  // Create upload session in database
  const { error } = await supabase.from('cdn_upload_sessions').insert({
    session_token: sessionToken,
    file_name: params.fileName,
    file_size: params.fileSize,
    mime_type: params.mimeType,
    total_chunks: totalChunks,
    folder_id: params.folderId,
    is_encrypted: params.isEncrypted,
    uploaded_by: (await supabase.auth.getUser()).data.user?.id,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to initialize upload session: ${error.message}`);
  }

  return {
    sessionToken,
    totalChunks,
    chunkSize: CHUNK_SIZE,
  };
}

/**
 * Get upload session details
 */
export async function getUploadSession(sessionToken: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cdn_upload_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single();

  if (error) {
    throw new Error(`Failed to get upload session: ${error.message}`);
  }

  return data;
}

/**
 * Update upload session progress
 */
export async function updateUploadProgress(
  sessionToken: string,
  chunkIndex: number,
  bytesUploaded: number
) {
  const supabase = createClient();

  // Get current session
  const session = await getUploadSession(sessionToken);

  // Add chunk index to uploaded list if not already there
  const uploadedIndexes = session.uploaded_chunk_indexes || [];
  if (!uploadedIndexes.includes(chunkIndex)) {
    uploadedIndexes.push(chunkIndex);
  }

  // Update session
  const { error } = await supabase
    .from('cdn_upload_sessions')
    .update({
      chunks_uploaded: uploadedIndexes.length,
      bytes_uploaded: bytesUploaded,
      uploaded_chunk_indexes: uploadedIndexes,
      updated_at: new Date().toISOString(),
    })
    .eq('session_token', sessionToken);

  if (error) {
    throw new Error(`Failed to update upload progress: ${error.message}`);
  }
}

/**
 * Mark upload session as completed
 */
export async function completeUploadSession(sessionToken: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('cdn_upload_sessions')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('session_token', sessionToken);

  if (error) {
    throw new Error(`Failed to complete upload session: ${error.message}`);
  }
}

/**
 * Mark upload session as failed
 */
export async function failUploadSession(
  sessionToken: string,
  errorMessage: string
) {
  const supabase = createClient();
  const { error } = await supabase
    .from('cdn_upload_sessions')
    .update({
      status: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('session_token', sessionToken);

  if (error) {
    console.error('Failed to mark session as failed:', error);
  }
}

/**
 * Cancel upload session
 */
export async function cancelUploadSession(sessionToken: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('cdn_upload_sessions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('session_token', sessionToken);

  if (error) {
    throw new Error(`Failed to cancel upload session: ${error.message}`);
  }
}

// ============================================
// CHUNK UPLOAD
// ============================================

/**
 * Upload a single chunk with retry logic
 */
async function uploadChunkWithRetry(
  chunk: Blob,
  storagePath: string,
  chunkIndex: number,
  retryCount: number = 0
): Promise<void> {
  const supabase = createClient();

  try {
    // For Supabase Storage, we'll upload the chunk to a temporary path
    // Then concatenate all chunks in the finalize step
    const chunkPath = `${storagePath}.chunk.${chunkIndex}`;

    const { error } = await supabase.storage
      .from('cdn-files')
      .upload(chunkPath, chunk, {
        contentType: 'application/octet-stream',
        upsert: true, // Allow resume by overwriting
      });

    if (error) {
      throw error;
    }
  } catch (error: any) {
    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount];
      await new Promise((resolve) => setTimeout(resolve, delay));
      return uploadChunkWithRetry(chunk, storagePath, chunkIndex, retryCount + 1);
    }
    throw new Error(
      `Failed to upload chunk ${chunkIndex} after ${MAX_RETRIES} retries: ${error.message}`
    );
  }
}

/**
 * Upload file in chunks with progress tracking
 */
export async function uploadFileInChunks(
  file: File,
  sessionToken: string,
  storagePath: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  const session = await getUploadSession(sessionToken);
  const totalChunks = session.total_chunks;
  const uploadedIndexes = session.uploaded_chunk_indexes || [];

  // Calculate which chunks need to be uploaded (for resume capability)
  const chunksToUpload: number[] = [];
  for (let i = 0; i < totalChunks; i++) {
    if (!uploadedIndexes.includes(i)) {
      chunksToUpload.push(i);
    }
  }

  if (chunksToUpload.length === 0) {
    // All chunks already uploaded
    return;
  }

  const startTime = Date.now();
  let bytesUploadedSoFar = session.bytes_uploaded || 0;

  // Upload chunks in parallel (with concurrency limit)
  const uploadQueue = [...chunksToUpload];
  const activeUploads = new Set<Promise<void>>();

  while (uploadQueue.length > 0 || activeUploads.size > 0) {
    // Start new uploads up to the parallel limit
    while (uploadQueue.length > 0 && activeUploads.size < PARALLEL_UPLOADS) {
      const chunkIndex = uploadQueue.shift()!;
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const uploadPromise = (async () => {
        try {
          await uploadChunkWithRetry(chunk, storagePath, chunkIndex);

          // Update progress
          bytesUploadedSoFar += chunk.size;
          await updateUploadProgress(
            sessionToken,
            chunkIndex,
            bytesUploadedSoFar
          );

          // Report progress
          if (onProgress) {
            const elapsedTime = (Date.now() - startTime) / 1000; // seconds
            const speed = bytesUploadedSoFar / elapsedTime; // bytes per second
            const remainingBytes = file.size - bytesUploadedSoFar;
            const estimatedTimeRemaining = remainingBytes / speed;

            onProgress({
              bytesUploaded: bytesUploadedSoFar,
              totalBytes: file.size,
              percentage: (bytesUploadedSoFar / file.size) * 100,
              speed,
              estimatedTimeRemaining,
              currentChunk: chunkIndex + 1,
              totalChunks,
              status: 'uploading',
            });
          }
        } catch (error: any) {
          await failUploadSession(sessionToken, error.message);
          throw error;
        } finally {
          activeUploads.delete(uploadPromise);
        }
      })();

      activeUploads.add(uploadPromise);
    }

    // Wait for at least one upload to complete
    if (activeUploads.size > 0) {
      await Promise.race(activeUploads);
    }
  }

  // All chunks uploaded successfully
  if (onProgress) {
    onProgress({
      bytesUploaded: file.size,
      totalBytes: file.size,
      percentage: 100,
      speed: 0,
      estimatedTimeRemaining: 0,
      currentChunk: totalChunks,
      totalChunks,
      status: 'completed',
    });
  }
}

// ============================================
// FINALIZE UPLOAD
// ============================================

/**
 * Finalize chunked upload by concatenating all chunks
 * @param sessionToken - Upload session token
 * @param storagePath - Final storage path
 * @returns Final file path
 */
export async function finalizeChunkedUpload(
  sessionToken: string,
  storagePath: string
): Promise<string> {
  const supabase = createClient();
  const session = await getUploadSession(sessionToken);

  if (session.status !== 'active') {
    throw new Error('Upload session is not active');
  }

  if (session.chunks_uploaded !== session.total_chunks) {
    throw new Error('Not all chunks have been uploaded');
  }

  try {
    // For Supabase Storage, we need to concatenate chunks
    // Since Supabase doesn't have native chunk concatenation, we'll use a different approach:
    // Upload each chunk with a part number, then use the Storage API to combine them

    // For now, we'll use a simpler approach: download chunks and re-upload as complete file
    // In production, you might want to use Supabase Edge Functions for this

    const chunks: Blob[] = [];
    for (let i = 0; i < session.total_chunks; i++) {
      const chunkPath = `${storagePath}.chunk.${i}`;
      const { data, error } = await supabase.storage
        .from('cdn-files')
        .download(chunkPath);

      if (error) {
        throw new Error(`Failed to download chunk ${i}: ${error.message}`);
      }

      chunks.push(data);
    }

    // Concatenate chunks into final file
    const finalBlob = new Blob(chunks, { type: session.mime_type });

    // Upload final file
    const { error: uploadError } = await supabase.storage
      .from('cdn-files')
      .upload(storagePath, finalBlob, {
        contentType: session.mime_type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload final file: ${uploadError.message}`);
    }

    // Clean up chunk files
    for (let i = 0; i < session.total_chunks; i++) {
      const chunkPath = `${storagePath}.chunk.${i}`;
      await supabase.storage.from('cdn-files').remove([chunkPath]);
    }

    // Mark session as completed
    await completeUploadSession(sessionToken);

    return storagePath;
  } catch (error: any) {
    await failUploadSession(sessionToken, error.message);
    throw error;
  }
}

// ============================================
// SIMPLE UPLOAD (for small files < 5MB)
// ============================================

/**
 * Upload a file directly without chunking (for small files)
 */
export async function uploadFileDirect(
  file: File,
  storagePath: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const supabase = createClient();

  // Report progress
  if (onProgress) {
    onProgress(0);
  }

  const { error } = await supabase.storage
    .from('cdn-files')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  if (onProgress) {
    onProgress(100);
  }

  return storagePath;
}

// ============================================
// STORAGE PATH GENERATION
// ============================================

/**
 * Generate a unique storage path for a file
 * Format: {userId}/{fileId}/{sanitizedFileName}
 */
export function generateStoragePath(
  userId: string,
  fileName: string
): string {
  const fileId = crypto.randomUUID();
  const sanitizedFileName = sanitizeFileName(fileName);
  return `${userId}/${fileId}/${sanitizedFileName}`;
}

/**
 * Sanitize file name by removing dangerous characters
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');

  // Replace dangerous characters with underscores
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const nameWithoutExt = sanitized.substring(
      0,
      sanitized.length - ext.length - 1
    );
    sanitized = nameWithoutExt.substring(0, 250 - ext.length) + '.' + ext;
  }

  return sanitized;
}

// ============================================
// UPLOAD QUEUE MANAGEMENT (Client-side)
// ============================================

/**
 * Upload queue for managing multiple file uploads
 */
export class UploadQueue {
  private queue: FileUploadQueueItem[] = [];
  private activeUploads = new Map<string, AbortController>();

  /**
   * Add files to upload queue
   */
  add(files: File[], folderId: string | null, isEncrypted: boolean = false): string[] {
    const ids: string[] = [];

    for (const file of files) {
      const id = crypto.randomUUID();
      const item: FileUploadQueueItem = {
        id,
        file,
        folderId,
        isEncrypted,
        progress: {
          bytesUploaded: 0,
          totalBytes: file.size,
          percentage: 0,
          speed: 0,
          estimatedTimeRemaining: 0,
          currentChunk: 0,
          totalChunks: Math.ceil(file.size / CHUNK_SIZE),
          status: 'uploading',
        },
      };

      this.queue.push(item);
      ids.push(id);
    }

    return ids;
  }

  /**
   * Get all items in queue
   */
  getAll(): FileUploadQueueItem[] {
    return [...this.queue];
  }

  /**
   * Get item by ID
   */
  get(id: string): FileUploadQueueItem | undefined {
    return this.queue.find((item) => item.id === id);
  }

  /**
   * Update progress for an item
   */
  updateProgress(id: string, progress: Partial<UploadProgress>) {
    const item = this.get(id);
    if (item) {
      item.progress = { ...item.progress, ...progress };
    }
  }

  /**
   * Remove item from queue
   */
  remove(id: string) {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }

    // Cancel if actively uploading
    const controller = this.activeUploads.get(id);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(id);
    }
  }

  /**
   * Clear completed uploads
   */
  clearCompleted() {
    this.queue = this.queue.filter(
      (item) => item.progress.status !== 'completed'
    );
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      total: this.queue.length,
      uploading: this.queue.filter((item) => item.progress.status === 'uploading')
        .length,
      completed: this.queue.filter((item) => item.progress.status === 'completed')
        .length,
      error: this.queue.filter((item) => item.progress.status === 'error').length,
    };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format time to human-readable duration
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  } else {
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
}

/**
 * Calculate upload speed in human-readable format
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}
