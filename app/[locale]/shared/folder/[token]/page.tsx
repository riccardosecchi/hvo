import { notFound } from 'next/navigation';
import { SharedFolderView } from '@/components/public/cdn/SharedFolderView';
import { validateFolderShareLink } from '@/lib/actions/cdn/folder-share';

interface PageProps {
    params: Promise<{
        locale: string;
        token: string;
    }>;
}

export default async function SharedFolderPage({ params }: PageProps) {
    const { token, locale } = await params;

    // Validate the share link (without password initially)
    const result = await validateFolderShareLink(token);

    // If link is completely invalid (not just password protected)
    if (!result.success && result.error !== 'Password required') {
        // Return a debuggable error view instead of generic 404
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 text-red-500 font-bold text-xl">!</div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Link Error</h1>
                    <p className="text-[#888] mb-4">The shared folder link could not be validated.</p>
                    {/* Debug info - helpful for diagnosis */}
                    <div className="bg-red-900/20 text-red-200 p-3 rounded text-sm font-mono break-all">
                        Error: {result.error || 'Unknown error'}
                    </div>
                    <div className="mt-4 text-xs text-[#666]">
                        Token: {token.slice(0, 8)}...
                    </div>
                </div>
            </div>
        );
    }

    const requiresPassword = result.error === 'Password required';
    // If password is required, don't pass the partial data object (which only contains {requiresPassword: true})
    // otherwise the component will try to render folder data that doesn't exist
    const initialData = requiresPassword ? undefined : result.data;

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <SharedFolderView
                token={token}
                locale={locale}
                initialData={initialData as any}
                requiresPassword={requiresPassword}
            />
        </div>
    );
}

export async function generateMetadata({ params }: PageProps) {
    const { token } = await params;
    const result = await validateFolderShareLink(token);

    if (!result.success || !result.data?.folder) {
        return {
            title: 'Shared Folder',
        };
    }

    return {
        title: `${result.data.folder.name} | HVO`,
        description: `Shared folder: ${result.data.folder.name}`,
    };
}
