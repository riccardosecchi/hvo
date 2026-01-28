"use client";

import { use } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import { ToastProvider } from "@/components/ui/toast";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = use(params);
  const pathname = usePathname();

  // Pages that don't need the sidebar
  const authPages = ["/admin/login", "/admin/register"];
  const isAuthPage = authPages.some(page => pathname.includes(page));

  // Auth pages (login/register) - no sidebar, centered content
  if (isAuthPage) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-black">
          {children}
        </div>
      </ToastProvider>
    );
  }

  // Dashboard pages - with sidebar
  return (
    <ToastProvider>
      <div className="min-h-screen bg-black">
        <Sidebar locale={locale} />
        <main className="md:ml-56 min-h-screen p-4 pt-20 md:p-6 md:pt-6">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
