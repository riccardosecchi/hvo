'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, Edit2, Trash2, MessageSquare, Reply, X, User } from 'lucide-react';
import type { CdnFileComment } from '@/lib/types/cdn';
import { getComments, createComment, updateComment, deleteComment } from '@/lib/actions/cdn/comments';

interface CdnCommentsProps {
    fileId: string;
    onClose?: () => void;
}

export function CdnComments({ fileId, onClose }: CdnCommentsProps) {
    const [comments, setComments] = useState<CdnFileComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        loadComments();
    }, [fileId]);

    async function loadComments() {
        setLoading(true);
        const result = await getComments(fileId);
        if (result.success && result.data) {
            setComments(result.data);
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!newComment.trim()) return;

        await createComment({
            fileId,
            text: newComment,
            parentCommentId: replyTo || undefined,
        });

        setNewComment('');
        setReplyTo(null);
        await loadComments();
    }

    async function handleUpdate(commentId: string) {
        if (!editText.trim()) return;

        await updateComment(commentId, editText);
        setEditingId(null);
        setEditText('');
        await loadComments();
    }

    async function handleDelete(commentId: string) {
        if (confirm('Delete this comment?')) {
            await deleteComment(commentId);
            await loadComments();
        }
    }

    // Organize comments into threads
    const rootComments = comments.filter(c => !c.parent_comment_id);
    const replies = comments.filter(c => c.parent_comment_id);

    function getReplies(parentId: string): CdnFileComment[] {
        return replies.filter(r => r.parent_comment_id === parentId);
    }

    function renderComment(comment: CdnFileComment, depth = 0) {
        const isEditing = editingId === comment.id;
        const commentReplies = getReplies(comment.id);

        return (
            <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l border-white/[0.06] pl-4' : ''}`}>
                <div className="py-3">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-white/60" />
                        </div>
                        <span className="text-sm text-white font-medium">
                            {(comment as any).profiles?.full_name || 'Admin'}
                        </span>
                        <span className="text-xs text-white/40">
                            {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                        </span>
                        {comment.is_edited && (
                            <span className="text-xs text-white/30">(edited)</span>
                        )}
                    </div>

                    {/* Content */}
                    {isEditing ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/[0.06] rounded-lg text-white text-sm"
                                autoFocus
                            />
                            <button
                                onClick={() => handleUpdate(comment.id)}
                                className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-2 bg-white/5 text-white rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-white/80 whitespace-pre-wrap">
                            {comment.comment_text}
                        </p>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => {
                                    setReplyTo(comment.id);
                                    setNewComment('');
                                }}
                                className="text-xs text-white/40 hover:text-white flex items-center gap-1"
                            >
                                <Reply className="w-3 h-3" />
                                Reply
                            </button>
                            <button
                                onClick={() => {
                                    setEditingId(comment.id);
                                    setEditText(comment.comment_text);
                                }}
                                className="text-xs text-white/40 hover:text-white flex items-center gap-1"
                            >
                                <Edit2 className="w-3 h-3" />
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(comment.id)}
                                className="text-xs text-white/40 hover:text-red-400 flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Replies */}
                {commentReplies.map(reply => renderComment(reply, depth + 1))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[var(--surface-1)] border-l border-white/[0.06]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <h3 className="font-medium text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments ({comments.length})
                </h3>
                {onClose && (
                    <button onClick={onClose} className="p-1 text-white/60 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {loading ? (
                    <div className="text-center text-white/40 py-8">Loading...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-white/40 py-8">
                        No comments yet. Be the first!
                    </div>
                ) : (
                    rootComments.map(comment => renderComment(comment))
                )}
            </div>

            {/* Reply indicator */}
            {replyTo && (
                <div className="px-4 py-2 bg-white/5 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-white/60">
                        Replying to comment...
                    </span>
                    <button
                        onClick={() => setReplyTo(null)}
                        className="text-xs text-white/40 hover:text-white"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* New comment form */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/[0.06] rounded-lg text-white placeholder-white/30 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="p-2 bg-[var(--accent)] text-white rounded-lg disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
