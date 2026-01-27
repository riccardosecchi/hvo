'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { CdnFile, CdnFolder, FileViewMode } from '@/lib/types/cdn';
import { CdnHeader } from './CdnHeader';
import { CdnFileGrid } from './CdnFileGrid';
import { CdnUploadZone } from './CdnUploadZone';
import { CdnFilePreview } from './CdnFilePreview';
import { CdnShareModal } from './CdnShareModal';
import { CdnCreateFolderModal } from './CdnCreateFolderModal';
import { CdnFolderActionsModal } from './CdnFolderActionsModal';
import { CdnFolderShareModal } from './CdnFolderShareModal';
import { CdnMoveFileModal } from './CdnMoveFileModal';
import { moveFiles } from '@/lib/actions/cdn/files';
import { Upload, FolderPlus } from 'lucide-react';

interface CdnBrowserProps {
  initialFiles: CdnFile[];
  initialFolders: CdnFolder[];
  allFolders: CdnFolder[];
  currentFolder: CdnFolder | null;
  currentFolderId: string | null;
  locale: string;
}

export function CdnBrowser({
  initialFiles,
  initialFolders,
  allFolders,
  currentFolder,
  currentFolderId,
  locale,
}: CdnBrowserProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<FileViewMode>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [previewFile, setPreviewFile] = useState<CdnFile | null>(null);
  const [shareFile, setShareFile] = useState<CdnFile | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<CdnFolder | null>(null);
  const [sharingFolder, setSharingFolder] = useState<CdnFolder | null>(null);
  const [movingFiles, setMovingFiles] = useState<CdnFile[]>([]);

  // Filter files based on search
  const filteredFiles = searchQuery
    ? initialFiles.filter(
      (file) =>
        file.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : initialFiles;

  // Filter folders based on search
  const filteredFolders = searchQuery
    ? initialFolders.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : initialFolders;

  const handleFolderClick = useCallback(
    (folderId: string | null) => {
      const url = folderId
        ? `/${locale}/admin/cdn?folder=${folderId}`
        : `/${locale}/admin/cdn`;
      router.push(url);
    },
    [locale, router]
  );

  const handleFileSelect = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.id)));
    }
  }, [filteredFiles, selectedFiles.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)] overflow-hidden">
      {/* Header */}
      <CdnHeader
        currentFolder={currentFolder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={() => setShowUpload(true)}
        onCreateFolderClick={() => setShowCreateFolder(true)}
        onRefresh={handleRefresh}
        selectedCount={selectedFiles.size}
        onClearSelection={handleClearSelection}
      />

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Empty state */}
        {filteredFiles.length === 0 && filteredFolders.length === 0 && !searchQuery && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                <FolderPlus className="w-10 h-10 text-[var(--text-muted)]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">
                  No files yet
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Upload your first file to get started
                </p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
            </div>
          </div>
        )}

        {/* Search empty state */}
        {(filteredFiles.length > 0 || filteredFolders.length > 0 || searchQuery) && (
          <>
            {filteredFiles.length === 0 && filteredFolders.length === 0 && searchQuery && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium text-white">
                    No results found
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Try a different search term
                  </p>
                </div>
              </div>
            )}

            {/* File grid */}
            {(filteredFiles.length > 0 || filteredFolders.length > 0) && (
              <CdnFileGrid
                files={filteredFiles}
                folders={filteredFolders}
                allFolders={allFolders}
                viewMode={viewMode}
                selectedFiles={selectedFiles}
                onFileSelect={handleFileSelect}
                onFolderClick={handleFolderClick}
                currentFolderId={currentFolderId}
                onFilePreview={setPreviewFile}
                onFileShare={setShareFile}
                onFileMove={(file) => setMovingFiles([file])}
                onFolderEdit={setEditingFolder}
                onFolderShare={setSharingFolder}
                onFileDrop={async (fileIds, folderId) => {
                  await moveFiles(fileIds, folderId);
                  handleRefresh();
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <CdnUploadZone
          currentFolderId={currentFolderId}
          onClose={() => setShowUpload(false)}
          onComplete={handleRefresh}
        />
      )}

      {/* Preview modal */}
      {previewFile && (
        <CdnFilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onShare={() => {
            setShareFile(previewFile);
            setPreviewFile(null);
          }}
        />
      )}

      {/* Share modal */}
      {shareFile && (
        <CdnShareModal
          file={shareFile}
          locale={locale}
          onClose={() => setShareFile(null)}
        />
      )}

      {/* Create folder modal */}
      {showCreateFolder && (
        <CdnCreateFolderModal
          parentFolderId={currentFolderId}
          onClose={() => setShowCreateFolder(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Folder actions modal */}
      {editingFolder && (
        <CdnFolderActionsModal
          folder={editingFolder}
          allFolders={allFolders}
          onClose={() => setEditingFolder(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Folder share modal */}
      {sharingFolder && (
        <CdnFolderShareModal
          folder={sharingFolder}
          locale={locale}
          onClose={() => setSharingFolder(null)}
        />
      )}

      {/* Move file modal */}
      {movingFiles.length > 0 && (
        <CdnMoveFileModal
          files={movingFiles}
          folders={allFolders}
          currentFolderId={currentFolderId}
          onClose={() => setMovingFiles([])}
          onSuccess={() => {
            setMovingFiles([]);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
