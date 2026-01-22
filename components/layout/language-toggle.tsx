"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const newLocale = locale === "it" ? "en" : "it";
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);

    startTransition(() => {
      router.replace(newPathname);
    });
  };

  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50 text-sm font-medium transition-all hover:bg-muted hover:border-border disabled:opacity-50"
    >
      <span className={locale === "it" ? "text-primary" : "text-muted-foreground"}>
        IT
      </span>
      <span className="text-muted-foreground">/</span>
      <span className={locale === "en" ? "text-primary" : "text-muted-foreground"}>
        EN
      </span>
    </button>
  );
}
