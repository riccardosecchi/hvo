'use server';

/**
 * CDN File Versioning Server Actions
 * Handles file version history and restoration
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ApiResponse, CdnFileVersion, CdnFile } from '@/lib/types/cdn';

/**
 * Get version history for a file
 */
export async function getVersionHistory(fileId: string): Promise<ApiResponse<CdnFileVersion[]>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('cdn_file_versions')
            .select(`
        *,
        profiles:created_by(id, email, full_name)
      `)
            .eq('file_id', fileId)
            .order('version_number', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Create a new version (called when uploading a new version of existing file)
 */
export async function createVersion(params: {
    fileId: string;
    storagePath: string;
    fileSize: number;
    mimeType: string;
    changeDescription?: string;
}): Promise<ApiResponse<CdnFileVersion>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get current file
        const { data: file, error: fileError } = await supabase
            .from('cdn_files')
            .select('*')
            .eq('id', params.fileId)
            .single();

        if (fileError || !file) {
            return { success: false, error: 'File not found' };
        }

        // Save current version to history
        const { data: version, error: versionError } = await supabase
            .from('cdn_file_versions')
            .insert({
                file_id: params.fileId,
                version_number: file.version_number,
                storage_path: file.storage_path,
                file_size: file.file_size,
                mime_type: file.mime_type,
                change_description: params.changeDescription,
                created_by: user.id,
            })
            .select()
            .single();

        if (versionError) {
            return { success: false, error: versionError.message };
        }

        // Update file with new version
        await supabase
            .from('cdn_files')
            .update({
                storage_path: params.storagePath,
                file_size: params.fileSize,
                mime_type: params.mimeType,
                version_number: file.version_number + 1,
            })
            .eq('id', params.fileId);

        // Log action
        await supabase.rpc('cdn_log_action', {
            p_action_type: 'version_create',
            p_file_id: params.fileId,
            p_metadata: { new_version: file.version_number + 1 },
        });

        revalidatePath('/[locale]/admin/cdn', 'page');

        return { success: true, data: version };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Restore a previous version
 */
export async function restoreVersion(
    fileId: string,
    versionNumber: number
): Promise<ApiResponse<CdnFile>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get the version to restore
        const { data: version, error: versionError } = await supabase
            .from('cdn_file_versions')
            .select('*')
            .eq('file_id', fileId)
            .eq('version_number', versionNumber)
            .single();

        if (versionError || !version) {
            return { success: false, error: 'Version not found' };
        }

        // Get current file
        const { data: file } = await supabase
            .from('cdn_files')
            .select('*')
            .eq('id', fileId)
            .single();

        if (!file) {
            return { success: false, error: 'File not found' };
        }

        // Save current as new version
        await supabase
            .from('cdn_file_versions')
            .insert({
                file_id: fileId,
                version_number: file.version_number,
                storage_path: file.storage_path,
                file_size: file.file_size,
                mime_type: file.mime_type,
                change_description: `Restored from version ${versionNumber}`,
                created_by: user.id,
            });

        // Update file with restored version
        const { data: updated, error: updateError } = await supabase
            .from('cdn_files')
            .update({
                storage_path: version.storage_path,
                file_size: version.file_size,
                mime_type: version.mime_type,
                version_number: file.version_number + 1,
            })
            .eq('id', fileId)
            .select()
            .single();

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        // Log action
        await supabase.rpc('cdn_log_action', {
            p_action_type: 'version_restore',
            p_file_id: fileId,
            p_metadata: { restored_version: versionNumber },
        });

        revalidatePath('/[locale]/admin/cdn', 'page');

        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete a specific version
 */
export async function deleteVersion(
    fileId: string,
    versionNumber: number
): Promise<ApiResponse<void>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get version to delete
        const { data: version } = await supabase
            .from('cdn_file_versions')
            .select('storage_path')
            .eq('file_id', fileId)
            .eq('version_number', versionNumber)
            .single();

        if (!version) {
            return { success: false, error: 'Version not found' };
        }

        // Delete from storage
        await supabase.storage
            .from('cdn-files')
            .remove([version.storage_path]);

        // Delete version record
        const { error } = await supabase
            .from('cdn_file_versions')
            .delete()
            .eq('file_id', fileId)
            .eq('version_number', versionNumber);

        if (error) {
            return { success: false, error: error.message };
        }

        // Log action
        await supabase.rpc('cdn_log_action', {
            p_action_type: 'version_delete',
            p_file_id: fileId,
            p_metadata: { deleted_version: versionNumber },
        });

        revalidatePath('/[locale]/admin/cdn', 'page');

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get download URL for a specific version
 */
export async function getVersionDownloadUrl(
    fileId: string,
    versionNumber: number
): Promise<ApiResponse<{ url: string }>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data: version } = await supabase
            .from('cdn_file_versions')
            .select('storage_path')
            .eq('file_id', fileId)
            .eq('version_number', versionNumber)
            .single();

        if (!version) {
            return { success: false, error: 'Version not found' };
        }

        const { data, error } = await supabase.storage
            .from('cdn-files')
            .createSignedUrl(version.storage_path, 3600);

        if (error || !data) {
            return { success: false, error: 'Failed to generate URL' };
        }

        return { success: true, data: { url: data.signedUrl } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
