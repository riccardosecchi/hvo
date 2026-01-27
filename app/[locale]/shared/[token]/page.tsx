import { notFound } from 'next/navigation';
import { SharedFileView } from '@/components/public/cdn/SharedFileView';
import { validateShareLink } from '@/lib/actions/cdn/share';

interface PageProps {
    params: {
        locale: string;
        token: string;
    };
}

export default async function SharedFilePage({ params }: PageProps) {
    const { token, locale } = params;

    // Validate the share link (without password initially)
    const result = await validateShareLink(token);

    // If link is completely invalid (not just password protected)
    if (!result.success && result.error !== 'Password required') {
        notFound();
    }

    const requiresPassword = result.error === 'Password required';

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <SharedFileView
                token={token}
                locale={locale}
                initialFile={result.data?.file}
                requiresPassword={requiresPassword}
                allowPreview={result.data?.allowPreview ?? true}
                allowDownload={result.data?.allowDownload ?? true}
            />
        </div>
    );
}

export async function generateMetadata({ params }: PageProps) {
    const result = await validateShareLink(params.token);

    if (!result.success || !result.data?.file) {
        return {
            title: 'Shared File',
        };
    }

    return {
        title: `${result.data.file.display_name} | HVO`,
        description: `Shared file: ${result.data.file.display_name}`,
    };
}
