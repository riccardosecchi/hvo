'use server';

/**
 * CDN File Operations - Server Actions
 * Handles all file CRUD operations with authentication and audit logging
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CdnFile, ApiResponse, UpdateFileFormData } from '@/lib/types/cdn';

// ============================================
// FILE QUERIES
// ============================================

/**
 * Get all files in a folder (or root if folderId is null)
 */
export async function getFiles(
  folderId: string | null = null,
  options?: {
    includeDeleted?: boolean;
    sortBy?: 'name' | 'created_at' | 'file_size';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
): Promise<ApiResponse<CdnFile[]>> {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    let query = supabase
      .from('cdn_files')
      .select('*')
      .eq('folder_id', folderId);

    // Filter deleted files
    if (!options?.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    // Sorting
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get a single file by ID
 */
export async function getFileById(fileId: string): Promise<ApiResponse<CdnFile>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('cdn_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log file view
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'file_view',
      p_file_id: fileId,
      p_metadata: { file_name: data.display_name },
    });

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Search files by name, description, or tags
 */
export async function searchFiles(
  query: string,
  folderId?: string | null
): Promise<ApiResponse<CdnFile[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    let dbQuery = supabase
      .from('cdn_files')
      .select('*')
      .is('deleted_at', null)
      .or(`display_name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (folderId !== undefined) {
      dbQuery = dbQuery.eq('folder_id', folderId);
    }

    const { data, error } = await dbQuery;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// FILE MUTATIONS
// ============================================

/**
 * Create a file record after upload
 */
export async function createFile(params: {
  name: string;
  display_name: string;
  description?: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  folder_id?: string | null;
  is_encrypted?: boolean;
  encryption_key_id?: string;
  encryption_metadata?: any;
  tags?: string[];
  thumbnail_path?: string;
}): Promise<ApiResponse<CdnFile>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('cdn_files')
      .insert({
        ...params,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log file upload
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'file_upload',
      p_file_id: data.id,
      p_metadata: {
        file_name: data.display_name,
        file_size: data.file_size,
        mime_type: data.mime_type,
      },
    });

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, data, message: 'File uploaded successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update file metadata
 */
export async function updateFile(
  fileId: string,
  updates: UpdateFileFormData
): Promise<ApiResponse<CdnFile>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get current file for logging
    const { data: currentFile } = await supabase
      .from('cdn_files')
      .select('display_name')
      .eq('id', fileId)
      .single();

    const { data, error } = await supabase
      .from('cdn_files')
      .update(updates)
      .eq('id', fileId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log file update
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'file_update',
      p_file_id: fileId,
      p_metadata: {
        old_name: currentFile?.display_name,
        new_name: updates.display_name,
        changes: Object.keys(updates),
      },
    });

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, data, message: 'File updated successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Soft delete a file
 */
export async function deleteFile(fileId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get file info for logging
    const { data: file } = await supabase
      .from('cdn_files')
      .select('display_name')
      .eq('id', fileId)
      .single();

    // Soft delete
    const { error } = await supabase
      .from('cdn_files')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', fileId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log file deletion
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'file_delete',
      p_file_id: fileId,
      p_metadata: { file_name: file?.display_name },
    });

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, message: 'File deleted successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Restore a soft-deleted file
 */
export async function restoreFile(fileId: string): Promise<ApiResponse<CdnFile>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('cdn_files')
      .update({ deleted_at: null })
      .eq('id', fileId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log file restoration
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'file_restore',
      p_file_id: fileId,
      p_metadata: { file_name: data.display_name },
    });

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, data, message: 'File restored successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Permanently delete a file (removes from storage and database)
 */
export async function permanentlyDeleteFile(fileId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get file info
    const { data: file } = await supabase
      .from('cdn_files')
      .select('storage_path, display_name, thumbnail_path')
      .eq('id', fileId)
      .single();

    if (!file) {
      return { success: false, error: 'File not found' };
    }

    // Delete from storage
    const filesToDelete = [file.storage_path];
    if (file.thumbnail_path) {
      filesToDelete.push(file.thumbnail_path);
    }

    const { error: storageError } = await supabase.storage
      .from('cdn-files')
      .remove(filesToDelete);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('cdn_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, message: 'File permanently deleted' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Move a file to a different folder
 */
export async function moveFile(
  fileId: string,
  targetFolderId: string | null
): Promise<ApiResponse<CdnFile>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get file info for logging
    const { data: file } = await supabase
      .from('cdn_files')
      .select('display_name, folder_id')
      .eq('id', fileId)
      .single();

    const { data, error } = await supabase
      .from('cdn_files')
      .update({ folder_id: targetFolderId })
      .eq('id', fileId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log file move
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'file_move',
      p_file_id: fileId,
      p_metadata: {
        file_name: file?.display_name,
        old_folder_id: file?.folder_id,
        new_folder_id: targetFolderId,
      },
    });

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, data, message: 'File moved successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Duplicate a file
 */
export async function duplicateFile(fileId: string): Promise<ApiResponse<CdnFile>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get original file
    const { data: originalFile, error: fetchError } = await supabase
      .from('cdn_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError || !originalFile) {
      return { success: false, error: 'File not found' };
    }

    // Copy file in storage
    const newStoragePath = originalFile.storage_path.replace(
      /\/([^/]+)$/,
      `/copy_${Date.now()}_$1`
    );

    const { data: fileData } = await supabase.storage
      .from('cdn-files')
      .download(originalFile.storage_path);

    if (!fileData) {
      return { success: false, error: 'Failed to download original file' };
    }

    await supabase.storage
      .from('cdn-files')
      .upload(newStoragePath, fileData, {
        contentType: originalFile.mime_type,
      });

    // Create new file record
    const { data: newFile, error: createError } = await supabase
      .from('cdn_files')
      .insert({
        name: `copy_${originalFile.name}`,
        display_name: `${originalFile.display_name} (Copy)`,
        description: originalFile.description,
        mime_type: originalFile.mime_type,
        file_size: originalFile.file_size,
        storage_path: newStoragePath,
        folder_id: originalFile.folder_id,
        tags: originalFile.tags,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      return { success: false, error: createError.message };
    }

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, data: newFile, message: 'File duplicated successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get download URL for a file
 */
export async function getFileDownloadUrl(
  fileId: string,
  expiresIn: number = 3600
): Promise<ApiResponse<{ url: string; expiresAt: Date }>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get file
    const { data: file } = await supabase
      .from('cdn_files')
      .select('storage_path, display_name, is_encrypted')
      .eq('id', fileId)
      .single();

    if (!file) {
      return { success: false, error: 'File not found' };
    }

    // Create signed URL
    const { data, error } = await supabase.storage
      .from('cdn-files')
      .createSignedUrl(file.storage_path, expiresIn);

    if (error || !data) {
      return { success: false, error: 'Failed to generate download URL' };
    }

    // Log file download
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'file_download',
      p_file_id: fileId,
      p_metadata: { file_name: file.display_name },
    });

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      success: true,
      data: {
        url: data.signedUrl,
        expiresAt,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<
  ApiResponse<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
  }>
> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get all non-deleted files
    const { data: files } = await supabase
      .from('cdn_files')
      .select('file_size, mime_type')
      .is('deleted_at', null);

    if (!files) {
      return {
        success: true,
        data: { totalFiles: 0, totalSize: 0, filesByType: {} },
      };
    }

    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.file_size, 0);

    // Group by MIME type category
    const filesByType: Record<string, number> = {};
    files.forEach((file) => {
      const category = file.mime_type.split('/')[0];
      filesByType[category] = (filesByType[category] || 0) + 1;
    });

    return {
      success: true,
      data: { totalFiles, totalSize, filesByType },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
