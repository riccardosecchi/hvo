'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share2, ZoomIn, ZoomOut, RotateCw, FileText, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { format } from 'date-fns';
import type { CdnFile } from '@/lib/types/cdn';
import { getFileDownloadUrl } from '@/lib/actions/cdn/files';

interface CdnFilePreviewProps {
    file: CdnFile;
    onClose: () => void;
    onShare?: () => void;
}

export function CdnFilePreview({ file, onClose, onShare }: CdnFilePreviewProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        loadFileUrl();

        // Close on ESC
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [file.id]);

    async function loadFileUrl() {
        setLoading(true);
        const result = await getFileDownloadUrl(file.id);
        if (result.success && result.data) {
            setUrl(result.data.url);
        }
        setLoading(false);
    }

    async function handleDownload() {
        if (url) {
            window.open(url, '_blank');
        }
    }

    const isImage = file.mime_type.startsWith('image/');
    const isPdf = file.mime_type === 'application/pdf';
    const isVideo = file.mime_type.startsWith('video/');
    const isAudio = file.mime_type.startsWith('audio/');
    const isText = file.mime_type.startsWith('text/') ||
        ['application/json', 'application/javascript', 'application/xml'].includes(file.mime_type);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-white font-medium truncate max-w-md">{file.display_name}</h2>
                        <p className="text-sm text-white/40">
                            {(file.file_size / 1024 / 1024).toFixed(2)} MB • {format(new Date(file.created_at), 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isImage && (
                        <>
                            <button
                                onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setZoom(1)}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <RotateCw className="w-5 h-5" />
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-2" />
                        </>
                    )}

                    {onShare && (
                        <button
                            onClick={onShare}
                            className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    )}

                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center overflow-hidden p-8">
                {loading ? (
                    <div className="text-white/40">Loading...</div>
                ) : !url ? (
                    <div className="text-white/40">Failed to load file</div>
                ) : isImage ? (
                    <img
                        src={url}
                        alt={file.display_name}
                        className="max-w-full max-h-full object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoom})` }}
                    />
                ) : isPdf ? (
                    <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                        className="w-full h-full max-w-4xl rounded-lg bg-white"
                        title={file.display_name}
                    />
                ) : isVideo ? (
                    <video
                        src={url}
                        controls
                        autoPlay
                        className="max-w-full max-h-full rounded-lg"
                    />
                ) : isAudio ? (
                    <div className="w-full max-w-md p-8 bg-white/5 rounded-2xl">
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Volume2 className="w-12 h-12 text-[var(--accent)]" />
                        </div>
                        <h3 className="text-white font-medium text-center mb-4 truncate">{file.display_name}</h3>
                        <audio src={url} controls className="w-full" />
                    </div>
                ) : (
                    <div className="text-center text-white/60">
                        <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-12 h-12 text-white/40" />
                        </div>
                        <p className="mb-4">Preview not available for this file type</p>
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                        >
                            Download to view
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
