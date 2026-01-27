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
        notFound();
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
