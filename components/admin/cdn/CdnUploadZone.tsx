'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  createUploadSession,
  completeUpload,
  updateSessionProgress,
} from '@/lib/actions/cdn/upload';
import { uploadFileDirect, uploadFileInChunks, generateStoragePath } from '@/lib/cdn/upload';

interface CdnUploadZoneProps {
  currentFolderId: string | null;
  onClose: () => void;
  onComplete: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  sessionToken?: string;
}

export function CdnUploadZone({
  currentFolderId,
  onClose,
  onComplete,
}: CdnUploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());

  const handleUpload = useCallback(
    async (files: File[]) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const file of files) {
        const fileId = `${file.name}-${Date.now()}`;

        // Add to uploading state
        setUploadingFiles((prev) => {
          const next = new Map(prev);
          next.set(fileId, {
            file,
            progress: 0,
            status: 'uploading',
          });
          return next;
        });

        try {
          const storagePath = generateStoragePath(user.id, file.name);
          const CHUNK_THRESHOLD = 5 * 1024 * 1024; // 5MB

          if (file.size <= CHUNK_THRESHOLD) {
            // Direct upload for small files
            await uploadFileDirect(file, storagePath, (progress) => {
              setUploadingFiles((prev) => {
                const next = new Map(prev);
                const existing = next.get(fileId);
                if (existing) {
                  next.set(fileId, {
                    ...existing,
                    progress,
                  });
                }
                return next;
              });
            });

            // Create file record
            const fileResult = await supabase.from('cdn_files').insert({
              name: file.name,
              display_name: file.name,
              mime_type: file.type || 'application/octet-stream',
              file_size: file.size,
              storage_path: storagePath,
              folder_id: currentFolderId,
              uploaded_by: user.id,
            });

            if (fileResult.error) throw fileResult.error;
          } else {
            // Chunked upload for large files
            const sessionResult = await createUploadSession({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || 'application/octet-stream',
              folderId: currentFolderId,
              isEncrypted: false,
            });

            if (!sessionResult.success || !sessionResult.data) {
              throw new Error(sessionResult.error || 'Failed to create upload session');
            }

            const sessionToken = sessionResult.data.session_token;

            setUploadingFiles((prev) => {
              const next = new Map(prev);
              const existing = next.get(fileId);
              if (existing) {
                next.set(fileId, {
                  ...existing,
                  sessionToken,
                });
              }
              return next;
            });

            // Upload in chunks
            await uploadFileInChunks(
              file,
              sessionToken,
              storagePath,
              (progress) => {
                setUploadingFiles((prev) => {
                  const next = new Map(prev);
                  const existing = next.get(fileId);
                  if (existing) {
                    next.set(fileId, {
                      ...existing,
                      progress: progress.percentage,
                    });
                  }
                  return next;
                });
              }
            );

            // Complete upload
            const completeResult = await completeUpload({
              sessionToken,
              storagePath,
              displayName: file.name,
            });

            if (!completeResult.success) {
              throw new Error(completeResult.error || 'Failed to complete upload');
            }
          }

          // Mark as completed
          setUploadingFiles((prev) => {
            const next = new Map(prev);
            const existing = next.get(fileId);
            if (existing) {
              next.set(fileId, {
                ...existing,
                progress: 100,
                status: 'completed',
              });
            }
            return next;
          });
        } catch (error: any) {
          console.error('Upload error:', error);
          setUploadingFiles((prev) => {
            const next = new Map(prev);
            const existing = next.get(fileId);
            if (existing) {
              next.set(fileId, {
                ...existing,
                status: 'error',
                error: error.message || 'Upload failed',
              });
            }
            return next;
          });
        }
      }

      // Check if all uploads are done
      setTimeout(() => {
        const allDone = Array.from(uploadingFiles.values()).every(
          (f) => f.status === 'completed' || f.status === 'error'
        );
        if (allDone) {
          onComplete();
        }
      }, 1000);
    },
    [currentFolderId, onComplete, uploadingFiles]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleUpload(acceptedFiles);
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const hasUploads = uploadingFiles.size > 0;
  const allCompleted = Array.from(uploadingFiles.values()).every(
    (f) => f.status === 'completed' || f.status === 'error'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-2xl bg-[var(--surface-1)] border border-white/[0.06] rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">Upload Files</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Drop zone */}
          {!hasUploads && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
              <p className="text-white font-medium mb-2">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                or click to browse (max 5GB per file)
              </p>
            </div>
          )}

          {/* Upload list */}
          {hasUploads && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Array.from(uploadingFiles.entries()).map(([fileId, uploadFile]) => (
                <div
                  key={fileId}
                  className="p-4 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <FileIcon className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm text-white font-medium truncate">
                          {uploadFile.file.name}
                        </span>
                        {uploadFile.status === 'completed' && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>

                      {uploadFile.status === 'uploading' && (
                        <div className="space-y-1">
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent)] transition-all duration-300"
                              style={{ width: `${uploadFile.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">
                            {uploadFile.progress.toFixed(0)}%
                          </p>
                        </div>
                      )}

                      {uploadFile.status === 'completed' && (
                        <p className="text-xs text-green-500">Upload complete</p>
                      )}

                      {uploadFile.status === 'error' && (
                        <p className="text-xs text-red-500">{uploadFile.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasUploads && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.06]">
            {allCompleted ? (
              <button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="px-4 py-2 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                Done
              </button>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Uploading...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
