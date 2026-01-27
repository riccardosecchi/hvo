'use client';

import { useState } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { createFolder } from '@/lib/actions/cdn/folders';

interface CdnCreateFolderModalProps {
    parentFolderId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function CdnCreateFolderModal({
    parentFolderId,
    onClose,
    onSuccess,
}: CdnCreateFolderModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('Folder name is required');
            return;
        }

        // Validate folder name
        if (/[<>:"/\\|?*]/.test(name)) {
            setError('Folder name contains invalid characters');
            return;
        }

        if (name.startsWith('.')) {
            setError('Folder name cannot start with a dot');
            return;
        }

        setLoading(true);

        try {
            const result = await createFolder({
                name: name.trim(),
                description: description.trim() || undefined,
                parentFolderId: parentFolderId,
            });

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || 'Failed to create folder');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-md bg-[var(--surface-1)] border border-white/[0.06] rounded-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-[var(--accent)]" />
                        Create Folder
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Folder Name */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Folder Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter folder name"
                            className="w-full px-3 py-2 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)]/50"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={3}
                            className="w-full px-3 py-2 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)]/50 resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Folder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
