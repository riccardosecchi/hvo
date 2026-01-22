"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";

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
      className="relative flex items-center gap-0.5 px-1 py-1 rounded-full bg-[var(--hvo-surface)] border border-[var(--hvo-border)] text-sm font-display tracking-wider transition-all hover:border-[var(--hvo-cyan)] disabled:opacity-50 overflow-hidden"
    >
      {/* Animated background pill */}
      <motion.div
        layoutId="locale-pill"
        className="absolute h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-full bg-[var(--hvo-cyan)]"
        initial={false}
        animate={{
          x: locale === "it" ? 2 : "calc(100% + 2px)",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          boxShadow: "0 0 10px rgba(0, 229, 255, 0.4)",
        }}
      />

      <span
        className={`relative z-10 px-3 py-1 transition-colors duration-200 ${
          locale === "it"
            ? "text-[var(--hvo-void)]"
            : "text-[var(--hvo-text-muted)]"
        }`}
      >
        IT
      </span>
      <span
        className={`relative z-10 px-3 py-1 transition-colors duration-200 ${
          locale === "en"
            ? "text-[var(--hvo-void)]"
            : "text-[var(--hvo-text-muted)]"
        }`}
      >
        EN
      </span>
    </button>
  );
}
