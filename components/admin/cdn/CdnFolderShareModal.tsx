'use client';

import { useState } from 'react';
import { X, Copy, FolderOpen, Check, Lock, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import type { CdnFolder } from '@/lib/types/cdn';
import { createFolderShareLink, getFolderShareLinks, revokeFolderShareLink, type FolderShareLink } from '@/lib/actions/cdn/folder-share';

interface CdnFolderShareModalProps {
    folder: CdnFolder;
    locale: string;
    onClose: () => void;
}

export function CdnFolderShareModal({ folder, locale, onClose }: CdnFolderShareModalProps) {
    const [activeLinks, setActiveLinks] = useState<FolderShareLink[]>([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    // Form state
    const [password, setPassword] = useState('');
    const [usePassword, setUsePassword] = useState(false);
    const [expiresIn, setExpiresIn] = useState<number | null>(24);
    const [maxDownloads, setMaxDownloads] = useState<number | null>(null);

    // Load existing links
    useState(() => {
        loadLinks();
    });

    async function loadLinks() {
        const result = await getFolderShareLinks(folder.id);
        if (result.success && result.data) {
            setActiveLinks(result.data);
        }
    }

    async function handleCreateLink() {
        setLoading(true);
        try {
            const result = await createFolderShareLink({
                folderId: folder.id,
                password: usePassword ? password : undefined,
                expiresIn: expiresIn || undefined,
                maxDownloads: maxDownloads || undefined,
            });

            if (result.success && result.data) {
                const baseUrl = window.location.origin;
                const link = `${baseUrl}/${locale}/shared/folder/${result.data.share_token}`;
                setGeneratedLink(link);
                await loadLinks();
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleRevoke(linkId: string) {
        await revokeFolderShareLink(linkId);
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
                        <FolderOpen className="w-5 h-5 text-[var(--accent)]" />
                        Share Folder
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
                    {/* Folder info */}
                    <div className="p-4 bg-[var(--surface-2)] rounded-lg border border-white/[0.06]">
                        <p className="text-white font-medium">{folder.name}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                            All files in this folder will be accessible
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
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {activeLinks.map((link) => (
                                    <div
                                        key={link.id}
                                        className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-lg"
                                    >
                                        <div>
                                            <p className="text-sm text-white">...{link.share_token.slice(-12)}</p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {link.download_count} downloads
                                                {link.expires_at && ` • Expires ${format(new Date(link.expires_at), 'MMM d')}`}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(link.id)}
                                            className="text-xs text-red-400 hover:text-red-300"
                                        >
                                            Revoke
                                        </button>
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
