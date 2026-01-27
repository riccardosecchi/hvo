'use server';

/**
 * CDN Folder Share Server Actions
 * Handles creation, validation, and management of shareable folder links
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ApiResponse } from '@/lib/types/cdn';
import crypto from 'crypto';

// Folder share link type
export interface FolderShareLink {
    id: string;
    folder_id: string;
    share_token: string;
    password_hash: string | null;
    expires_at: string | null;
    max_downloads: number | null;
    download_count: number;
    allow_preview: boolean;
    allow_download: boolean;
    is_active: boolean;
    created_by: string;
    created_at: string;
    last_accessed_at: string | null;
}

/**
 * Create a share link for a folder (shares all files within)
 */
export async function createFolderShareLink(params: {
    folderId: string;
    password?: string;
    expiresIn?: number; // hours
    maxDownloads?: number;
    allowPreview?: boolean;
    allowDownload?: boolean;
}): Promise<ApiResponse<FolderShareLink>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify folder exists
        const { data: folder, error: folderError } = await supabase
            .from('cdn_folders')
            .select('id, name')
            .eq('id', params.folderId)
            .single();

        if (folderError || !folder) {
            return { success: false, error: 'Folder not found' };
        }

        // Generate unique token
        const shareToken = crypto.randomUUID();

        // Hash password if provided
        let passwordHash: string | null = null;
        if (params.password) {
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(params.password, salt, 10000, 64, 'sha512').toString('hex');
            passwordHash = `${salt}:${hash}`;
        }

        // Calculate expiry date
        let expiresAt: string | null = null;
        if (params.expiresIn) {
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + params.expiresIn);
            expiresAt = expiry.toISOString();
        }

        // Insert into cdn_folder_share_links table (we'll create this)
        const { data, error } = await supabase
            .from('cdn_folder_share_links')
            .insert({
                folder_id: params.folderId,
                share_token: shareToken,
                password_hash: passwordHash,
                expires_at: expiresAt,
                max_downloads: params.maxDownloads || null,
                allow_preview: params.allowPreview ?? true,
                allow_download: params.allowDownload ?? true,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        // Log action
        await supabase.rpc('cdn_log_action', {
            p_action_type: 'folder_share_create',
            p_folder_id: params.folderId,
            p_metadata: { share_token: shareToken },
        });

        revalidatePath('/[locale]/admin/cdn', 'page');

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get all share links for a folder
 */
export async function getFolderShareLinks(folderId: string): Promise<ApiResponse<FolderShareLink[]>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('cdn_folder_share_links')
            .select('*')
            .eq('folder_id', folderId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Validate a folder share link
 */
export async function validateFolderShareLink(
    token: string,
    password?: string
): Promise<ApiResponse<{
    folder: any;
    files: any[];
    allowPreview: boolean;
    allowDownload: boolean;
    requiresPassword?: boolean;
}>> {
    try {
        // Use admin client to bypass RLS (as public users won't have access to cdn_folders table directly)
        const supabase = createAdminClient();

        // Get share link
        const { data: link, error } = await supabase
            .from('cdn_folder_share_links')
            .select('*, cdn_folders(*)')
            .eq('share_token', token)
            .single();

        if (error || !link) {
            return { success: false, error: 'Invalid share link' };
        }

        // Check if active
        if (!link.is_active) {
            return { success: false, error: 'This link has been revoked' };
        }

        // Check expiry
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return { success: false, error: 'This link has expired' };
        }

        // Check download limit
        if (link.max_downloads && link.download_count >= link.max_downloads) {
            return { success: false, error: 'Download limit reached' };
        }

        // Verify password if required
        if (link.password_hash) {
            if (!password) {
                return { success: false, error: 'Password required', data: { requiresPassword: true } as any };
            }

            const [salt, storedHash] = link.password_hash.split(':');
            const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

            if (hash !== storedHash) {
                return { success: false, error: 'Invalid password' };
            }
        }

        // Get files in folder
        const { data: files } = await supabase
            .from('cdn_files')
            .select('id, name, display_name, mime_type, file_size, storage_path')
            .eq('folder_id', link.folder_id)
            .is('deleted_at', null);

        return {
            success: true,
            data: {
                folder: link.cdn_folders,
                files: files || [],
                allowPreview: link.allow_preview,
                allowDownload: link.allow_download,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Revoke a folder share link
 */
export async function revokeFolderShareLink(linkId: string): Promise<ApiResponse<void>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabase
            .from('cdn_folder_share_links')
            .update({ is_active: false })
            .eq('id', linkId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/[locale]/admin/cdn', 'page');

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
