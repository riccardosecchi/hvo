"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    startTransition(() => {
      router.replace(newPath);
    });
  };

  return (
    <div className={`flex items-center gap-0.5 text-xs tracking-wide ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <button
        onClick={() => switchLocale("it")}
        disabled={isPending}
        className={`px-2 py-1.5 rounded-md transition-all duration-200 ${
          locale === "it"
            ? "text-white bg-white/5"
            : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
        }`}
      >
        IT
      </button>
      <span className="text-white/20 px-0.5">/</span>
      <button
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={`px-2 py-1.5 rounded-md transition-all duration-200 ${
          locale === "en"
            ? "text-white bg-white/5"
            : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
        }`}
      >
        EN
      </button>
    </div>
  );
}
