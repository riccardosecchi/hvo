'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Download, RotateCcw, Trash2, X, User } from 'lucide-react';
import type { CdnFileVersion } from '@/lib/types/cdn';
import { getVersionHistory, restoreVersion, deleteVersion, getVersionDownloadUrl } from '@/lib/actions/cdn/versions';

interface CdnVersionsProps {
    fileId: string;
    currentVersion: number;
    onClose?: () => void;
    onRestore?: () => void;
}

export function CdnVersions({ fileId, currentVersion, onClose, onRestore }: CdnVersionsProps) {
    const [versions, setVersions] = useState<CdnFileVersion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVersions();
    }, [fileId]);

    async function loadVersions() {
        setLoading(true);
        const result = await getVersionHistory(fileId);
        if (result.success && result.data) {
            setVersions(result.data);
        }
        setLoading(false);
    }

    async function handleRestore(versionNumber: number) {
        if (confirm(`Restore version ${versionNumber}? This will create a new version.`)) {
            const result = await restoreVersion(fileId, versionNumber);
            if (result.success) {
                await loadVersions();
                onRestore?.();
            }
        }
    }

    async function handleDelete(versionNumber: number) {
        if (confirm(`Delete version ${versionNumber}? This cannot be undone.`)) {
            await deleteVersion(fileId, versionNumber);
            await loadVersions();
        }
    }

    async function handleDownload(versionNumber: number) {
        const result = await getVersionDownloadUrl(fileId, versionNumber);
        if (result.success && result.data) {
            window.open(result.data.url, '_blank');
        }
    }

    function formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }

    return (
        <div className="flex flex-col h-full bg-[var(--surface-1)] border-l border-white/[0.06]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <h3 className="font-medium text-white flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Version History
                </h3>
                {onClose && (
                    <button onClick={onClose} className="p-1 text-white/60 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Current version */}
            <div className="p-4 bg-[var(--accent)]/10 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">Current Version</span>
                    <span className="px-2 py-0.5 bg-[var(--accent)] text-white text-xs rounded-full">
                        v{currentVersion}
                    </span>
                </div>
                <p className="text-xs text-white/60">Latest version (cannot be deleted)</p>
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-center text-white/40 py-8">Loading...</div>
                ) : versions.length === 0 ? (
                    <div className="text-center text-white/40 py-8 px-4">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No previous versions</p>
                        <p className="text-xs mt-1">Upload a new version to start tracking history</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.06]">
                        {versions.map((version) => (
                            <div key={version.id} className="p-4 hover:bg-white/[0.02]">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-white">
                                                Version {version.version_number}
                                            </span>
                                            <span className="text-xs text-white/40">
                                                {formatSize(version.file_size)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-white/50">
                                            <User className="w-3 h-3" />
                                            <span>{(version as any).profiles?.full_name || 'Admin'}</span>
                                            <span>•</span>
                                            <span>{format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}</span>
                                        </div>
                                        {version.change_description && (
                                            <p className="text-xs text-white/60 mt-2 italic">
                                                "{version.change_description}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleDownload(version.version_number)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors"
                                    >
                                        <Download className="w-3 h-3" />
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleRestore(version.version_number)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Restore
                                    </button>
                                    <button
                                        onClick={() => handleDelete(version.version_number)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
