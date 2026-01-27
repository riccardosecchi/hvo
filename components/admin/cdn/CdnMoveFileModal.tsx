'use client';

import { useState } from 'react';
import { X, FolderInput, Loader2, Folder, ChevronRight, Home } from 'lucide-react';
import type { CdnFile, CdnFolder } from '@/lib/types/cdn';
import { moveFile, moveFiles } from '@/lib/actions/cdn/files';

interface CdnMoveFileModalProps {
    files: CdnFile[];
    folders: CdnFolder[];
    currentFolderId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function CdnMoveFileModal({
    files,
    folders,
    currentFolderId,
    onClose,
    onSuccess,
}: CdnMoveFileModalProps) {
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Build folder tree for selection
    const rootFolders = folders.filter(f => !f.parent_folder_id);

    function getFolderChildren(parentId: string): CdnFolder[] {
        return folders.filter(f => f.parent_folder_id === parentId);
    }

    async function handleMove() {
        setLoading(true);
        setError(null);

        try {
            if (files.length === 1) {
                const result = await moveFile(files[0].id, selectedFolderId);
                if (!result.success) {
                    setError(result.error || 'Failed to move file');
                    return;
                }
            } else {
                const result = await moveFiles(
                    files.map(f => f.id),
                    selectedFolderId
                );
                if (!result.success) {
                    setError(result.error || 'Failed to move files');
                    return;
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function renderFolder(folder: CdnFolder, depth = 0) {
        const children = getFolderChildren(folder.id);
        const isSelected = selectedFolderId === folder.id;
        const isCurrent = folder.id === currentFolderId;

        return (
            <div key={folder.id}>
                <button
                    onClick={() => !isCurrent && setSelectedFolderId(folder.id)}
                    disabled={isCurrent}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${isSelected
                            ? 'bg-[var(--accent)] text-white'
                            : isCurrent
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-white/5 text-white'
                        }`}
                    style={{ paddingLeft: `${12 + depth * 16}px` }}
                >
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{folder.name}</span>
                    {isCurrent && (
                        <span className="text-xs text-white/50 ml-auto">(current)</span>
                    )}
                </button>
                {children.map(child => renderFolder(child, depth + 1))}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-md bg-[var(--surface-1)] border border-white/[0.06] rounded-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FolderInput className="w-5 h-5 text-[var(--accent)]" />
                        Move {files.length === 1 ? 'File' : `${files.length} Files`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Selected files */}
                <div className="px-6 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <p className="text-sm text-white/60">
                        {files.length === 1 ? (
                            <span className="text-white">{files[0].display_name}</span>
                        ) : (
                            <span>{files.length} files selected</span>
                        )}
                    </p>
                </div>

                {/* Folder selection */}
                <div className="p-4 max-h-[300px] overflow-y-auto">
                    {/* Root option */}
                    <button
                        onClick={() => setSelectedFolderId(null)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left mb-2 ${selectedFolderId === null
                                ? 'bg-[var(--accent)] text-white'
                                : 'hover:bg-white/5 text-white'
                            }`}
                    >
                        <Home className="w-4 h-4" />
                        <span>Root (Home)</span>
                    </button>

                    <div className="border-t border-white/[0.06] pt-2">
                        {rootFolders.length === 0 ? (
                            <p className="text-sm text-white/40 text-center py-4">
                                No folders available
                            </p>
                        ) : (
                            rootFolders.map(folder => renderFolder(folder))
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="px-6 py-2">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 p-6 border-t border-white/[0.06]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMove}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Move Here
                    </button>
                </div>
            </div>
        </div>
    );
}
