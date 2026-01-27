'use client';

import { useState } from 'react';
import { Download, Eye, Lock, FileText, AlertCircle } from 'lucide-react';
import { validateShareLink, recordShareAccess, getSharedFileUrl } from '@/lib/actions/cdn/share';
import type { CdnFile } from '@/lib/types/cdn';

interface SharedFileViewProps {
    token: string;
    locale: string;
    initialFile?: CdnFile;
    requiresPassword: boolean;
    allowPreview: boolean;
    allowDownload: boolean;
}

export function SharedFileView({
    token,
    locale,
    initialFile,
    requiresPassword,
    allowPreview,
    allowDownload,
}: SharedFileViewProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<CdnFile | null>(initialFile || null);
    const [canPreview, setCanPreview] = useState(allowPreview);
    const [canDownload, setCanDownload] = useState(allowDownload);
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await validateShareLink(token, password);

            if (result.success && result.data) {
                setFile(result.data.file);
                setCanPreview(result.data.allowPreview);
                setCanDownload(result.data.allowDownload);
                await recordShareAccess(token, 'view');
            } else {
                setError(result.error || 'Invalid password');
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload() {
        setLoading(true);
        try {
            const result = await getSharedFileUrl(token);
            if (result.success && result.data) {
                await recordShareAccess(token, 'download');
                window.open(result.data.url, '_blank');
            }
        } finally {
            setLoading(false);
        }
    }

    async function handlePreview() {
        setLoading(true);
        try {
            const result = await getSharedFileUrl(token);
            if (result.success && result.data) {
                setPreviewUrl(result.data.url);
                await recordShareAccess(token, 'view');
            }
        } finally {
            setLoading(false);
        }
    }

    // Password form
    if (requiresPassword && !file) {
        return (
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-[#0066FF]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Protected File</h1>
                    <p className="text-[#888]">Enter the password to access this file</p>
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
                        {loading ? 'Verifying...' : 'Access File'}
                    </button>
                </form>

                <p className="text-center text-[#666] text-xs mt-6">
                    Powered by HVO
                </p>
            </div>
        );
    }

    // File not found
    if (!file) {
        return (
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">File Not Available</h1>
                <p className="text-[#888]">This link may have expired or been revoked.</p>
            </div>
        );
    }

    // File preview
    const isImage = file.mime_type.startsWith('image/');
    const isPdf = file.mime_type === 'application/pdf';
    const isVideo = file.mime_type.startsWith('video/');

    return (
        <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
            {/* Preview area */}
            {previewUrl && canPreview && (
                <div className="bg-black p-4 border-b border-white/[0.06]">
                    {isImage && (
                        <img
                            src={previewUrl}
                            alt={file.display_name}
                            className="max-w-full max-h-[400px] mx-auto rounded-lg object-contain"
                        />
                    )}
                    {isPdf && (
                        <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                            className="w-full h-[400px] rounded-lg"
                            title={file.display_name}
                        />
                    )}
                    {isVideo && (
                        <video
                            src={previewUrl}
                            controls
                            className="max-w-full max-h-[400px] mx-auto rounded-lg"
                        />
                    )}
                </div>
            )}

            {/* File info */}
            <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-[#0066FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-white truncate">
                            {file.display_name}
                        </h1>
                        <p className="text-[#888] text-sm">
                            {(file.file_size / 1024 / 1024).toFixed(2)} MB • {file.mime_type}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {canPreview && !previewUrl && (isImage || isPdf || isVideo) && (
                        <button
                            onClick={handlePreview}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/[0.06] text-white font-medium rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            <Eye className="w-5 h-5" />
                            Preview
                        </button>
                    )}

                    {canDownload && (
                        <button
                            onClick={handleDownload}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0066FF] text-white font-medium rounded-lg hover:bg-[#0055DD] transition-colors disabled:opacity-50"
                        >
                            <Download className="w-5 h-5" />
                            Download
                        </button>
                    )}
                </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
                <p className="text-center text-[#666] text-xs">
                    Powered by HVO
                </p>
            </div>
        </div>
    );
}
