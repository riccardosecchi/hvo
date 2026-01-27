'use server';

/**
 * CDN Share Link Server Actions
 * Handles creation, validation, and management of shareable file links
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ApiResponse, CdnShareLink } from '@/lib/types/cdn';
import crypto from 'crypto';

// ============================================
// SHARE LINK OPERATIONS
// ============================================

/**
 * Create a new share link for a file
 */
export async function createShareLink(params: {
    fileId: string;
    password?: string;
    expiresIn?: number; // hours, null = never
    maxDownloads?: number;
    allowPreview?: boolean;
    allowDownload?: boolean;
}): Promise<ApiResponse<CdnShareLink>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
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

        const { data, error } = await supabase
            .from('cdn_share_links')
            .insert({
                file_id: params.fileId,
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
            p_action_type: 'share_create',
            p_file_id: params.fileId,
            p_share_link_id: data.id,
            p_metadata: { expires_in: params.expiresIn, has_password: !!params.password },
        });

        revalidatePath('/[locale]/admin/cdn', 'page');

        return { success: true, data, message: 'Share link created' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get all share links for a file
 */
export async function getShareLinks(fileId: string): Promise<ApiResponse<CdnShareLink[]>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('cdn_share_links')
            .select('*')
            .eq('file_id', fileId)
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

/**
 * Validate a share link (public access)
 */
export async function validateShareLink(
    token: string,
    password?: string
): Promise<ApiResponse<{ file: any; allowPreview: boolean; allowDownload: boolean }>> {
    try {
        const supabase = await createClient();

        // Get share link
        const { data: link, error } = await supabase
            .from('cdn_share_links')
            .select('*, cdn_files(*)')
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

        return {
            success: true,
            data: {
                file: link.cdn_files,
                allowPreview: link.allow_preview,
                allowDownload: link.allow_download,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Log share link access and increment download count
 */
export async function recordShareAccess(
    token: string,
    action: 'view' | 'download'
): Promise<ApiResponse<void>> {
    try {
        const supabase = await createClient();

        const { data: link } = await supabase
            .from('cdn_share_links')
            .select('id, file_id, download_count')
            .eq('share_token', token)
            .single();

        if (!link) {
            return { success: false, error: 'Link not found' };
        }

        if (action === 'download') {
            await supabase
                .from('cdn_share_links')
                .update({
                    download_count: (link.download_count || 0) + 1,
                    last_accessed_at: new Date().toISOString(),
                })
                .eq('id', link.id);
        } else {
            await supabase
                .from('cdn_share_links')
                .update({ last_accessed_at: new Date().toISOString() })
                .eq('id', link.id);
        }

        // Log action
        await supabase.rpc('cdn_log_action', {
            p_action_type: 'share_access',
            p_file_id: link.file_id,
            p_share_link_id: link.id,
            p_metadata: { action },
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Revoke a share link
 */
export async function revokeShareLink(linkId: string): Promise<ApiResponse<void>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data: link } = await supabase
            .from('cdn_share_links')
            .select('file_id')
            .eq('id', linkId)
            .single();

        const { error } = await supabase
            .from('cdn_share_links')
            .update({ is_active: false })
            .eq('id', linkId);

        if (error) {
            return { success: false, error: error.message };
        }

        // Log action
        if (link) {
            await supabase.rpc('cdn_log_action', {
                p_action_type: 'share_revoke',
                p_file_id: link.file_id,
                p_share_link_id: linkId,
            });
        }

        revalidatePath('/[locale]/admin/cdn', 'page');

        return { success: true, message: 'Share link revoked' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get signed download URL for shared file
 */
export async function getSharedFileUrl(token: string): Promise<ApiResponse<{ url: string }>> {
    try {
        const supabase = await createClient();

        const { data: link } = await supabase
            .from('cdn_share_links')
            .select('cdn_files(storage_path)')
            .eq('share_token', token)
            .single();

        if (!link || !link.cdn_files) {
            return { success: false, error: 'File not found' };
        }

        const { data, error } = await supabase.storage
            .from('cdn-files')
            .createSignedUrl((link.cdn_files as any).storage_path, 3600);

        if (error || !data) {
            return { success: false, error: 'Failed to generate URL' };
        }

        return { success: true, data: { url: data.signedUrl } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
