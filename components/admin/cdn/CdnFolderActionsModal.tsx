'use client';

import { useState } from 'react';
import { X, Folder, Loader2, Trash2, FolderInput, Edit2 } from 'lucide-react';
import { updateFolder, deleteFolder, moveFolder } from '@/lib/actions/cdn/folders';
import type { CdnFolder } from '@/lib/types/cdn';

interface CdnFolderActionsModalProps {
    folder: CdnFolder;
    allFolders: CdnFolder[];
    onClose: () => void;
    onSuccess: () => void;
}

export function CdnFolderActionsModal({
    folder,
    allFolders,
    onClose,
    onSuccess,
}: CdnFolderActionsModalProps) {
    const [mode, setMode] = useState<'menu' | 'rename' | 'move' | 'delete'>('menu');
    const [name, setName] = useState(folder.name);
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get available folders for move (exclude self and descendants)
    const availableFolders = allFolders.filter(f =>
        f.id !== folder.id && !f.path.startsWith(folder.path + '/')
    );

    async function handleRename() {
        if (!name.trim() || name === folder.name) {
            onClose();
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await updateFolder(folder.id, { name: name.trim() });
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || 'Failed to rename folder');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleMove() {
        setLoading(true);
        setError(null);

        try {
            const result = await moveFolder(folder.id, targetFolderId);
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || 'Failed to move folder');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        setLoading(true);
        setError(null);

        try {
            const result = await deleteFolder(folder.id, { moveFilesToParent: true });
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || 'Failed to delete folder');
            }
        } catch (err: any) {
            setError(err.message);
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
                        <Folder className="w-5 h-5 text-[var(--accent)]" />
                        {mode === 'menu' && 'Folder Options'}
                        {mode === 'rename' && 'Rename Folder'}
                        {mode === 'move' && 'Move Folder'}
                        {mode === 'delete' && 'Delete Folder'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Menu */}
                    {mode === 'menu' && (
                        <div className="space-y-2">
                            <p className="text-sm text-white/60 mb-4">
                                Folder: <span className="text-white font-medium">{folder.name}</span>
                            </p>

                            <button
                                onClick={() => setMode('rename')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                            >
                                <Edit2 className="w-5 h-5 text-[var(--text-muted)]" />
                                <div>
                                    <p className="text-white font-medium">Rename</p>
                                    <p className="text-xs text-white/40">Change folder name</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('move')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                            >
                                <FolderInput className="w-5 h-5 text-[var(--text-muted)]" />
                                <div>
                                    <p className="text-white font-medium">Move</p>
                                    <p className="text-xs text-white/40">Move to another location</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('delete')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-left"
                            >
                                <Trash2 className="w-5 h-5 text-red-400" />
                                <div>
                                    <p className="text-red-400 font-medium">Delete</p>
                                    <p className="text-xs text-white/40">Remove this folder</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Rename */}
                    {mode === 'rename' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    New Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]/50"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-400">{error}</p>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setMode('menu')}
                                    className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleRename}
                                    disabled={loading || !name.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Rename
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Move */}
                    {mode === 'move' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Move to
                                </label>
                                <select
                                    value={targetFolderId || ''}
                                    onChange={(e) => setTargetFolderId(e.target.value || null)}
                                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]/50"
                                >
                                    <option value="">Root (Home)</option>
                                    {availableFolders.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.path}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <p className="text-sm text-red-400">{error}</p>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setMode('menu')}
                                    className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleMove}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Move
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Delete */}
                    {mode === 'delete' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-white mb-2">
                                    Are you sure you want to delete <strong>{folder.name}</strong>?
                                </p>
                                <p className="text-sm text-white/60">
                                    Files in this folder will be moved to the parent folder.
                                </p>
                            </div>

                            {error && (
                                <p className="text-sm text-red-400">{error}</p>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setMode('menu')}
                                    className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
