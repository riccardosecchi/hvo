'use client';

import { useState } from 'react';
import { Download, Lock, Folder, FileText, AlertCircle, Image as ImageIcon, Video, Music, FileArchive, File } from 'lucide-react';
import { validateFolderShareLink } from '@/lib/actions/cdn/folder-share';
import { getFileDownloadUrl } from '@/lib/actions/cdn/files';
import type { CdnFolder, CdnFile } from '@/lib/types/cdn';

interface SharedFolderViewProps {
    token: string;
    locale: string;
    initialData?: {
        folder: CdnFolder;
        files: any[]; // Using any[] because validateFolderShareLink returns partial file data
        allowPreview: boolean;
        allowDownload: boolean;
    };
    requiresPassword: boolean;
}

export function SharedFolderView({
    token,
    locale,
    initialData,
    requiresPassword,
}: SharedFolderViewProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState(initialData || null);
    const [loading, setLoading] = useState(false);

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await validateFolderShareLink(token, password);

            if (result.success && result.data && !(result.data as any).requiresPassword) {
                setData(result.data as any);
            } else {
                setError(result.error || 'Invalid password');
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleFileDownload(fileId: string) {
        try {
            const result = await getFileDownloadUrl(fileId);
            if (result.success && result.data) {
                window.open(result.data.url, '_blank');
            }
        } catch (err) {
            console.error('Download failed', err);
        }
    }

    // Password form
    if (requiresPassword && !data) {
        return (
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-[#0066FF]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Protected Folder</h1>
                    <p className="text-[#888]">Enter the password to access this folder</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/[0.06] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#0066FF]/50"
                        required
                    />

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-3 bg-[#0066FF] text-white font-medium rounded-lg hover:bg-[#0055DD] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Access Folder'}
                    </button>
                </form>

                <p className="text-center text-[#666] text-xs mt-6">
                    Powered by HVO
                </p>
            </div>
        );
    }

    // Not found
    if (!data) {
        return (
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Folder Not Available</h1>
                <p className="text-[#888]">This link may have expired or been revoked.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Folder className="w-6 h-6 text-[#0066FF]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white mb-1">{data.folder.name}</h1>
                        <p className="text-[#888] text-sm">
                            {data.files.length} files • Shared via HVO
                        </p>
                    </div>
                </div>
            </div>

            {/* File List */}
            <div className="divide-y divide-white/[0.06]">
                {data.files.length === 0 ? (
                    <div className="p-12 text-center text-[#666]">
                        <Folder className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>This folder is empty</p>
                    </div>
                ) : (
                    data.files.map((file) => (
                        <div key={file.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                                <FileIcon mimeType={file.mime_type} className="w-5 h-5 text-[#888]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium truncate">{file.display_name}</h3>
                                <p className="text-[#666] text-xs">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            {data.allowDownload && (
                                <button
                                    onClick={() => handleFileDownload(file.id)}
                                    className="p-2 text-[#666] hover:text-[#0066FF] hover:bg-[#0066FF]/10 rounded-lg transition-colors"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
                <p className="text-center text-[#666] text-xs">
                    Powered by HVO
                </p>
            </div>
        </div>
    );
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
    if (mimeType.startsWith('image/')) return <ImageIcon className={className} />;
    if (mimeType.startsWith('video/')) return <Video className={className} />;
    if (mimeType.startsWith('audio/')) return <Music className={className} />;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <FileArchive className={className} />;
    if (mimeType.includes('pdf')) return <FileText className={className} />;
    return <File className={className} />;
}
