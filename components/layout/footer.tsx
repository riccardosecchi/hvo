"use client";

import { useTranslations } from "next-intl";
import { Instagram } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left - Copyright */}
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            {t("copyright").replace("{year}", currentYear.toString())}
          </p>

          {/* Center - Genres */}
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[var(--text-muted)]">
            <span>Tech House</span>
            <span className="text-white/20">·</span>
            <span className="hidden sm:inline">House</span>
            <span className="hidden sm:inline text-white/20">·</span>
            <span>Techno</span>
          </div>

          {/* Right - Social */}
          <a
            href="https://instagram.com/hvo_events"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors duration-200 group"
            aria-label="Instagram"
          >
            <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs tracking-wider hidden sm:inline">@hvo_events</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
