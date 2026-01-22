import { Sidebar } from "@/components/admin/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen">
      <Sidebar locale={locale} />
      <main className="md:ml-64 min-h-screen p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
