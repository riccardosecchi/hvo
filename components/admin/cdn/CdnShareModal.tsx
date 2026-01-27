'use client';

import { useState } from 'react';
import { X, Copy, Link as LinkIcon, Check, Lock, Clock, Download, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { CdnFile, CdnShareLink } from '@/lib/types/cdn';
import { createShareLink, getShareLinks, revokeShareLink } from '@/lib/actions/cdn/share';

interface CdnShareModalProps {
    file: CdnFile;
    locale: string;
    onClose: () => void;
}

export function CdnShareModal({ file, locale, onClose }: CdnShareModalProps) {
    const [activeLinks, setActiveLinks] = useState<CdnShareLink[]>([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    // Form state
    const [password, setPassword] = useState('');
    const [usePassword, setUsePassword] = useState(false);
    const [expiresIn, setExpiresIn] = useState<number | null>(24); // hours
    const [maxDownloads, setMaxDownloads] = useState<number | null>(null);
    const [allowPreview, setAllowPreview] = useState(true);
    const [allowDownload, setAllowDownload] = useState(true);

    // Load existing links on mount
    useState(() => {
        loadLinks();
    });

    async function loadLinks() {
        const result = await getShareLinks(file.id);
        if (result.success && result.data) {
            setActiveLinks(result.data);
        }
    }

    async function handleCreateLink() {
        setLoading(true);
        try {
            const result = await createShareLink({
                fileId: file.id,
                password: usePassword ? password : undefined,
                expiresIn: expiresIn || undefined,
                maxDownloads: maxDownloads || undefined,
                allowPreview,
                allowDownload,
            });

            if (result.success && result.data) {
                const baseUrl = window.location.origin;
                const link = `${baseUrl}/${locale}/shared/${result.data.share_token}`;
                setGeneratedLink(link);
                await loadLinks();
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleRevoke(linkId: string) {
        await revokeShareLink(linkId);
        await loadLinks();
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-lg bg-[var(--surface-1)] border border-white/[0.06] rounded-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <LinkIcon className="w-5 h-5" />
                        Share File
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* File info */}
                    <div className="p-4 bg-[var(--surface-2)] rounded-lg border border-white/[0.06]">
                        <p className="text-white font-medium truncate">{file.display_name}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                            {(file.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>

                    {/* Generated link */}
                    {generatedLink && (
                        <div className="space-y-2">
                            <label className="text-sm text-[var(--text-muted)]">Share Link</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={generatedLink}
                                    readOnly
                                    className="flex-1 px-3 py-2 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white text-sm"
                                />
                                <button
                                    onClick={() => copyToClipboard(generatedLink)}
                                    className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    <div className="space-y-4">
                        {/* Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-white">
                                <Lock className="w-4 h-4" />
                                Password Protection
                            </label>
                            <button
                                onClick={() => setUsePassword(!usePassword)}
                                className={`w-10 h-6 rounded-full transition-colors ${usePassword ? 'bg-[var(--accent)]' : 'bg-white/20'
                                    }`}
                            >
                                <div
                                    className={`w-4 h-4 bg-white rounded-full transition-transform ${usePassword ? 'translate-x-5' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                        {usePassword && (
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white"
                            />
                        )}

                        {/* Expiration */}
                        <div>
                            <label className="flex items-center gap-2 text-sm text-white mb-2">
                                <Clock className="w-4 h-4" />
                                Expires In
                            </label>
                            <select
                                value={expiresIn ?? 'never'}
                                onChange={(e) => setExpiresIn(e.target.value === 'never' ? null : Number(e.target.value))}
                                className="w-full px-3 py-2 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white"
                            >
                                <option value={1}>1 hour</option>
                                <option value={24}>1 day</option>
                                <option value={168}>1 week</option>
                                <option value={720}>30 days</option>
                                <option value="never">Never</option>
                            </select>
                        </div>

                        {/* Max downloads */}
                        <div>
                            <label className="flex items-center gap-2 text-sm text-white mb-2">
                                <Download className="w-4 h-4" />
                                Max Downloads
                            </label>
                            <input
                                type="number"
                                placeholder="Unlimited"
                                min={1}
                                value={maxDownloads ?? ''}
                                onChange={(e) => setMaxDownloads(e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-3 py-2 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white"
                            />
                        </div>

                        {/* Permissions */}
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-white">
                                <input
                                    type="checkbox"
                                    checked={allowPreview}
                                    onChange={(e) => setAllowPreview(e.target.checked)}
                                    className="rounded"
                                />
                                <Eye className="w-4 h-4" />
                                Allow Preview
                            </label>
                            <label className="flex items-center gap-2 text-sm text-white">
                                <input
                                    type="checkbox"
                                    checked={allowDownload}
                                    onChange={(e) => setAllowDownload(e.target.checked)}
                                    className="rounded"
                                />
                                <Download className="w-4 h-4" />
                                Allow Download
                            </label>
                        </div>
                    </div>

                    {/* Generate button */}
                    <button
                        onClick={handleCreateLink}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 font-medium"
                    >
                        {loading ? 'Generating...' : 'Generate Link'}
                    </button>

                    {/* Active links */}
                    {activeLinks.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-white">Active Links</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {activeLinks.map((link) => (
                                    <div
                                        key={link.id}
                                        className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-lg border border-white/[0.06]"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">
                                                ...{link.share_token.slice(-12)}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {link.download_count} downloads
                                                {link.expires_at && ` • Expires ${format(new Date(link.expires_at), 'MMM d')}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyToClipboard(`${window.location.origin}/${locale}/shared/${link.share_token}`)}
                                                className="p-1.5 text-[var(--text-muted)] hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRevoke(link.id)}
                                                className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-white/5 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
