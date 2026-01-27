'use server';

/**
 * CDN Comments Server Actions
 * Handles file comments and threaded replies
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ApiResponse, CdnFileComment } from '@/lib/types/cdn';

/**
 * Get comments for a file
 */
export async function getComments(fileId: string): Promise<ApiResponse<CdnFileComment[]>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('cdn_file_comments')
            .select(`
        *,
        profiles:created_by(id, email, full_name)
      `)
            .eq('file_id', fileId)
            .order('created_at', { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Create a new comment
 */
export async function createComment(params: {
    fileId: string;
    text: string;
    parentCommentId?: string;
}): Promise<ApiResponse<CdnFileComment>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('cdn_file_comments')
            .insert({
                file_id: params.fileId,
                comment_text: params.text,
                parent_comment_id: params.parentCommentId || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        // Log action
        await supabase.rpc('cdn_log_action', {
            p_action_type: 'comment_create',
            p_file_id: params.fileId,
            p_metadata: { comment_id: data.id },
        });

        revalidatePath('/[locale]/admin/cdn', 'page');

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Update a comment
 */
export async function updateComment(
    commentId: string,
    text: string
): Promise<ApiResponse<CdnFileComment>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify ownership
        const { data: existing } = await supabase
            .from('cdn_file_comments')
            .select('created_by')
            .eq('id', commentId)
            .single();

        if (!existing || existing.created_by !== user.id) {
            return { success: false, error: 'Cannot edit this comment' };
        }

        const { data, error } = await supabase
            .from('cdn_file_comments')
            .update({
                comment_text: text,
                is_edited: true,
            })
            .eq('id', commentId)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/[locale]/admin/cdn', 'page');

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<ApiResponse<void>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data: comment } = await supabase
            .from('cdn_file_comments')
            .select('file_id')
            .eq('id', commentId)
            .single();

        const { error } = await supabase
            .from('cdn_file_comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            return { success: false, error: error.message };
        }

        // Log action
        if (comment) {
            await supabase.rpc('cdn_log_action', {
                p_action_type: 'comment_delete',
                p_file_id: comment.file_id,
                p_metadata: { comment_id: commentId },
            });
        }

        revalidatePath('/[locale]/admin/cdn', 'page');

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
