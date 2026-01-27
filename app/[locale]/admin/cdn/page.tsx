import { Suspense } from 'react';
import { getFiles } from '@/lib/actions/cdn/files';
import { getFolders, getFolderContents } from '@/lib/actions/cdn/folders';
import { CdnBrowser } from '@/components/admin/cdn/CdnBrowser';

interface PageProps {
  params: {
    locale: string;
  };
  searchParams: {
    folder?: string;
  };
}

export default async function CdnPage({ params, searchParams }: PageProps) {
  const folderId = searchParams.folder || null;

  // Fetch initial data
  const [filesResult, foldersResult, contentsResult] = await Promise.all([
    getFiles(folderId),
    getFolders(),
    getFolderContents(folderId),
  ]);

  const files = filesResult.success ? filesResult.data || [] : [];
  const allFolders = foldersResult.success ? foldersResult.data || [] : [];
  const currentFolder = contentsResult.success ? (contentsResult.data?.folder || null) : null;
  const subfolders = contentsResult.success ? contentsResult.data?.subfolders || [] : [];

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col">
      <Suspense fallback={<CdnLoadingSkeleton />}>
        <CdnBrowser
          initialFiles={files}
          initialFolders={subfolders}
          allFolders={allFolders}
          currentFolder={currentFolder}
          currentFolderId={folderId}
          locale={params.locale}
        />
      </Suspense>
    </div>
  );
}

function CdnLoadingSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-40 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
