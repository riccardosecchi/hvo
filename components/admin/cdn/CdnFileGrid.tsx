'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileArchive,
  File,
  Lock,
  Download,
  Trash2,
  MoreVertical,
  Eye,
  Share2,
  FolderInput,
} from 'lucide-react';
import type { CdnFile, CdnFolder, FileViewMode } from '@/lib/types/cdn';
import { deleteFile, getFileDownloadUrl } from '@/lib/actions/cdn/files';
import { useRouter } from 'next/navigation';

interface CdnFileGridProps {
  files: CdnFile[];
  folders: CdnFolder[];
  allFolders?: CdnFolder[];
  viewMode: FileViewMode;
  selectedFiles: Set<string>;
  onFileSelect: (fileId: string) => void;
  onFolderClick: (folderId: string | null) => void;
  currentFolderId: string | null;
  onFilePreview?: (file: CdnFile) => void;
  onFileShare?: (file: CdnFile) => void;
  onFileMove?: (file: CdnFile) => void;
  onFolderEdit?: (folder: CdnFolder) => void;
  onFolderShare?: (folder: CdnFolder) => void;
  onFileDrop?: (fileIds: string[], folderId: string | null) => void;
}

export function CdnFileGrid({
  files,
  folders,
  allFolders,
  viewMode,
  selectedFiles,
  onFileSelect,
  onFolderClick,
  onFilePreview,
  onFileShare,
  onFileMove,
  onFolderEdit,
  onFolderShare,
  onFileDrop,
}: CdnFileGridProps) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onClick={() => onFolderClick(folder.id)}
            onEdit={() => onFolderEdit?.(folder)}
            onShare={() => onFolderShare?.(folder)}
            onDrop={(fileIds) => onFileDrop?.(fileIds, folder.id)}
          />
        ))}
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            isSelected={selectedFiles.has(file.id)}
            onSelect={() => onFileSelect(file.id)}
            onPreview={() => onFilePreview?.(file)}
            onShare={() => onFileShare?.(file)}
            onMove={() => onFileMove?.(file)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-1)] border border-white/[0.06] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-white/[0.06]">
          <tr className="text-left text-xs text-[var(--text-muted)] uppercase tracking-wider">
            <th className="px-6 py-3 font-medium">Name</th>
            <th className="px-6 py-3 font-medium hidden md:table-cell">Size</th>
            <th className="px-6 py-3 font-medium hidden lg:table-cell">Modified</th>
            <th className="px-6 py-3 font-medium w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {folders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              onClick={() => onFolderClick(folder.id)}
              onEdit={() => onFolderEdit?.(folder)}
              onShare={() => onFolderShare?.(folder)}
              onDrop={(fileIds) => onFileDrop?.(fileIds, folder.id)}
            />
          ))}
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              isSelected={selectedFiles.has(file.id)}
              onSelect={() => onFileSelect(file.id)}
              onPreview={() => onFilePreview?.(file)}
              onShare={() => onFileShare?.(file)}
              onMove={() => onFileMove?.(file)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Folder Card (Grid View)
function FolderCard({
  folder,
  onClick,
  onEdit,
  onShare,
  onDrop,
}: {
  folder: CdnFolder;
  onClick: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onDrop?: (fileIds: string[]) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const fileId = e.dataTransfer.getData('application/cdn-file-id');
    if (fileId) {
      onDrop?.([fileId]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative p-4 bg-[var(--surface-1)] border rounded-lg transition-all ${isDragOver
        ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20'
        : 'border-white/[0.06] hover:border-[var(--accent)]/30 hover:bg-[var(--surface-2)]'
        }`}
    >
      <button
        onClick={onClick}
        className="flex items-start gap-3 text-left w-full"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-md bg-[var(--accent)]/10 flex items-center justify-center">
          <Folder className="w-5 h-5 text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate group-hover:text-[var(--accent)] transition-colors">
            {folder.name}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {format(new Date(folder.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      </button>

      {/* Folder actions */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1.5 rounded-md bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 py-1 bg-[var(--surface-2)] border border-white/10 rounded-lg shadow-xl z-20">
                <button
                  onClick={() => { setShowMenu(false); onEdit?.(); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <MoreVertical className="w-4 h-4" />
                  Options
                </button>
                <button
                  onClick={() => { setShowMenu(false); onShare?.(); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Folder Row (List View)
function FolderRow({
  folder,
  onClick,
  onEdit,
  onShare,
  onDrop,
}: {
  folder: CdnFolder;
  onClick: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onDrop?: (fileIds: string[]) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const fileId = e.dataTransfer.getData('application/cdn-file-id');
    if (fileId) {
      onDrop?.([fileId]);
    }
  };

  return (
    <tr
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${isDragOver ? 'bg-[var(--accent)]/10' : ''
        }`}
    >
      <td className="px-6 py-4" onClick={onClick}>
        <div className="flex items-center gap-3">
          <Folder className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
          <span className="text-sm text-white font-medium truncate">{folder.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-[var(--text-muted)] hidden md:table-cell">
        —
      </td>
      <td className="px-6 py-4 text-sm text-[var(--text-muted)] hidden lg:table-cell">
        {format(new Date(folder.created_at), 'MMM d, yyyy')}
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 py-1 bg-[var(--surface-2)] border border-white/10 rounded-lg shadow-xl z-20">
                <button
                  onClick={() => { setShowMenu(false); onEdit?.(); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5"
                >
                  Options
                </button>
                <button
                  onClick={() => { setShowMenu(false); onShare?.(); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5"
                >
                  Share
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// File Card (Grid View)
function FileCard({
  file,
  isSelected,
  onSelect,
  onPreview,
  onShare,
  onMove,
}: {
  file: CdnFile;
  isSelected: boolean;
  onSelect: () => void;
  onPreview?: () => void;
  onShare?: () => void;
  onMove?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleDownload = async () => {
    const result = await getFileDownloadUrl(file.id);
    if (result.success && result.data) {
      window.open(result.data.url, '_blank');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile(file.id);
      router.refresh();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/cdn-file-id', file.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group relative p-4 bg-[var(--surface-1)] border rounded-lg transition-all cursor-move ${isSelected
        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
        : 'border-white/[0.06] hover:border-white/10 hover:bg-[var(--surface-2)]'
        }`}
    >
      {/* Checkbox */}
      <label className="absolute top-3 left-3 z-10 cursor-pointer">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 rounded border-white/20 bg-white/5 text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
        />
      </label>

      {/* File icon */}
      <div className="flex flex-col items-center gap-3 pt-6">
        <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center relative">
          <FileIcon mimeType={file.mime_type} className="w-8 h-8" />
          {file.is_encrypted && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="w-full text-center space-y-1">
          <h3
            className="text-sm font-medium text-white truncate px-2"
            title={file.display_name}
          >
            {file.display_name}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {formatFileSize(file.file_size)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-md bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-[var(--surface-2)] border border-white/10 rounded-lg shadow-xl z-20">
                <button
                  onClick={() => { setShowMenu(false); onPreview?.(); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => { setShowMenu(false); onShare?.(); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={() => { setShowMenu(false); onMove?.(); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <FolderInput className="w-4 h-4" />
                  Move to...
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// File Row (List View)
function FileRow({
  file,
  isSelected,
  onSelect,
  onPreview,
  onShare,
  onMove,
}: {
  file: CdnFile;
  isSelected: boolean;
  onSelect: () => void;
  onPreview?: () => void;
  onShare?: () => void;
  onMove?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleDownload = async () => {
    const result = await getFileDownloadUrl(file.id);
    if (result.success && result.data) {
      window.open(result.data.url, '_blank');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile(file.id);
      router.refresh();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/cdn-file-id', file.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <tr
      draggable
      onDragStart={handleDragStart}
      className={`hover:bg-white/[0.02] transition-colors cursor-move ${isSelected ? 'bg-[var(--accent)]/5' : ''
        }`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
          />
          <FileIcon mimeType={file.mime_type} className="w-5 h-5 flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm text-white font-medium truncate">
              {file.display_name}
            </span>
            {file.is_encrypted && (
              <Lock className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-[var(--text-muted)] hidden md:table-cell">
        {formatFileSize(file.file_size)}
      </td>
      <td className="px-6 py-4 text-sm text-[var(--text-muted)] hidden lg:table-cell">
        {format(new Date(file.updated_at), 'MMM d, yyyy')}
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-[var(--surface-2)] border border-white/10 rounded-lg shadow-xl z-20">
                <button
                  onClick={() => { setShowMenu(false); onPreview?.(); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => { setShowMenu(false); onShare?.(); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={() => { setShowMenu(false); onMove?.(); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <FolderInput className="w-4 h-4" />
                  Move to...
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// File Icon Helper
function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const type = mimeType.split('/')[0];

  switch (type) {
    case 'image':
      return <ImageIcon className={className} />;
    case 'video':
      return <Video className={className} />;
    case 'audio':
      return <Music className={className} />;
    default:
      if (mimeType.includes('zip') || mimeType.includes('archive')) {
        return <FileArchive className={className} />;
      }
      if (mimeType.includes('pdf') || mimeType.includes('document')) {
        return <FileText className={className} />;
      }
      return <File className={className} />;
  }
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
