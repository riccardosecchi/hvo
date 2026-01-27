'use client';

import { Search, Upload, Grid3x3, List, RefreshCw, X, ChevronRight, FolderPlus } from 'lucide-react';
import type { CdnFolder, FileViewMode } from '@/lib/types/cdn';
import Link from 'next/link';

interface CdnHeaderProps {
  currentFolder: CdnFolder | null;
  viewMode: FileViewMode;
  onViewModeChange: (mode: FileViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUploadClick: () => void;
  onCreateFolderClick: () => void;
  onRefresh: () => void;
  selectedCount: number;
  onClearSelection: () => void;
}

export function CdnHeader({
  currentFolder,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onUploadClick,
  onCreateFolderClick,
  onRefresh,
  selectedCount,
  onClearSelection,
}: CdnHeaderProps) {
  return (
    <div className="border-b border-white/[0.06] bg-[var(--surface-1)]">
      {/* Breadcrumbs */}
      <div className="px-6 py-3 flex items-center gap-2 text-sm">
        <Link
          href="/admin/cdn"
          className="text-[var(--text-muted)] hover:text-white transition-colors"
        >
          Home
        </Link>
        {currentFolder && (
          <>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-white font-medium">{currentFolder.name}</span>
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-white/[0.06] rounded-md text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Selected count */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-md">
              <span className="text-sm text-white">
                {selectedCount} selected
              </span>
              <button
                onClick={onClearSelection}
                className="text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-md border border-white/[0.06]">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-white'
                }`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-white'
                }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Create Folder button */}
          <button
            onClick={onCreateFolderClick}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-white/[0.06] text-white hover:bg-white/5 transition-colors"
            title="Create folder"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Folder</span>
          </button>

          {/* Upload button */}
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
