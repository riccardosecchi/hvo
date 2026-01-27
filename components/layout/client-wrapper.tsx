"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";

interface ClientWrapperProps {
    locale: string;
    children: React.ReactNode;
}

export function ClientWrapper({ locale, children }: ClientWrapperProps) {
    const pathname = usePathname();
    const isAdminRoute = pathname.includes("/admin");

    return (
        <>
            {!isAdminRoute && <Header locale={locale} />}
            <main className="relative">{children}</main>
            {!isAdminRoute && <Footer />}
        </>
    );
}
