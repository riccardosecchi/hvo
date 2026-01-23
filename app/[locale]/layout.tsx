import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header, Footer } from "@/components/layout";
import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title = "HVO Events";
  const description =
    locale === "it"
      ? "Eventi underground di musica elettronica - Tech House, House, Latin House, Techno"
      : "Underground electronic music events - Tech House, House, Latin House, Techno";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "it" ? "it_IT" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  const messages = await getMessages();

  // Check if we're on an admin route - hide header/footer for admin pages
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const isAdminRoute = pathname.includes("/admin");

  return (
    <html lang={locale} className="dark">
      <body className="min-h-screen bg-black">
        <NextIntlClientProvider messages={messages}>
          {!isAdminRoute && <Header locale={locale} />}
          <main className="relative">{children}</main>
          {!isAdminRoute && <Footer />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

